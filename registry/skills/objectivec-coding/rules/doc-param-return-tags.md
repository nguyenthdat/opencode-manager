# doc-param-return-tags

> Document `@param`/`@return` for non-trivial methods

## Why It Matters

A method signature tells you types, not meaning: `(NSInteger)offset` doesn't say whether it's zero-based, clamped, or in points versus items. When a method has more than one parameter, a non-obvious return value, or a subtle precondition, skipping `@param`/`@return` forces every caller to read the implementation (or guess) instead of reading Quick Help.

## Bad

```objc
// What is `options`? What happens on failure? What does the int mean?
- (NSInteger)insertItems:(NSArray<OMWItem *> *)items
                atOffset:(NSInteger)offset
                 options:(NSUInteger)options;
```

## Good

```objc
/**
 Inserts items into the collection at a given offset.

 @param items   The items to insert, in the order they should appear.
                Must not be empty.
 @param offset  The zero-based index at which to insert the first item.
                Pass `NSNotFound` to append at the end.
 @param options A bitmask of `OMWInsertOptions` controlling whether
                duplicates are rejected and whether the operation
                animates in an attached table view.
 @return The number of items actually inserted. This can be less than
         `items.count` if `OMWInsertOptionsSkipDuplicates` is set and
         some items were already present.
 */
- (NSInteger)insertItems:(NSArray<OMWItem *> *)items
                atOffset:(NSInteger)offset
                 options:(OMWInsertOptions)options;
```

## Trivial Methods Don't Need Full Tags

```objc
// A one-line getter with an obvious contract doesn't need @param/@return
// boilerplate — a one-sentence summary is enough and more readable.

/** The number of items currently in the collection. */
@property (nonatomic, readonly) NSUInteger count;

/** Removes all items from the collection. */
- (void)removeAllItems;
```

## Documenting Multiple Return Paths via a Completion Block

```objc
/**
 Uploads a file and reports the result asynchronously.

 @param fileURL   A file URL to local, readable data.
 @param completion Called exactly once, on the main queue.
        - On success, `remoteURL` is non-nil and `error` is nil.
        - On failure, `remoteURL` is nil and `error` describes the
          failure (see `OMWUploadErrorDomain`).
 */
- (void)uploadFileAtURL:(NSURL *)fileURL
              completion:(void (^)(NSURL *_Nullable remoteURL,
                                     NSError *_Nullable error))completion;
```

## See Also

- [`doc-headerdoc-comment-style`](doc-headerdoc-comment-style.md) - Document public API with HeaderDoc-style `/** ... */` comments
- [`doc-nullability-ownership-documented`](doc-nullability-ownership-documented.md) - Document nullability and ownership expectations in header comments
- [`err-completion-block-error-convention`](err-completion-block-error-convention.md) - Put the error argument last in completion blocks; nil result on failure
