# api-compose-small-protocols

> Compose several small protocols instead of one monolithic protocol

## Why It Matters

A single large protocol that mixes unrelated responsibilities (networking, caching, logging, UI callbacks) forces every conformer to either implement methods it doesn't care about or lean heavily on `@optional`, and it makes mocking for tests harder since a test double must stub the entire surface. Small, focused protocols composed together (`<OMWCaching, OMWLogging>`) let types adopt exactly the capabilities they need, and let test doubles implement only the slice under test.

## Bad

```objc
// One protocol conflates data fetching, caching, and analytics reporting -
// any object that wants to fetch data is forced into caching/reporting concerns too.
@protocol OMWDataProvider <NSObject>
- (void)fetchDataWithCompletion:(void (^)(NSData *_Nullable data, NSError *_Nullable error))completion;
- (nullable NSData *)cachedDataForKey:(NSString *)key;
- (void)cacheData:(NSData *)data forKey:(NSString *)key;
- (void)logEvent:(NSString *)eventName parameters:(NSDictionary *)parameters;
@end
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

@protocol OMWDataFetching <NSObject>
- (void)fetchDataWithCompletion:(void (^)(NSData *_Nullable data, NSError *_Nullable error))completion;
@end

@protocol OMWCaching <NSObject>
- (nullable NSData *)cachedDataForKey:(NSString *)key;
- (void)cacheData:(NSData *)data forKey:(NSString *)key;
@end

@protocol OMWAnalyticsReporting <NSObject>
- (void)logEvent:(NSString *)eventName parameters:(NSDictionary<NSString *, id> *)parameters;
@end

// A concrete type composes exactly the protocols it needs to conform to
@interface OMWNetworkDataProvider : NSObject <OMWDataFetching, OMWCaching>
@end

NS_ASSUME_NONNULL_END

// A consumer that only needs fetching doesn't require the whole surface
@interface OMWFeedLoader : NSObject
@property (nonatomic, strong) id<OMWDataFetching> dataFetcher;  // Doesn't care about caching or analytics
@end
```

## Payoff for Testing

```objc
// A test double only needs to implement the slice it's exercising - no need
// to stub caching or analytics methods it will never be asked for.
@interface OMWFakeDataFetcher : NSObject <OMWDataFetching>
@property (nonatomic, copy, nullable) NSData *stubbedData;
@end

@implementation OMWFakeDataFetcher
- (void)fetchDataWithCompletion:(void (^)(NSData *_Nullable, NSError *_Nullable))completion {
    completion(self.stubbedData, nil);
}
@end
```

## Protocol Inheritance for Shared Requirements

```objc
// Protocols can inherit from other protocols when a real "is-a" composition
// relationship exists, rather than every conformer re-adopting them separately.
@protocol OMWRemoteResource <OMWDataFetching, OMWCaching>
@end
```

## See Also

- [`api-datasource-protocol-pattern`](api-datasource-protocol-pattern.md) - A concrete example of splitting one monolithic protocol into two
- [`test-protocol-injection-for-mocking`](test-protocol-injection-for-mocking.md) - Depending on protocols to enable test doubles
- [`api-protocol-optional-required`](api-protocol-optional-required.md) - The alternative of marking methods `@optional`
