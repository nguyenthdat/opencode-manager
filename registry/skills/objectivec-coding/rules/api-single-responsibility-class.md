# api-single-responsibility-class

> Keep each class focused on one responsibility

## Why It Matters

A class that owns networking, persistence, view layout, and business-rule validation all at once has no single reason to change — any of those four concerns evolving forces a touch to the same file, increasing the chance that an unrelated change introduces a regression elsewhere in the same class. It is also nearly impossible to unit test in isolation, since testing "just the validation logic" drags in networking and persistence dependencies that have nothing to do with the behavior under test.

## Bad

```objc
// One class does networking, JSON parsing, disk caching, AND view updates.
@interface OMWProfileViewController : UIViewController

- (void)loadProfile {
    NSURLSessionDataTask *task = [self.session dataTaskWithURL:profileURL
                                              completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];  // Parsing
        [self writeToDiskCache:data];  // Caching
        dispatch_async(dispatch_get_main_queue(), ^{
            self.nameLabel.text = json[@"name"];  // View updates
            self.emailLabel.text = json[@"email"];
        });
    }];
    [task resume];
}

@end
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

// Networking + parsing responsibility, testable in isolation
@interface OMWProfileService : NSObject
- (void)fetchProfileWithCompletion:(void (^)(OMWProfile *_Nullable profile, NSError *_Nullable error))completion;
@end

// Persistence responsibility, testable in isolation
@interface OMWProfileCache : NSObject
- (void)cacheProfile:(OMWProfile *)profile;
- (nullable OMWProfile *)cachedProfile;
@end

// View responsibility only - delegates everything else out
@interface OMWProfileViewController : UIViewController
@property (nonatomic, strong) OMWProfileService *profileService;
@property (nonatomic, strong) OMWProfileCache *profileCache;
@end

NS_ASSUME_NONNULL_END

@implementation OMWProfileViewController

- (void)loadProfile {
    [self.profileService fetchProfileWithCompletion:^(OMWProfile *profile, NSError *error) {
        if (profile == nil) {
            [self showError:error];
            return;
        }
        [self.profileCache cacheProfile:profile];
        dispatch_async(dispatch_get_main_queue(), ^{
            self.nameLabel.text = profile.name;    // View controller only renders
            self.emailLabel.text = profile.email;
        });
    }];
}

@end
```

## A Quick Litmus Test

```objc
// Ask: "What would make me need to change this class?"
// If the answer includes more than one unrelated thing - a new API response
// shape AND a new cache eviction policy AND a new screen layout - the class
// is doing too much and should be split along those seams.
```

## See Also

- [`anti-massive-view-controller`](anti-massive-view-controller.md) - The most common manifestation of this anti-pattern
- [`api-delegate-protocol-pattern`](api-delegate-protocol-pattern.md) - Splitting callback responsibility out via delegation
- [`test-protocol-injection-for-mocking`](test-protocol-injection-for-mocking.md) - Why split responsibilities are easier to test
