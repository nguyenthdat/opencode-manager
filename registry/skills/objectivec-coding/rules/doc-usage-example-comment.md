# doc-usage-example-comment

> Include a short usage example in the header comment for non-obvious APIs

## Why It Matters

Some APIs can't be fully explained by `@param`/`@return` alone — builder-style configuration objects, block-chaining APIs, or anything with a required call order need to be *shown*, not just described. Without an example, callers reverse-engineer the correct usage from unit tests (if any exist) or by trial and error, which is slower and more error-prone than reading one in Quick Help.

## Bad

```objc
/**
 Configures and starts a network request.

 @param configuration A configuration block.
 */
// No example: is the block called once or repeatedly? Do properties
// need to be set before or can they be set inside the block?
- (void)startRequestWithConfiguration:(void (^)(OMWRequestBuilder *builder))configuration;
```

## Good

```objc
/**
 Configures and starts a network request using a builder block.

 The block is invoked synchronously, once, before this method returns.
 Set every property you need on `builder` inside the block; properties
 left unset use the defaults documented on `OMWRequestBuilder`.

 Example:
 @code
 [self.client startRequestWithConfiguration:^(OMWRequestBuilder *builder) {
     builder.URL = [NSURL URLWithString:@"https://api.example.com/users"];
     builder.HTTPMethod = @"GET";
     builder.timeoutInterval = 10.0;
 }];
 @endcode

 @param configuration A block that configures the request before it's sent.
 */
- (void)startRequestWithConfiguration:(void (^)(OMWRequestBuilder *builder))configuration;
```

## Documenting a Required Call Order

```objc
/**
 A multi-step image-processing pipeline.

 Steps must be applied in order: `-loadImage:` must be called before
 `-applyFilter:`, which must be called before `-exportToURL:completion:`.
 Calling steps out of order raises `NSInternalInconsistencyException`.

 Example:
 @code
 OMWImagePipeline *pipeline = [[OMWImagePipeline alloc] init];
 [pipeline loadImage:sourceImage];
 [pipeline applyFilter:OMWImageFilterSepia];
 [pipeline exportToURL:destinationURL completion:^(NSError *_Nullable error) {
     // handle completion
 }];
 @endcode
 */
@interface OMWImagePipeline : NSObject
- (void)loadImage:(UIImage *)image;
- (void)applyFilter:(OMWImageFilter)filter;
- (void)exportToURL:(NSURL *)url completion:(void (^)(NSError *_Nullable error))completion;
@end
```

## Keep Examples Compilable in Spirit

```objc
// Prefer real, in-scope types/method names over pseudocode so a reader
// could paste the example into a method body with only the surrounding
// variables (self.client, sourceImage, destinationURL) substituted.
```

## See Also

- [`doc-headerdoc-comment-style`](doc-headerdoc-comment-style.md) - Document public API with HeaderDoc-style `/** ... */` comments
- [`doc-param-return-tags`](doc-param-return-tags.md) - Document `@param`/`@return` for non-trivial methods
- [`api-delegate-protocol-pattern`](api-delegate-protocol-pattern.md) - Use a delegate protocol for customizable callbacks
