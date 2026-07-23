# name-delegate-method-sender-first

> Pass the sender as the first argument of delegate callback methods

## Why It Matters

A delegate object commonly implements callbacks for more than one instance of the delegating class (e.g. a view controller that is the delegate of three different `UITextField`s). Without the sender passed back into the callback, the delegate has no reliable way to tell which instance triggered the call, forcing fragile workarounds like tag comparisons or one delegate object per sender. Cocoa's own delegate protocols (`UITableViewDelegate`, `NSTextFieldDelegate`) always pass the sender first.

## Bad

```objc
@protocol OMWNetworkClientDelegate <NSObject>
- (void)didFinishLoading;                              // Which client finished?
- (void)didFailWithError:(NSError *)error;             // Same problem
@end

@implementation OMWViewController

- (void)didFinishLoading {
    // If self is the delegate for multiple OMWNetworkClient instances,
    // there's no way to know which one just finished.
    [self.tableView reloadData];
}

@end
```

## Good

```objc
@protocol OMWNetworkClientDelegate <NSObject>
- (void)networkClientDidFinishLoading:(OMWNetworkClient *)client;
- (void)networkClient:(OMWNetworkClient *)client didFailWithError:(NSError *)error;
@end

@implementation OMWViewController

- (void)networkClientDidFinishLoading:(OMWNetworkClient *)client {
    if (client == self.primaryClient) {
        [self.tableView reloadData];
    } else if (client == self.thumbnailClient) {
        [self.thumbnailView setNeedsDisplay];
    }
}

- (void)networkClient:(OMWNetworkClient *)client didFailWithError:(NSError *)error {
    NSLog(@"Client %@ failed: %@", client, error);
}

@end
```

## Following Apple's Convention for Multi-Argument Callbacks

```objc
// Apple's own pattern: sender first, then the specific event data
@protocol UITableViewDelegate <NSObject>
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath;
@end

// Mirror it exactly for a custom collaboration protocol
@protocol OMWCarouselViewDelegate <NSObject>
- (void)carouselView:(OMWCarouselView *)carouselView didSelectItemAtIndex:(NSUInteger)index;
- (void)carouselView:(OMWCarouselView *)carouselView
    willTransitionToIndex:(NSUInteger)index;
@end
```

## See Also

- [`name-protocol-delegate-datasource-suffix`](name-protocol-delegate-datasource-suffix.md) - Suffix callback protocols with `Delegate`/`DataSource`
- [`name-multi-keyword-selector-clarity`](name-multi-keyword-selector-clarity.md) - Break multi-argument selectors into clearly labeled keyword segments
- [`api-delegate-protocol-pattern`](api-delegate-protocol-pattern.md) - Use a delegate protocol for customizable callbacks
