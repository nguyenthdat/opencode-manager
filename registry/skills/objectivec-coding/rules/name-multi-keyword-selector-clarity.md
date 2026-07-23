# name-multi-keyword-selector-clarity

> Break multi-argument selectors into clearly labeled keyword segments

## Why It Matters

Objective-C's keyword-message syntax exists precisely so every argument is labeled at the call site — a selector that dumps unlabeled arguments after a single verb reads like a positional C function call and hides which value plays which role. Once a reader has to open the header to remember "is the second argument the timeout or the retry count," the naming has failed its one job.

## Bad

```objc
@interface OMWNetworkClient : NSObject

// Only the first argument is labeled; the rest are anonymous positional params
- (void)requestURL:(NSURL *)url :(NSTimeInterval)timeout :(NSInteger)retries :(BOOL)cached;

@end

// Call site reads like a mystery
[client requestURL:url :30.0 :3 :YES];
```

## Good

```objc
@interface OMWNetworkClient : NSObject

- (void)requestURL:(NSURL *)url
            timeout:(NSTimeInterval)timeout
         retryCount:(NSInteger)retries
      usingCachedResponse:(BOOL)useCache;

@end

// Call site reads like a sentence - every value is self-describing
[client requestURL:url
            timeout:30.0
         retryCount:3
usingCachedResponse:YES];
```

## Each Keyword Should Describe What Follows It, Not Just Restate the Type

```objc
// Bad: keyword just restates the type, doesn't explain the argument's role
- (void)setValue:(id)value forKey:(NSString *)aKey andOptions:(NSDictionary *)opts;

// Good: keyword explains the argument's role in context
- (void)setValue:(id)value
          forKey:(NSString *)key
   withUndoOptions:(NSDictionary<NSString *, id> *)undoOptions;
```

## Matching Apple's First-Keyword-Omits-Verb-Object Convention

```objc
// Apple convention: the first keyword segment often has no label when it's the direct object
- (void)insertObject:(id)object atIndex:(NSUInteger)index;      // not insertObject:object atIndex:
- (void)replaceCharactersInRange:(NSRange)range withString:(NSString *)string;

// Following the same shape for a custom API keeps it feeling native
- (void)insertItem:(OMWCartItem *)item atIndex:(NSUInteger)index;
- (void)replaceItemsInRange:(NSRange)range withItems:(NSArray<OMWCartItem *> *)items;
```

## See Also

- [`name-verbose-descriptive`](name-verbose-descriptive.md) - Prefer verbose, descriptive names over cryptic abbreviations
- [`name-delegate-method-sender-first`](name-delegate-method-sender-first.md) - Pass the sender as the first argument of delegate callback methods
- [`name-init-with-prefix`](name-init-with-prefix.md) - Name initializers `initWith...`
