# name-camelcase-convention

> Use `lowerCamelCase` for methods/properties, `UpperCamelCase` for types/protocols

## Why It Matters

Cocoa's entire naming system depends on a strict case convention to distinguish categories of symbol at a glance: a capitalized identifier is always a type or protocol, a lowercase one is always a method, property, local, or C function. Breaking the convention (`snake_case`, all-lowercase types, capitalized methods) makes code look foreign inside any Cocoa codebase and confuses tools that rely on the convention, including Swift's automatic bridging of ObjC type names.

## Bad

```objc
@interface omw_user_profile : NSObject       // Types must be UpperCamelCase, not snake_case
@property (nonatomic, copy) NSString *First_Name;  // Property should be lowerCamelCase
- (void)Fetch_Profile_Data;                   // Method name capitalized and snake_case
@end

@protocol userprofiledelegate <NSObject>      // Protocol should be UpperCamelCase
- (void)ProfileDidUpdate:(id)sender;
@end
```

## Good

```objc
@interface OMWUserProfile : NSObject
@property (nonatomic, copy) NSString *firstName;
- (void)fetchProfileData;
@end

@protocol OMWUserProfileDelegate <NSObject>
- (void)userProfileDidUpdate:(OMWUserProfile *)profile;
@end
```

## Applying the Convention Across Symbol Kinds

```objc
// Types, protocols, NS_ENUM/NS_OPTIONS typedefs: UpperCamelCase
@interface OMWNetworkRequest : NSObject
@end

@protocol OMWNetworkRequestDelegate <NSObject>
@end

typedef NS_ENUM(NSInteger, OMWNetworkRequestState) {
    OMWNetworkRequestStatePending,
    OMWNetworkRequestStateInFlight,
    OMWNetworkRequestStateComplete,
};

// Methods, properties, parameters, locals, ivars: lowerCamelCase
@interface OMWNetworkRequest ()
@property (nonatomic, strong) NSMutableData *responseBuffer;
- (void)resumeWithCompletionHandler:(void (^)(NSData *data))completionHandler;
@end

// Constants: UpperCamelCase with a lowercase "k"-free style, namespaced by type
FOUNDATION_EXPORT NSString *const OMWNetworkRequestErrorDomain;

// C functions bridging to ObjC APIs: lowerCamelCase, often prefixed
CG_INLINE CGRect OMWRectInset(CGRect rect, CGFloat inset) {
    return CGRectInset(rect, inset, inset);
}
```

## See Also

- [`name-verbose-descriptive`](name-verbose-descriptive.md) - Prefer verbose, descriptive names over cryptic abbreviations
- [`name-enum-case-type-prefix`](name-enum-case-type-prefix.md) - Prefix `NS_ENUM` cases with the enclosing type's name
- [`name-constant-namespaced`](name-constant-namespaced.md) - Namespace exported constants with the owning type's name
