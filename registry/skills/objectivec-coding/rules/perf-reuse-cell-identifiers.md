# perf-reuse-cell-identifiers

> Reuse table/collection view cells via reuse identifiers

## Why It Matters

Allocating a brand-new `UITableViewCell`/`UICollectionViewCell` for every row instead of dequeuing one causes visible scroll stutter, because cell construction (view hierarchy setup, constraint solving, layer creation) is one of the most expensive per-row operations. Reuse identifiers let the scroll view recycle off-screen cells instead of paying that cost on every single scroll frame.

## Bad

```objc
- (UITableViewCell *)tableView:(UITableView *)tableView
          cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    // Allocates a brand-new cell and subviews on every call, even for
    // rows that scroll past dozens of times per second.
    UITableViewCell *cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle
                                                     reuseIdentifier:nil];
    OMWTransaction *transaction = self.transactions[indexPath.row];
    cell.textLabel.text = transaction.title;
    cell.detailTextLabel.text = transaction.subtitle;
    return cell;
}
```

## Good

```objc
static NSString *const OMWTransactionCellIdentifier = @"OMWTransactionCell";

- (void)viewDidLoad {
    [super viewDidLoad];
    [self.tableView registerClass:[OMWTransactionCell class]
            forCellReuseIdentifier:OMWTransactionCellIdentifier];
}

- (UITableViewCell *)tableView:(UITableView *)tableView
          cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    OMWTransactionCell *cell =
        [tableView dequeueReusableCellWithIdentifier:OMWTransactionCellIdentifier
                                          forIndexPath:indexPath];
    OMWTransaction *transaction = self.transactions[indexPath.row];
    [cell configureWithTransaction:transaction];
    return cell;
}
```

## Reset Reusable State in `prepareForReuse`

```objc
@implementation OMWTransactionCell

- (void)prepareForReuse {
    [super prepareForReuse];
    // Cancel any in-flight image download bound to the *previous* row,
    // and clear stale content so a fast scroll can't briefly flash the
    // wrong transaction's icon before the new configure call lands.
    [self.imageDownloadTask cancel];
    self.imageDownloadTask = nil;
    self.iconImageView.image = nil;
}

@end
```

## Multiple Reuse Identifiers for Heterogeneous Rows

```objc
// Register one identifier per distinct row layout; dequeueing still
// avoids allocation for each kind, it just tracks separate reuse pools.
[self.tableView registerClass:[OMWTransactionCell class]
        forCellReuseIdentifier:OMWTransactionCellIdentifier];
[self.tableView registerClass:[OMWSectionHeaderCell class]
        forCellReuseIdentifier:OMWSectionHeaderCellIdentifier];

- (UITableViewCell *)tableView:(UITableView *)tableView
          cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    if ([self isHeaderRowAtIndexPath:indexPath]) {
        return [tableView dequeueReusableCellWithIdentifier:OMWSectionHeaderCellIdentifier
                                                  forIndexPath:indexPath];
    }
    return [tableView dequeueReusableCellWithIdentifier:OMWTransactionCellIdentifier
                                              forIndexPath:indexPath];
}
```

## See Also

- [`perf-avoid-alloc-in-drawrect`](perf-avoid-alloc-in-drawrect.md) - Avoid allocating objects inside `drawRect:`/render loops
- [`perf-decode-image-off-main`](perf-decode-image-off-main.md) - Decode/resize images off the main thread
- [`perf-lazy-property-initialization`](perf-lazy-property-initialization.md) - Lazily initialize expensive properties on first access
