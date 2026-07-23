# api-delegate-protocol-pattern

> Use a delegate protocol for customizable callbacks

## Why It Matters

A delegate protocol gives an object an ongoing, multi-callback relationship with a customization point (loading state, validation, lifecycle events) without hardcoding a concrete collaborator type. Unlike a single completion block, it naturally supports multiple distinct callback points, optional methods, and a stable weak reference the delegating object can hold across its entire lifetime — which is exactly the shape UIKit/AppKit use for `UITableViewDelegate`, `NSTextFieldDelegate`, and dozens of others.

## Bad

```objc
// Hardcodes a concrete collaborator type - can't be reused or mocked, and
// adding new callback points requires modifying OMWDownloadTask itself.
@interface OMWDownloadTask : NSObject
@property (nonatomic, weak) OMWDownloadsViewController *viewController;
@end

@implementation OMWDownloadTask
- (void)handleProgress:(double)fraction {
    [self.viewController updateProgressBar:fraction];  // Tightly coupled to one concrete class
}
@end
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

@protocol OMWDownloadTaskDelegate <NSObject>

@required
- (void)downloadTask:(OMWDownloadTask *)task didUpdateProgress:(double)fractionComplete;
- (void)downloadTask:(OMWDownloadTask *)task didFinishWithFileURL:(NSURL *)fileURL;

@optional
- (void)downloadTask:(OMWDownloadTask *)task didFailWithError:(NSError *)error;

@end

@interface OMWDownloadTask : NSObject

@property (nonatomic, weak, nullable) id<OMWDownloadTaskDelegate> delegate;

@end

NS_ASSUME_NONNULL_END

@implementation OMWDownloadTask

- (void)handleProgress:(double)fraction {
    [self.delegate downloadTask:self didUpdateProgress:fraction];  // Sender passed first, per convention
}

- (void)handleFailure:(NSError *)error {
    if ([self.delegate respondsToSelector:@selector(downloadTask:didFailWithError:)]) {
        [self.delegate downloadTask:self didFailWithError:error];  // Guard optional methods
    }
}

@end

// Any object can now adopt the protocol and be plugged in
@interface OMWDownloadsViewController : UIViewController <OMWDownloadTaskDelegate>
@end

@implementation OMWDownloadsViewController
- (void)downloadTask:(OMWDownloadTask *)task didUpdateProgress:(double)fractionComplete {
    self.progressView.progress = fractionComplete;
}
- (void)downloadTask:(OMWDownloadTask *)task didFinishWithFileURL:(NSURL *)fileURL {
    [self presentFileAtURL:fileURL];
}
@end
```

## Delegate vs Block Callback

```objc
// Prefer a delegate when there are multiple, ongoing callback points across
// the object's lifetime (progress, completion, failure, cancellation).
//
// Prefer a single completion block (see err-completion-block-error-convention)
// when there is exactly one terminal result and no ongoing relationship.
```

## See Also

- [`arc-weak-delegate`](arc-weak-delegate.md) - Delegate properties must be `weak` to avoid retain cycles
- [`name-delegate-method-sender-first`](name-delegate-method-sender-first.md) - Passing the sender as the first argument
- [`name-protocol-delegate-datasource-suffix`](name-protocol-delegate-datasource-suffix.md) - Naming the protocol itself
- [`api-datasource-protocol-pattern`](api-datasource-protocol-pattern.md) - The related data-source pattern
