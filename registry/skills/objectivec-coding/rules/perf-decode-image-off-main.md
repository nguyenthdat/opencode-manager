# perf-decode-image-off-main

> Decode/resize images off the main thread

## Why It Matters

`[UIImage imageNamed:]`/`imageWithContentsOfFile:` return an object lazily backed by compressed data; the actual pixel decode happens the first time the image is drawn — typically when it's assigned to a `UIImageView` on the main thread during a scroll. Decoding a large JPEG/HEIC synchronously on the main thread blocks the run loop for tens of milliseconds, which is enough to drop several frames.

## Bad

```objc
- (void)tableView:(UITableView *)tableView
willDisplayCell:(UITableViewCell *)cell
forRowAtIndexPath:(NSIndexPath *)indexPath {
    OMWPhoto *photo = self.photos[indexPath.row];
    // Loading and assigning directly on the main thread: the full-size
    // JPEG gets decoded synchronously the moment it's drawn, stalling
    // the scroll.
    UIImage *image = [UIImage imageWithContentsOfFile:photo.localFilePath];
    ((OMWPhotoCell *)cell).imageView.image = image;
}
```

## Good

```objc
- (void)tableView:(UITableView *)tableView
willDisplayCell:(UITableViewCell *)cell
forRowAtIndexPath:(NSIndexPath *)indexPath {
    OMWPhoto *photo = self.photos[indexPath.row];
    OMWPhotoCell *photoCell = (OMWPhotoCell *)cell;
    NSString *filePath = photo.localFilePath;

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        // Force decode off the main thread by drawing into a bitmap
        // context, so the returned image is already decoded pixel data.
        UIImage *decodedImage = [OMWImageDecoder decodedImageFromContentsOfFile:filePath
                                                                     targetSize:photoCell.bounds.size];
        dispatch_async(dispatch_get_main_queue(), ^{
            // Guard against cell reuse racing ahead of this async decode.
            if ([photoCell.currentFilePath isEqualToString:filePath]) {
                photoCell.imageView.image = decodedImage;
            }
        });
    });
}
```

## Forcing Decode with a Bitmap Context

```objc
@implementation OMWImageDecoder

+ (nullable UIImage *)decodedImageFromContentsOfFile:(NSString *)path
                                          targetSize:(CGSize)targetSize {
    UIImage *source = [UIImage imageWithContentsOfFile:path];
    if (source == nil) {
        return nil;
    }

    UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat preferredFormat];
    format.opaque = YES; // avoids an unnecessary alpha channel for photo content
    UIGraphicsImageRenderer *renderer =
        [[UIGraphicsImageRenderer alloc] initWithSize:targetSize format:format];

    // Rendering forces immediate decode + resize, off the main thread
    // since this method itself runs on a background queue.
    return [renderer imageWithActions:^(UIGraphicsImageRendererContext *context) {
        [source drawInRect:CGRectMake(0, 0, targetSize.width, targetSize.height)];
    }];
}

@end
```

## Cancel Stale Decodes on Reuse

```objc
- (void)prepareForReuse {
    [super prepareForReuse];
    self.currentFilePath = nil; // invalidates the guard check above
    self.imageView.image = nil;
}
```

## See Also

- [`perf-nscache-memory-sensitive-cache`](perf-nscache-memory-sensitive-cache.md) - Use `NSCache` instead of a plain dictionary for memory-sensitive caches
- [`perf-reuse-cell-identifiers`](perf-reuse-cell-identifiers.md) - Reuse table/collection view cells via reuse identifiers
- [`conc-avoid-blocking-main-thread`](conc-avoid-blocking-main-thread.md) - Never perform synchronous network/disk I/O on the main thread
