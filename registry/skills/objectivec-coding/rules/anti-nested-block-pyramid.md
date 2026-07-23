# anti-nested-block-pyramid

> Don't nest completion-handler blocks into a callback pyramid

## Why It Matters

Each nested completion block adds another level of indentation, another `__weak`/`__strong` dance to avoid a retain cycle, and another place an error can be silently swallowed because the error-handling branch for the outer call was never written to also cover the inner ones. Beyond three or four levels, the "pyramid of doom" becomes nearly impossible to read linearly, and stepping through it in the debugger means jumping between disconnected stack frames that don't reflect the logical sequence of operations.

## Bad

```objc
- (void)completeCheckoutForOrder:(OMWOrder *)order {
    [self.paymentClient chargeCard:order.card amount:order.total completion:^(OMWCharge *charge, NSError *chargeError) {
        if (chargeError) {
            [self showError:chargeError];
            return;
        }
        [self.inventoryClient reserveItems:order.items completion:^(BOOL reserved, NSError *reserveError) {
            if (reserveError) {
                [self.paymentClient refundCharge:charge completion:^(NSError *refundError) {
                    // Three levels deep and we're already handling the
                    // failure of a failure -- error handling for the
                    // charge and the reservation are now entangled.
                    [self showError:reserveError];
                }];
                return;
            }
            [self.shippingClient scheduleShipmentForOrder:order completion:^(OMWShipment *shipment, NSError *shipError) {
                if (shipError) {
                    [self showError:shipError];
                    return;
                }
                [self.receiptClient emailReceiptForOrder:order shipment:shipment completion:^(NSError *receiptError) {
                    // Four levels of nesting; a single logical sequence
                    // (charge -> reserve -> ship -> email) is now
                    // buried in a staircase that's hard to follow.
                    if (receiptError) {
                        [self showError:receiptError];
                    }
                }];
            }];
        }];
    }];
}
```

## Good

```objc
// Flattened via named methods, each handling one step's success/error
// path and calling the next step explicitly -- reads top to bottom as
// a sequence instead of a staircase.
- (void)completeCheckoutForOrder:(OMWOrder *)order {
    [self.paymentClient chargeCard:order.card
                            amount:order.total
                        completion:^(OMWCharge *charge, NSError *error) {
        [self handleChargeResult:charge error:error forOrder:order];
    }];
}

- (void)handleChargeResult:(OMWCharge *)charge error:(NSError *)error forOrder:(OMWOrder *)order {
    if (error) {
        [self showError:error];
        return;
    }
    [self.inventoryClient reserveItems:order.items completion:^(BOOL reserved, NSError *reserveError) {
        [self handleReservationResult:reserved error:reserveError charge:charge forOrder:order];
    }];
}

- (void)handleReservationResult:(BOOL)reserved
                            error:(NSError *)error
                          charge:(OMWCharge *)charge
                        forOrder:(OMWOrder *)order {
    if (error) {
        [self.paymentClient refundCharge:charge completion:^(NSError *refundError) {
            [self showError:error];
        }];
        return;
    }
    [self.shippingClient scheduleShipmentForOrder:order completion:^(OMWShipment *shipment, NSError *shipError) {
        [self handleShipmentResult:shipment error:shipError forOrder:order];
    }];
}
```

## A Coordinated Alternative: NSOperationQueue Dependencies

```objc
// For genuinely independent steps, expressing the sequence as
// NSOperation dependencies avoids nesting entirely and makes
// cancellation and error propagation explicit, first-class concerns.
NSOperationQueue *queue = [NSOperationQueue new];
OMWChargeOperation *charge = [[OMWChargeOperation alloc] initWithOrder:order];
OMWReserveOperation *reserve = [[OMWReserveOperation alloc] initWithOrder:order];
[reserve addDependency:charge];
[queue addOperations:@[charge, reserve] waitUntilFinished:NO];
```

## See Also

- [`conc-nsoperationqueue-dependencies`](conc-nsoperationqueue-dependencies.md) - Use `NSOperation`/`NSOperationQueue` for cancellable, dependent work
- [`conc-completion-handler-single-call`](conc-completion-handler-single-call.md) - Guarantee a completion handler is invoked exactly once on every path
- [`err-completion-block-error-convention`](err-completion-block-error-convention.md) - Put the error argument last in completion blocks; nil result on failure
