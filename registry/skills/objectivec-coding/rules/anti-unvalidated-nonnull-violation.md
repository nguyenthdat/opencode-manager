# anti-unvalidated-nonnull-violation

> Don't pass `nil` across a `nonnull` boundary and hope for the best

## Why It Matters

`nonnull`/`NS_ASSUME_NONNULL_BEGIN` is a promise to both the compiler and to Swift callers that a value will never be `nil` at that boundary, but Objective-C provides no runtime enforcement of that promise on its own — passing `nil` where `nonnull` is declared usually just silently "succeeds" (message sends to `nil` are no-ops that return zero/`nil`) until it reaches code that dereferences a C struct field, indexes into something, or bridges to Swift, at which point it crashes or behaves in confusing, hard-to-trace ways far from where the actual violation occurred.

## Bad

```objc
// OMWInvoiceGenerator.h
NS_ASSUME_NONNULL_BEGIN
@interface OMWInvoiceGenerator : NSObject
- (NSData *)generatePDFForOrder:(OMWOrder *)order customer:(OMWCustomer *)customer;
@end
NS_ASSUME_NONNULL_END
```

```objc
// Caller passes nil for a nonnull parameter -- no compiler error
// because the caller's own variable isn't statically known to be nil,
// and no runtime check inside the callee either.
OMWCustomer *customer = [self.customerStore cachedCustomerForID:order.customerID];
// cachedCustomerForID: is itself annotated nullable and can genuinely
// return nil for an unknown ID -- but nothing here checks that before
// crossing into the nonnull parameter.
NSData *pdf = [self.invoiceGenerator generatePDFForOrder:order customer:customer];
```

```objc
// OMWInvoiceGenerator.m -- assumes customer is never nil because the
// header says so, and crashes deep inside PDF layout code with a
// stack trace that gives no hint the real bug was upstream.
- (NSData *)generatePDFForOrder:(OMWOrder *)order customer:(OMWCustomer *)customer {
    NSString *name = customer.fullName;   // customer is nil; -fullName
                                            // returns nil silently, but
                                            // a later CoreText call that
                                            // requires a non-nil string
                                            // crashes with an obscure error.
    return [self renderPDFWithCustomerName:name order:order];
}
```

## Good

```objc
// Validate at the boundary where the nullable value first becomes
// available, before it's allowed to cross into nonnull-declared code.
OMWCustomer *_Nullable maybeCustomer = [self.customerStore cachedCustomerForID:order.customerID];
if (maybeCustomer == nil) {
    OMWLogError(@"No cached customer for order %@; cannot generate invoice", order.identifier);
    [self showMissingCustomerError];
    return;
}
NSData *pdf = [self.invoiceGenerator generatePDFForOrder:order customer:maybeCustomer];
```

## Defense in Depth: Assert at the Entry Point

```objc
// For a public API where callers outside your control might still
// violate the contract, an explicit assertion turns a silent, delayed
// failure into an immediate, diagnosable one during development.
- (NSData *)generatePDFForOrder:(OMWOrder *)order customer:(OMWCustomer *)customer {
    NSParameterAssert(order != nil);
    NSParameterAssert(customer != nil);
    return [self renderPDFWithCustomerName:customer.fullName order:order];
}
```

## See Also

- [`null-explicit-nullable`](null-explicit-nullable.md) - Mark exceptions to the nonnull default with `nullable`/`_Nullable`
- [`lint-nullability-completeness-check`](lint-nullability-completeness-check.md) - Enable `-Wnullable-to-nonnull-conversion` and related nullability warnings
- [`api-init-chain-nil-check`](api-init-chain-nil-check.md) - Chain `self = [super init]` and bail out on `nil`
