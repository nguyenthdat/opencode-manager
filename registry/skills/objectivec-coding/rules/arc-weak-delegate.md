# arc-weak-delegate

> Declare delegate properties `weak` to avoid owner retain cycles

## Why It Matters

Delegates almost always own the object they delegate to (a view controller owns a table view whose delegate is the view controller itself). If the delegate property is `strong`, the delegate and the delegated object retain each other, so neither ever deallocates. Declaring the delegate `weak` lets the owner's normal lifetime govern deallocation, and the reference automatically becomes nil if the delegate goes away first, avoiding a dangling pointer.

## Bad

```objc
@protocol OMWDownloadManagerDelegate <NSObject>
- (void)downloadManager:(OMWDownloadManager *)manager didFinishDownload:(NSURL *)fileURL;
@end

@interface OMWDownloadManager : NSObject
@property (nonatomic, strong) id<OMWDownloadManagerDelegate> delegate;  // Strong retains the owner
@end

@implementation OMWViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.downloadManager = [[OMWDownloadManager alloc] init];
    self.downloadManager.delegate = self;
    // self -> downloadManager -> delegate (self): retain cycle, view controller never deallocs
}

@end
```

## Good

```objc
@protocol OMWDownloadManagerDelegate <NSObject>
- (void)downloadManager:(OMWDownloadManager *)manager didFinishDownload:(NSURL *)fileURL;
@end

@interface OMWDownloadManager : NSObject
@property (nonatomic, weak) id<OMWDownloadManagerDelegate> delegate;  // No retain, no cycle
@end

@implementation OMWViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.downloadManager = [[OMWDownloadManager alloc] init];
    self.downloadManager.delegate = self;  // Weak reference; self still owns downloadManager
}

@end
```

## When Something Other Than `weak` Is Acceptable

```objc
// If the delegate is a transient, short-lived collaborator that outlives the
// delegating object and is NOT the owner, unsafe_unretained can be used on
// pre-ARC-weak platforms, but modern deployment targets (iOS 5+/macOS 10.7+)
// should always prefer weak instead:
@property (nonatomic, unsafe_unretained) id<OMWLegacyDelegate> delegate;  // Only for very old targets
```

## Verifying With the Static Analyzer

Xcode's Clang Static Analyzer flags most `strong`/`weak` delegate retain cycles automatically when `CLANG_ANALYZER_NONNULL` and retain-cycle checks are enabled in the target's build settings; run it in CI to catch regressions before they ship.

## See Also

- [`arc-weak-over-unsafe-unretained`](arc-weak-over-unsafe-unretained.md) - Prefer `weak` over `unsafe_unretained` for nullable back-references
- [`api-delegate-protocol-pattern`](api-delegate-protocol-pattern.md) - Use a delegate protocol for customizable callbacks
- [`api-property-attribute-discipline`](api-property-attribute-discipline.md) - Choose `atomic`/`nonatomic`, `strong`/`copy`/`weak`, `readonly`/`readwrite` deliberately
