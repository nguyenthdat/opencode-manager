# conc-nsoperationqueue-dependencies

> Use `NSOperation`/`NSOperationQueue` for cancellable, dependent work

## Why It Matters

Raw `dispatch_async` blocks cannot be cancelled once queued and have no built-in way to express "run B only after A finishes." Modeling a multi-stage pipeline (resize, then upload, then update a record) with nested blocks forces you to hand-roll cancellation flags and ordering, which is exactly what `NSOperation` and `NSOperationQueue` already provide safely.

## Bad

```objc
// No way to cancel an in-flight resize+upload once dispatched, and the
// "run upload after resize" ordering is only implicit in the nesting.
- (void)processAndUploadImage:(UIImage *)image {
    dispatch_async(self.workQueue, ^{
        UIImage *resized = [self resizeImage:image toSize:CGSizeMake(1024, 1024)];
        dispatch_async(self.workQueue, ^{
            [self.uploader uploadImage:resized completion:^(NSError *error) {
                // If the user backs out of this screen, this still runs.
            }];
        });
    });
}
```

## Good

```objc
- (void)processAndUploadImage:(UIImage *)image {
    NSBlockOperation *resizeOp = [NSBlockOperation blockOperationWithBlock:^{
        self.resizedImage = [self resizeImage:image toSize:CGSizeMake(1024, 1024)];
    }];

    NSBlockOperation *uploadOp = [NSBlockOperation blockOperationWithBlock:^{
        if (uploadOp.isCancelled) {
            return;
        }
        [self.uploader uploadImageSync:self.resizedImage];
    }];

    // uploadOp will not start until resizeOp finishes.
    [uploadOp addDependency:resizeOp];

    self.currentUploadOperation = uploadOp;
    [self.operationQueue addOperations:@[resizeOp, uploadOp] waitUntilFinished:NO];
}

- (void)cancelUpload {
    // Cancels the operation (and anything still queued) cleanly.
    [self.currentUploadOperation cancel];
}
```

## Custom NSOperation Subclass for Richer Control

```objc
@interface OMWImageUploadOperation : NSOperation
- (instancetype)initWithImage:(UIImage *)image uploader:(OMWUploader *)uploader;
@end

@implementation OMWImageUploadOperation {
    UIImage *_image;
    OMWUploader *_uploader;
}

- (instancetype)initWithImage:(UIImage *)image uploader:(OMWUploader *)uploader {
    self = [super init];
    if (self) {
        _image = image;
        _uploader = uploader;
    }
    return self;
}

- (void)main {
    if (self.isCancelled) {
        return; // Check before doing any expensive work.
    }
    [_uploader uploadImageSync:_image];
}

@end
```

## When Plain GCD Is Still Fine

Simple fire-and-forget work with no cancellation or ordering requirements (a one-shot background fetch, a debug log write) doesn't need the overhead of `NSOperation`; reach for GCD directly there and reserve `NSOperationQueue` for pipelines that need dependencies, cancellation, priority, or a bounded `maxConcurrentOperationCount`.

## See Also

- [`conc-nsoperation-cancellation-check`](conc-nsoperation-cancellation-check.md) - Poll `isCancelled` inside long-running `NSOperation` work
- [`conc-completion-handler-single-call`](conc-completion-handler-single-call.md) - Guarantee a completion handler is invoked exactly once on every path
- [`conc-gcd-queue-choice`](conc-gcd-queue-choice.md) - Choose a serial or concurrent GCD queue deliberately based on ordering needs
