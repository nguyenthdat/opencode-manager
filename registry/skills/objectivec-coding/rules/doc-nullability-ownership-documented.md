# doc-nullability-ownership-documented

> Document nullability and ownership expectations in header comments

## Why It Matters

`nullable`/`nonnull` annotations tell the compiler what's allowed, but they don't explain *why* a value can be nil or who is responsible for freeing/retaining it. A caller reading only the signature of a delegate-returning method can't tell whether a returned object is a live reference they must not mutate, or a snapshot they own outright — that ambiguity causes both crashes and subtle mutation bugs.

## Bad

```objc
// No explanation of when nil is returned, or who owns the returned array
- (nullable NSArray<OMWAttachment *> *)cachedAttachmentsForMessageID:(NSString *)messageID;

// Property looks straightforward but hides a sharp ownership edge
@property (nonatomic, strong, nullable) NSData *rawPayload;
```

## Good

```objc
/**
 Returns the attachments cached for a message, if any have been downloaded.

 @param messageID The message's unique identifier.
 @return `nil` if no attachments have been downloaded and cached yet
         (a cache miss, not an error). When non-nil, the returned array
         is an immutable snapshot; mutating the underlying store does not
         affect this array.
 */
- (nullable NSArray<OMWAttachment *> *)cachedAttachmentsForMessageID:(NSString *)messageID;

/**
 The raw, undecoded payload bytes for this message.

 `nil` until `-decodePayload` has completed successfully. Once set, this
 object is owned by the receiver and must not be mutated by callers;
 copy it first if you need a mutable working copy.
 */
@property (nonatomic, strong, nullable, readonly) NSData *rawPayload;
```

## Documenting Weak vs Strong Semantics

```objc
/**
 The object that will be notified of download progress.

 Held `weak`: the store does not keep the delegate alive, and the
 delegate must remain valid for as long as it wants callbacks. If the
 delegate is deallocated mid-download, callbacks are simply skipped.
 */
@property (nonatomic, weak, nullable) id<OMWDownloadDelegate> delegate;
```

## Documenting Collection Element Ownership

```objc
/**
 Currently active download tasks, keyed by task identifier.

 The dictionary itself is a defensive copy returned to the caller; the
 `OMWDownloadTask` values inside it are the same live instances tracked
 internally, so mutating a task's `progress` is reflected immediately,
 but adding/removing dictionary entries has no effect on the store.
 */
- (NSDictionary<NSString *, OMWDownloadTask *> *)activeTasks;
```

## See Also

- [`doc-headerdoc-comment-style`](doc-headerdoc-comment-style.md) - Document public API with HeaderDoc-style `/** ... */` comments
- [`doc-thread-safety-documented`](doc-thread-safety-documented.md) - State a type's thread-safety guarantees in its header comment
- [`null-explicit-nullable`](null-explicit-nullable.md) - Mark exceptions to the nonnull default with `nullable`/`_Nullable`
