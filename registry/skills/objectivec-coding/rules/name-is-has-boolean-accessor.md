# name-is-has-boolean-accessor

> Prefix Boolean accessors with `is`/`has`/`can`/`should`

## Why It Matters

`BOOL` properties and methods without a question-shaped prefix read ambiguously at call sites (`if (view.hidden)` reads fine, but `if (view.editable)` could be mistaken for an object, and `[user valid]` doesn't parse as a yes/no question at all). Cocoa's own APIs are consistent about this, and Swift bridging strips the getter prefix by convention, so a badly named ObjC boolean produces an equally bad Swift property name.

## Bad

```objc
@interface OMWFormField : NSObject

@property (nonatomic, assign) BOOL valid;        // Reads like a noun, not a question
@property (nonatomic, assign) BOOL required;     // Ambiguous: state or capability?
@property (nonatomic, assign) BOOL editable;

- (BOOL)empty;                                    // "empty" as a method reads oddly
- (BOOL)matchesFilter:(NSString *)filter;         // fine, this one is already a predicate

@end
```

## Good

```objc
@interface OMWFormField : NSObject

@property (nonatomic, assign, getter=isValid) BOOL valid;      // Explicit getter= for BOOL
@property (nonatomic, assign) BOOL required;                   // "required" already reads as a predicate
@property (nonatomic, assign, getter=isEditable) BOOL editable;

- (BOOL)isEmpty;
- (BOOL)matchesFilter:(NSString *)filter;

@end
```

## The `getter=` Attribute Is Required for `is`-Prefixed Properties

Without an explicit `getter=`, the synthesized accessor for a property named `valid` is `-valid`, not `-isValid`. To get the idiomatic `-isValid` getter while keeping the ivar/property name `valid`, you must declare it:

```objc
@property (nonatomic, assign, getter=isValid) BOOL valid;
// Generates:  - (BOOL)isValid;   and   - (void)setValid:(BOOL)valid;
```

## `has`/`can`/`should` for Non-State Predicates

```objc
@property (nonatomic, readonly) BOOL hasUnsavedChanges;   // possession/existence
@property (nonatomic, readonly) BOOL canSubmit;            // capability, computed
@property (nonatomic, assign) BOOL shouldAutorotate;        // policy the caller can set

- (BOOL)hasPermissionForAction:(OMWAction *)action;
- (BOOL)canPerformAction:(SEL)action withSender:(id)sender; // mirrors UIResponder's own naming
```

## See Also

- [`name-no-get-prefix-getter`](name-no-get-prefix-getter.md) - Don't prefix simple getters with `get`
- [`name-camelcase-convention`](name-camelcase-convention.md) - Use `lowerCamelCase` for methods/properties, `UpperCamelCase` for types/protocols
- [`interop-ns-swift-name-rename`](interop-ns-swift-name-rename.md) - Use `NS_SWIFT_NAME` to give Swift an idiomatic name for an Objective-C API
