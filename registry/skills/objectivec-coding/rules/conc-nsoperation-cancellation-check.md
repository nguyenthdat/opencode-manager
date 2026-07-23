# conc-nsoperation-cancellation-check

> Poll `isCancelled` inside long-running `NSOperation` work

## Why It Matters

Calling `-cancel` on an `NSOperation` only sets its `isCancelled` flag; it does not interrupt code already running inside `-main` or a started block operation. An operation that never checks `isCancelled` keeps consuming CPU, network, and battery long after the queue owner has moved on (e.g. the user navigated away), and its eventual completion block can still fire and mutate state nobody wants updated anymore.

## Bad

```objc
@implementation OMWBatchResizeOperation

- (void)main {
    // Never checks isCancelled - continues resizing every image even
    // after -cancel is called, wasting CPU and battery.
    for (UIImage *image in self.images) {
        UIImage *resized = [self resizeImage:image toSize:self.targetSize];
        [self.results addObject:resized];
    }
    self.completionHandler(self.results);
}

@end
```

## Good

```objc
@implementation OMWBatchResizeOperation

- (void)main {
    for (UIImage *image in self.images) {
        if (self.isCancelled) {
            return; // Bail out promptly; don't run the completion handler either.
        }
        UIImage *resized = [self resizeImage:image toSize:self.targetSize];
        [self.results addObject:resized];
    }

    if (self.isCancelled) {
        return;
    }
    self.completionHandler(self.results);
}

@end
```

## Checking Between Coarse-Grained Steps Too

```objc
// For a multi-stage pipeline within one operation, check at each
// natural boundary, not just inside the innermost loop.
- (void)main {
    if (self.isCancelled) { return; }
    NSData *rawData = [self downloadPayload];

    if (self.isCancelled) { return; }
    NSArray *parsed = [self parsePayload:rawData];

    if (self.isCancelled) { return; }
    [self persistParsedRecords:parsed];
}
```

## Overriding `-cancel` to Interrupt Blocking Calls

```objc
// If the operation is blocked inside a call that supports its own
// cancellation (e.g. an NSURLSessionTask), override -cancel to forward it.
@interface OMWNetworkFetchOperation ()
@property (nonatomic, strong, nullable) NSURLSessionTask *task;
@end

@implementation OMWNetworkFetchOperation

- (void)cancel {
    [super cancel];
    [self.task cancel]; // Unblocks -main promptly instead of waiting for isCancelled polling.
}

@end
```

## See Also

- [`conc-nsoperationqueue-dependencies`](conc-nsoperationqueue-dependencies.md) - Use `NSOperation`/`NSOperationQueue` for cancellable, dependent work
- [`conc-completion-handler-single-call`](conc-completion-handler-single-call.md) - Guarantee a completion handler is invoked exactly once on every path
- [`conc-document-thread-safety-contract`](conc-document-thread-safety-contract.md) - Document the thread-confinement/thread-safety contract of shared objects
