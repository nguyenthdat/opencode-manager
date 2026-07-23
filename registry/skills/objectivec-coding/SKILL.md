---
name: objectivec-coding
description: "Comprehensive idiomatic Objective-C guidance: 165 prioritized rules across 14 categories covering ARC memory management, nullability, Cocoa/Cocoa Touch API design, and Swift interop. Use when writing, reviewing, refactoring, optimizing, or debugging Objective-C (`.h`, `.m`, `.mm`) files, including blocks/GCD concurrency, KVO/KVC, and Foundation collection idioms. Apply ARC-default, nullability-annotation, and lightweight-generics guidance to any code targeting a current Xcode/SDK; preserve a project's declared minimum deployment target and any deliberate pre-ARC/manual-retain-count code paths unless migration is explicitly in scope."
compatibility: opencode
metadata:
  domain: objective-c
  audience: software-engineer
  edition: project-declared
---

# Objective-C Best Practices

Comprehensive guide for writing high-quality, idiomatic Objective-C code. Contains 165 rules across 14 categories, prioritized by impact. Project constraints override generic defaults: preserve the declared minimum deployment target, manual-retain-count exceptions (e.g. Core Foundation-heavy legacy code), and third-party style guide unless the user explicitly requests a migration.

## When to Apply

Reference these guidelines when:
- Writing new Objective-C classes, categories, or protocols
- Implementing memory management under ARC or auditing manual retain/release code
- Designing public headers for a library or framework, including Swift-facing API
- Reviewing code for retain cycles, nullability violations, or thread-safety issues
- Implementing blocks, GCD, or `NSOperationQueue`-based concurrency
- Working with KVO/KVC or Foundation collections
- Optimizing hot paths (table/collection view cells, `drawRect:`, image decoding)
- Refactoring existing Objective-C code or bridging it to Swift
- Migrating legacy manual-reference-counted (MRC) code to ARC

## Modern Objective-C

Current best practice assumes ARC, full nullability auditing, and Swift-interop annotations as the default posture for any Objective-C code written or touched today. For an existing target, preserve its minimum deployment target and any deliberate MRC boundary (e.g. a `-fno-objc-arc` file wrapping legacy C/CF code) unless migration is in scope. For new code, apply the following without exception:

```objc
NS_ASSUME_NONNULL_BEGIN

@interface OMWUserProfileStore : NSObject

@property (nonatomic, copy, readonly) NSArray<OMWUser *> *cachedUsers;
@property (nonatomic, weak, nullable) id<OMWUserProfileStoreDelegate> delegate;

- (instancetype)initWithFileURL:(NSURL *)fileURL NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(OMWUser *_Nullable user, NSError *_Nullable error))completion
    NS_SWIFT_NAME(fetchUser(id:completion:));

@end

NS_ASSUME_NONNULL_END
```

- **ARC is the default memory-management model.** Manual `retain`/`release`/`autorelease` calls are a red flag in new code; ARC handles ownership via property attributes (`strong`/`weak`/`copy`/`unsafe_unretained`) and compiler-inserted retain/release calls. Reserve manual reference counting for isolated Core Foundation interop, wrapped explicitly with `__bridge`/`CFBridgingRetain`/`CFBridgingRelease`.
- **Nullability annotations are mandatory at API boundaries.** Wrap every public header in `NS_ASSUME_NONNULL_BEGIN`/`END` and mark the exceptions (`nullable`, `_Nullable`, `_Nonnull`) explicitly. This is not optional style — it determines how the API bridges to Swift `Optional`.
- **Lightweight generics on collections.** Declare `NSArray<NSString *> *`, `NSDictionary<NSString *, OMWUser *> *`, etc., instead of bare `NSArray *`/`NSDictionary *`. The compiler enforces them and they bridge to typed Swift collections.
- **Modern `NS_ENUM`/`NS_OPTIONS`.** Never declare a raw C `enum` for a Cocoa API; use `typedef NS_ENUM(NSInteger, ...)` for closed sets and `typedef NS_OPTIONS(NSUInteger, ...)` for bitmasks, both of which bridge to real Swift enums/option sets.
- **`@property` modern attribute defaults.** Default to `nonatomic` unless a property is genuinely touched from multiple threads without other synchronization; default object properties to `strong`, value-holding `NSString`/`NSArray`/`NSDictionary`/block properties to `copy`, and delegates to `weak`.
- **Block-based APIs over target-action/delegate for simple async callbacks.** Prefer a completion block for one-shot asynchronous results; reserve delegate protocols for ongoing, multi-callback relationships.
- **Swift-interop annotations.** Use `NS_SWIFT_NAME` to give Swift-idiomatic names, `NS_REFINED_FOR_SWIFT` to wrap a low-level ObjC entry point with a nicer Swift overlay, and `NS_SWIFT_UNAVAILABLE` to hide ObjC-only API from Swift callers.
- **`instancetype`, not the literal class name.** Every initializer and factory method should return `instancetype` so subclassing and Swift bridging both work correctly.

For the authoritative, complete reference, consult Apple's Objective-C Programming Language Guide, the Cocoa Coding Guidelines, and the Nullability/Swift-interop documentation in the Clang manual. Everything below applies across deployment targets; prefer the modern forms above where legacy code differs.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Memory Management & ARC | CRITICAL | `arc-` | 13 |
| 2 | Nullability & Type Safety | CRITICAL | `null-` | 12 |
| 3 | Error Handling | CRITICAL | `err-` | 11 |
| 4 | API/Class Design | HIGH | `api-` | 15 |
| 5 | Blocks & Concurrency | HIGH | `conc-` | 14 |
| 6 | Foundation Collections & KVC/KVO | HIGH | `kvc-` | 12 |
| 7 | Naming Conventions | MEDIUM | `name-` | 13 |
| 8 | Testing | MEDIUM | `test-` | 12 |
| 9 | Documentation | MEDIUM | `doc-` | 9 |
| 10 | Performance Patterns | MEDIUM | `perf-` | 11 |
| 11 | Swift Interop | MEDIUM | `interop-` | 9 |
| 12 | Project Structure | LOW | `proj-` | 10 |
| 13 | Linting | LOW | `lint-` | 9 |
| 14 | Anti-patterns | REFERENCE | `anti-` | 15 |

---

## Quick Reference

### 1. Memory Management & ARC (CRITICAL)

- [`arc-weak-strong-self`](rules/arc-weak-strong-self.md) - Capture `__weak self` then re-strengthen inside blocks to avoid retain cycles
- [`arc-weak-delegate`](rules/arc-weak-delegate.md) - Declare delegate properties `weak` to avoid owner retain cycles
- [`arc-copy-value-objects`](rules/arc-copy-value-objects.md) - Use `copy` (not `strong`) for `NSString`/`NSArray`/`NSDictionary` properties
- [`arc-copy-block-property`](rules/arc-copy-block-property.md) - Use `copy` for block-typed properties
- [`arc-autoreleasepool-loop`](rules/arc-autoreleasepool-loop.md) - Wrap tight allocation loops in `@autoreleasepool`
- [`arc-no-manual-memory-calls`](rules/arc-no-manual-memory-calls.md) - Never call `retain`/`release`/`autorelease` under ARC
- [`arc-strong-default-ownership`](rules/arc-strong-default-ownership.md) - Default object properties to `strong` unless a specific ownership qualifier is needed
- [`arc-unsafe-unretained-rare`](rules/arc-unsafe-unretained-rare.md) - Reserve `unsafe_unretained` for rare non-`weak`-compatible cases
- [`arc-bridge-corefoundation`](rules/arc-bridge-corefoundation.md) - Use `__bridge`/`CFBridgingRetain`/`CFBridgingRelease` correctly at CF/ObjC boundaries
- [`arc-dealloc-observer-cleanup`](rules/arc-dealloc-observer-cleanup.md) - Remove observers and invalidate timers in `dealloc`
- [`arc-timer-target-cycle`](rules/arc-timer-target-cycle.md) - Avoid `NSTimer`/`CADisplayLink` strong-target retain cycles
- [`arc-weak-over-unsafe-unretained`](rules/arc-weak-over-unsafe-unretained.md) - Prefer `weak` over `unsafe_unretained` for nullable back-references
- [`arc-block-ivar-capture-self`](rules/arc-block-ivar-capture-self.md) - Avoid implicit `self` capture via bare ivar access inside stored blocks

### 2. Nullability & Type Safety (CRITICAL)

- [`null-assume-nonnull-region`](rules/null-assume-nonnull-region.md) - Wrap headers in `NS_ASSUME_NONNULL_BEGIN`/`END`
- [`null-explicit-nullable`](rules/null-explicit-nullable.md) - Mark exceptions to the nonnull default with `nullable`/`_Nullable`
- [`null-lightweight-generics`](rules/null-lightweight-generics.md) - Parameterize collections with lightweight generics (`NSArray<NSString *> *`)
- [`null-instancetype-init`](rules/null-instancetype-init.md) - Return `instancetype`, not the literal class name, from initializers/factories
- [`null-avoid-id-when-concrete`](rules/null-avoid-id-when-concrete.md) - Avoid `id` when a concrete or protocol-qualified type is known
- [`null-protocol-qualified-id`](rules/null-protocol-qualified-id.md) - Use `id<Protocol>` instead of bare `id` when conformance is required
- [`null-kindof-covariant-return`](rules/null-kindof-covariant-return.md) - Use `__kindof` for covariant factory/collection return types
- [`null-boxed-expression-literals`](rules/null-boxed-expression-literals.md) - Use boxed expressions (`@(x)`, `@[]`, `@{}`) instead of manual wrapper calls
- [`null-noescape-block-param`](rules/null-noescape-block-param.md) - Annotate non-escaping block parameters with `NS_NOESCAPE`
- [`null-audited-region-c-api`](rules/null-audited-region-c-api.md) - Wrap nullability-audited C function regions explicitly
- [`null-generic-mutable-subclass`](rules/null-generic-mutable-subclass.md) - Preserve declared generics on mutable collection subclass return types
- [`null-avoid-nsnull-sentinel-sprawl`](rules/null-avoid-nsnull-sentinel-sprawl.md) - Centralize `NSNull` sentinel handling instead of scattering checks

### 3. Error Handling (CRITICAL)

- [`err-nserror-out-param`](rules/err-nserror-out-param.md) - Use the `NSError **` out-parameter convention for recoverable failures
- [`err-check-return-value-first`](rules/err-check-return-value-first.md) - Check the BOOL/nil return value, not just whether an error was set
- [`err-exception-programmer-only`](rules/err-exception-programmer-only.md) - Reserve `NSException`/`@throw` for programmer errors, not recoverable ones
- [`err-never-ignore-populated-error`](rules/err-never-ignore-populated-error.md) - Never pass `NULL` for `error:` and then ignore failure
- [`err-domain-code-userinfo`](rules/err-domain-code-userinfo.md) - Define a proper error domain, code enum, and localized `userInfo`
- [`err-populate-error-on-failure-only`](rules/err-populate-error-on-failure-only.md) - Only populate `*error` when returning failure, never on success
- [`err-completion-block-error-convention`](rules/err-completion-block-error-convention.md) - Put the error argument last in completion blocks; nil result on failure
- [`err-try-catch-sparing-use`](rules/err-try-catch-sparing-use.md) - Use `@try`/`@catch` only around APIs that legitimately throw, not for control flow
- [`err-custom-domain-constant`](rules/err-custom-domain-constant.md) - Declare error domains as exported string constants, not inline literals
- [`err-recoverable-vs-fatal-line`](rules/err-recoverable-vs-fatal-line.md) - Draw a clear line between `NSError` (recoverable) and assertion/exception (programmer bug)
- [`err-nested-error-wrapping`](rules/err-nested-error-wrapping.md) - Wrap underlying errors via `NSUnderlyingErrorKey` instead of discarding them

### 4. API/Class Design (HIGH)

- [`api-designated-initializer`](rules/api-designated-initializer.md) - Mark the one true initializer `NS_DESIGNATED_INITIALIZER`
- [`api-class-factory-method`](rules/api-class-factory-method.md) - Provide `+ classWith...` convenience factory methods
- [`api-class-cluster-pattern`](rules/api-class-cluster-pattern.md) - Implement class clusters with an abstract superclass and private concrete subclasses
- [`api-delegate-protocol-pattern`](rules/api-delegate-protocol-pattern.md) - Use a delegate protocol for customizable callbacks
- [`api-datasource-protocol-pattern`](rules/api-datasource-protocol-pattern.md) - Use a data-source protocol to separate data supply from behavior
- [`api-category-extend-not-override`](rules/api-category-extend-not-override.md) - Use categories to add methods; never override existing methods via category
- [`api-class-extension-private-api`](rules/api-class-extension-private-api.md) - Hide private properties/methods in a class-extension (anonymous category)
- [`api-property-attribute-discipline`](rules/api-property-attribute-discipline.md) - Choose `atomic`/`nonatomic`, `strong`/`copy`/`weak`, `readonly`/`readwrite` deliberately
- [`api-readonly-public-readwrite-private`](rules/api-readonly-public-readwrite-private.md) - Expose `readonly` publicly, redeclare `readwrite` in a private extension
- [`api-protocol-optional-required`](rules/api-protocol-optional-required.md) - Mark each protocol method `@optional` or `@required` deliberately
- [`api-init-chain-nil-check`](rules/api-init-chain-nil-check.md) - Chain `self = [super init]` and bail out on `nil`
- [`api-abstract-base-assert`](rules/api-abstract-base-assert.md) - Enforce abstract-method contracts with `NSAssert`/subclass-responsibility exceptions
- [`api-compose-small-protocols`](rules/api-compose-small-protocols.md) - Compose several small protocols instead of one monolithic protocol
- [`api-mutable-immutable-pair`](rules/api-mutable-immutable-pair.md) - Provide an immutable base class plus a mutable subclass, mirroring `NSString`/`NSMutableString`
- [`api-single-responsibility-class`](rules/api-single-responsibility-class.md) - Keep each class focused on one responsibility

### 5. Blocks & Concurrency (HIGH)

- [`conc-gcd-queue-choice`](rules/conc-gcd-queue-choice.md) - Choose a serial or concurrent GCD queue deliberately based on ordering needs
- [`conc-main-queue-ui-updates`](rules/conc-main-queue-ui-updates.md) - Always dispatch UI updates back to the main queue
- [`conc-nsoperationqueue-dependencies`](rules/conc-nsoperationqueue-dependencies.md) - Use `NSOperation`/`NSOperationQueue` for cancellable, dependent work
- [`conc-dispatch-once-singleton`](rules/conc-dispatch-once-singleton.md) - Use `dispatch_once` for thread-safe singleton/lazy initialization
- [`conc-synchronized-scope-minimal`](rules/conc-synchronized-scope-minimal.md) - Keep `@synchronized` blocks minimal and never nested
- [`conc-nslock-explicit-when-needed`](rules/conc-nslock-explicit-when-needed.md) - Use `NSLock`/`NSRecursiveLock` explicitly when `@synchronized` overhead isn't wanted
- [`conc-serial-queue-state-protection`](rules/conc-serial-queue-state-protection.md) - Protect shared mutable state with a private serial queue instead of ad hoc locks
- [`conc-avoid-priority-inversion`](rules/conc-avoid-priority-inversion.md) - Avoid blocking high-priority queues on low-priority/background work
- [`conc-dispatch-group-coordination`](rules/conc-dispatch-group-coordination.md) - Use `dispatch_group_t` to coordinate multiple async operations
- [`conc-dispatch-barrier-readwrite`](rules/conc-dispatch-barrier-readwrite.md) - Use a concurrent queue with barrier writes for reader/writer synchronization
- [`conc-completion-handler-single-call`](rules/conc-completion-handler-single-call.md) - Guarantee a completion handler is invoked exactly once on every path
- [`conc-avoid-blocking-main-thread`](rules/conc-avoid-blocking-main-thread.md) - Never perform synchronous network/disk I/O on the main thread
- [`conc-nsoperation-cancellation-check`](rules/conc-nsoperation-cancellation-check.md) - Poll `isCancelled` inside long-running `NSOperation` work
- [`conc-document-thread-safety-contract`](rules/conc-document-thread-safety-contract.md) - Document the thread-confinement/thread-safety contract of shared objects

### 6. Foundation Collections & KVC/KVO (HIGH)

- [`kvc-observe-specific-keypath`](rules/kvc-observe-specific-keypath.md) - Observe specific, well-scoped key paths, not broad wildcard state
- [`kvc-remove-observer-before-dealloc`](rules/kvc-remove-observer-before-dealloc.md) - Always remove KVO observers before the observed object deallocates
- [`kvc-context-pointer-disambiguate`](rules/kvc-context-pointer-disambiguate.md) - Disambiguate KVO callbacks with a private static context pointer
- [`kvc-manual-change-notification`](rules/kvc-manual-change-notification.md) - Call `willChangeValueForKey:`/`didChangeValueForKey:` when hand-rolling KVO
- [`kvc-mutable-array-accessor-proxy`](rules/kvc-mutable-array-accessor-proxy.md) - Implement KVC-compliant indexed accessors for to-many relationships
- [`kvc-avoid-kvo-overuse`](rules/kvc-avoid-kvo-overuse.md) - Prefer a delegate/block callback over KVO when observation is simple
- [`kvc-valueforkey-nil-safety`](rules/kvc-valueforkey-nil-safety.md) - Handle `nil`/`NSNull` correctly with `valueForKey:`/`setValue:forKey:`
- [`kvc-notification-block-observer-token`](rules/kvc-notification-block-observer-token.md) - Prefer block-based `NSNotificationCenter` observers and keep the removal token
- [`kvc-observer-retain-cycle-avoid`](rules/kvc-observer-retain-cycle-avoid.md) - Avoid retain cycles from strongly-held notification/KVO observer references
- [`kvc-snapshot-before-mutation-iterate`](rules/kvc-snapshot-before-mutation-iterate.md) - Copy a collection before iterating it while it may be mutated
- [`kvc-fast-enumeration-preferred`](rules/kvc-fast-enumeration-preferred.md) - Prefer fast enumeration (`for...in`) over `NSEnumerator`/manual indexing
- [`kvc-dictionary-literal-nil-guard`](rules/kvc-dictionary-literal-nil-guard.md) - Guard against `nil` values before building `@{}` dictionary literals

### 7. Naming Conventions (MEDIUM)

- [`name-verbose-descriptive`](rules/name-verbose-descriptive.md) - Prefer verbose, descriptive names over cryptic abbreviations
- [`name-class-prefix-framework`](rules/name-class-prefix-framework.md) - Prefix classes with a 2-3 letter code when shipping a library/framework
- [`name-is-has-boolean-accessor`](rules/name-is-has-boolean-accessor.md) - Prefix Boolean accessors with `is`/`has`/`can`/`should`
- [`name-camelcase-convention`](rules/name-camelcase-convention.md) - Use `lowerCamelCase` for methods/properties, `UpperCamelCase` for types/protocols
- [`name-delegate-method-sender-first`](rules/name-delegate-method-sender-first.md) - Pass the sender as the first argument of delegate callback methods
- [`name-init-with-prefix`](rules/name-init-with-prefix.md) - Name initializers `initWith...`
- [`name-factory-method-matches-class`](rules/name-factory-method-matches-class.md) - Name class factory methods after the type they return
- [`name-no-get-prefix-getter`](rules/name-no-get-prefix-getter.md) - Don't prefix simple getters with `get`
- [`name-multi-keyword-selector-clarity`](rules/name-multi-keyword-selector-clarity.md) - Break multi-argument selectors into clearly labeled keyword segments
- [`name-constant-namespaced`](rules/name-constant-namespaced.md) - Namespace exported constants with the owning type's name
- [`name-notification-name-constant`](rules/name-notification-name-constant.md) - Export notification names as `NSNotificationName` constants, not string literals
- [`name-protocol-delegate-datasource-suffix`](rules/name-protocol-delegate-datasource-suffix.md) - Suffix callback protocols with `Delegate`/`DataSource`
- [`name-enum-case-type-prefix`](rules/name-enum-case-type-prefix.md) - Prefix `NS_ENUM` cases with the enclosing type's name

### 8. Testing (MEDIUM)

- [`test-arrange-act-assert-xctest`](rules/test-arrange-act-assert-xctest.md) - Structure XCTest methods as arrange/act/assert
- [`test-setup-teardown-lifecycle`](rules/test-setup-teardown-lifecycle.md) - Use `setUp`/`tearDown` for fixture lifecycle, not ad hoc init
- [`test-descriptive-method-names`](rules/test-descriptive-method-names.md) - Name test methods after the behavior they verify
- [`test-specific-xctassert-macros`](rules/test-specific-xctassert-macros.md) - Use the most specific `XCTAssert*` macro available
- [`test-async-expectation-waiting`](rules/test-async-expectation-waiting.md) - Use `XCTestExpectation`/`waitForExpectations` for async code
- [`test-ocmock-protocol-mocking`](rules/test-ocmock-protocol-mocking.md) - Use OCMock to mock protocols/classes at collaboration boundaries
- [`test-protocol-injection-for-mocking`](rules/test-protocol-injection-for-mocking.md) - Depend on protocols, not concrete classes, to enable test doubles
- [`test-avoid-testing-private-api`](rules/test-avoid-testing-private-api.md) - Test through the public interface, not private methods/ivars
- [`test-performance-measure-block`](rules/test-performance-measure-block.md) - Use `-measureBlock:`/`XCTMetric` for performance regressions
- [`test-uitest-separate-target`](rules/test-uitest-separate-target.md) - Keep `XCUITest` UI tests in a separate target from unit tests
- [`test-nil-vs-null-assertion-clarity`](rules/test-nil-vs-null-assertion-clarity.md) - Distinguish asserting `nil` from asserting `NSNull`
- [`test-isolated-fixture-no-shared-state`](rules/test-isolated-fixture-no-shared-state.md) - Give each test isolated fixtures; avoid shared mutable test state

### 9. Documentation (MEDIUM)

- [`doc-headerdoc-comment-style`](rules/doc-headerdoc-comment-style.md) - Document public API with HeaderDoc-style `/** ... */` comments
- [`doc-nullability-ownership-documented`](rules/doc-nullability-ownership-documented.md) - Document nullability and ownership expectations in header comments
- [`doc-thread-safety-documented`](rules/doc-thread-safety-documented.md) - State a type's thread-safety guarantees in its header comment
- [`doc-pragma-mark-organize`](rules/doc-pragma-mark-organize.md) - Use `#pragma mark -` to organize file sections
- [`doc-public-header-comments-only`](rules/doc-public-header-comments-only.md) - Put doc comments in the public header, not the implementation
- [`doc-param-return-tags`](rules/doc-param-return-tags.md) - Document `@param`/`@return` for non-trivial methods
- [`doc-deprecated-annotation-message`](rules/doc-deprecated-annotation-message.md) - Annotate deprecated API with `NS_DEPRECATED`/`__deprecated_msg` and a migration note
- [`doc-availability-macros`](rules/doc-availability-macros.md) - Guard platform/version-specific API with availability macros
- [`doc-usage-example-comment`](rules/doc-usage-example-comment.md) - Include a short usage example in the header comment for non-obvious APIs

### 10. Performance Patterns (MEDIUM)

- [`perf-avoid-alloc-in-drawrect`](rules/perf-avoid-alloc-in-drawrect.md) - Avoid allocating objects inside `drawRect:`/render loops
- [`perf-nscache-memory-sensitive-cache`](rules/perf-nscache-memory-sensitive-cache.md) - Use `NSCache` instead of a plain dictionary for memory-sensitive caches
- [`perf-lazy-property-initialization`](rules/perf-lazy-property-initialization.md) - Lazily initialize expensive properties on first access
- [`perf-reuse-cell-identifiers`](rules/perf-reuse-cell-identifiers.md) - Reuse table/collection view cells via reuse identifiers
- [`perf-avoid-kvo-hot-path`](rules/perf-avoid-kvo-hot-path.md) - Avoid KVO on properties that mutate in tight loops
- [`perf-avoid-boxing-hot-loop`](rules/perf-avoid-boxing-hot-loop.md) - Avoid boxing primitives into `NSNumber` inside hot loops
- [`perf-avoid-string-format-in-loop`](rules/perf-avoid-string-format-in-loop.md) - Avoid `stringWithFormat:`/`NSLog` inside hot loops
- [`perf-precompute-predicate-once`](rules/perf-precompute-predicate-once.md) - Build an `NSPredicate` once, reuse it, rather than rebuilding per iteration
- [`perf-batch-core-data-fetch`](rules/perf-batch-core-data-fetch.md) - Batch and page Core Data fetch requests instead of loading everything
- [`perf-decode-image-off-main`](rules/perf-decode-image-off-main.md) - Decode/resize images off the main thread
- [`perf-profile-instruments-first`](rules/perf-profile-instruments-first.md) - Profile with Instruments before optimizing

### 11. Swift Interop (MEDIUM)

- [`interop-ns-swift-name-rename`](rules/interop-ns-swift-name-rename.md) - Use `NS_SWIFT_NAME` to give Swift an idiomatic name for an Objective-C API
- [`interop-ns-refined-for-swift`](rules/interop-ns-refined-for-swift.md) - Use `NS_REFINED_FOR_SWIFT` to wrap a low-level ObjC API with a nicer Swift overlay
- [`interop-ns-swift-unavailable`](rules/interop-ns-swift-unavailable.md) - Hide ObjC-only API from Swift with `NS_SWIFT_UNAVAILABLE`
- [`interop-nullability-drives-optionals`](rules/interop-nullability-drives-optionals.md) - Use accurate nullability annotations since they determine Swift `Optional` bridging
- [`interop-generics-bridge-to-swift`](rules/interop-generics-bridge-to-swift.md) - Use lightweight generics so collections bridge to typed Swift arrays/dictionaries
- [`interop-error-domain-bridges-to-swift-error`](rules/interop-error-domain-bridges-to-swift-error.md) - Design `NSError` domains/codes to bridge cleanly to a Swift `Error` enum
- [`interop-avoid-macros-in-public-api`](rules/interop-avoid-macros-in-public-api.md) - Avoid preprocessor macros in public API surface since macros don't bridge to Swift
- [`interop-swift-name-enum-cases`](rules/interop-swift-name-enum-cases.md) - Use `NS_SWIFT_NAME` on `NS_ENUM` cases for idiomatic Swift case names
- [`interop-swift-friendly-factory-naming`](rules/interop-swift-friendly-factory-naming.md) - Name factory methods so they import as Swift initializers, not free functions

### 12. Project Structure (LOW)

- [`proj-header-implementation-split`](rules/proj-header-implementation-split.md) - Split public interface (`.h`) from implementation (`.m`)
- [`proj-umbrella-header`](rules/proj-umbrella-header.md) - Provide one umbrella header for a framework's public API
- [`proj-modulemap-for-framework`](rules/proj-modulemap-for-framework.md) - Provide a `module.modulemap` for clean Swift/clang-module imports
- [`proj-one-class-per-file`](rules/proj-one-class-per-file.md) - Keep one primary class per file, named to match
- [`proj-group-by-feature-not-type`](rules/proj-group-by-feature-not-type.md) - Organize files by feature/module, not by type (all-models, all-views)
- [`proj-pch-minimal`](rules/proj-pch-minimal.md) - Keep the precompiled prefix header minimal; avoid dumping every import into it
- [`proj-package-manager-podspec-spm`](rules/proj-package-manager-podspec-spm.md) - Ship a `.podspec` or Swift Package `Package.swift` target for distribution
- [`proj-private-headers-separate`](rules/proj-private-headers-separate.md) - Keep private/internal headers out of the public framework header directory
- [`proj-import-vs-forward-declare`](rules/proj-import-vs-forward-declare.md) - Forward-declare with `@class`/`@protocol` in headers; `#import` in implementation files
- [`proj-mm-suffix-for-cpp-interop`](rules/proj-mm-suffix-for-cpp-interop.md) - Use `.mm` only for files that actually need C++ interop

### 13. Linting (LOW)

- [`lint-clang-static-analyzer-ci`](rules/lint-clang-static-analyzer-ci.md) - Run the Clang Static Analyzer in CI
- [`lint-warnings-as-errors-build-setting`](rules/lint-warnings-as-errors-build-setting.md) - Treat warnings as errors (`GCC_TREAT_WARNINGS_AS_ERRORS`) in CI builds
- [`lint-clang-format-config`](rules/lint-clang-format-config.md) - Enforce a shared `.clang-format` style in CI
- [`lint-oclint-ruleset`](rules/lint-oclint-ruleset.md) - Adopt an OCLint ruleset for structural/complexity issues
- [`lint-deprecated-api-warning-enabled`](rules/lint-deprecated-api-warning-enabled.md) - Enable deprecated-API warnings and fix or suppress them explicitly
- [`lint-nullability-completeness-check`](rules/lint-nullability-completeness-check.md) - Enable `-Wnullable-to-nonnull-conversion` and related nullability warnings
- [`lint-unused-variable-warning`](rules/lint-unused-variable-warning.md) - Enable and fix unused-variable/unused-import warnings
- [`lint-objc-strict-flags`](rules/lint-objc-strict-flags.md) - Build with `-Wobjc-*`/strict selector and protocol warnings enabled
- [`lint-infer-static-analysis`](rules/lint-infer-static-analysis.md) - Run Meta's Infer static analyzer for deeper cross-procedure checks

### 14. Anti-patterns (REFERENCE)

- [`anti-retain-cycle-block-self`](rules/anti-retain-cycle-block-self.md) - Don't capture `self` strongly in a block stored as a property
- [`anti-massive-view-controller`](rules/anti-massive-view-controller.md) - Don't build a Massive View Controller that owns every responsibility
- [`anti-singleton-overuse`](rules/anti-singleton-overuse.md) - Don't reach for a singleton as the default access pattern
- [`anti-stringly-typed-notifications`](rules/anti-stringly-typed-notifications.md) - Don't use raw string literals for notification names/userInfo keys
- [`anti-ignore-nserror`](rules/anti-ignore-nserror.md) - Don't silently ignore a populated `NSError`
- [`anti-unchecked-id-cast`](rules/anti-unchecked-id-cast.md) - Don't cast `id` to a concrete type without an `isKindOfClass:` check
- [`anti-import-everything-header`](rules/anti-import-everything-header.md) - Don't `#import` the world into one umbrella/prefix header
- [`anti-nested-block-pyramid`](rules/anti-nested-block-pyramid.md) - Don't nest completion-handler blocks into a callback pyramid
- [`anti-manual-memory-management-arc`](rules/anti-manual-memory-management-arc.md) - Don't call `retain`/`release`/double-`dealloc`-super under ARC
- [`anti-mutable-public-property`](rules/anti-mutable-public-property.md) - Don't expose a mutable (`NSMutableArray *`) property directly on a public interface
- [`anti-category-method-override`](rules/anti-category-method-override.md) - Don't override an existing method from a category (undefined behavior)
- [`anti-kvo-without-removal`](rules/anti-kvo-without-removal.md) - Don't add a KVO observer without a matching, guaranteed removal
- [`anti-synchronized-giant-scope`](rules/anti-synchronized-giant-scope.md) - Don't wrap large swaths of code in one `@synchronized` block
- [`anti-unvalidated-nonnull-violation`](rules/anti-unvalidated-nonnull-violation.md) - Don't pass `nil` across a `nonnull` boundary and hope for the best
- [`anti-nsnumber-primitive-obsession`](rules/anti-nsnumber-primitive-obsession.md) - Don't stringify/box everything into `NSNumber`/`NSString` instead of real types

---

## Recommended Tooling Configuration

Xcode build settings (`.xcconfig` fragment — ARC, warnings-as-errors, nullability strictness):

```
// Shared.xcconfig
CLANG_ENABLE_OBJC_ARC = YES
CLANG_ENABLE_OBJC_WEAK = YES
GCC_TREAT_WARNINGS_AS_ERRORS = YES
CLANG_WARN_DOCUMENTATION_COMMENTS = YES
CLANG_WARN_OBJC_LITERAL_CONVERSION = YES
CLANG_WARN_OBJC_ROOT_CLASS = YES
CLANG_WARN__DUPLICATE_METHOD_MATCH = YES
CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES
CLANG_WARN_NULLABLE_TO_NONNULL_CONVERSION = YES
CLANG_WARN_STRICT_PROTOTYPES = YES
CLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE
GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE
GCC_WARN_UNUSED_VARIABLE = YES
CLANG_ANALYZER_NONNULL = YES
CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE
RUN_CLANG_STATIC_ANALYZER = YES
ENABLE_STRICT_OBJC_MSGSEND = YES
```

`.clang-format` (Google-derived Objective-C style):

```yaml
Language: ObjC
BasedOnStyle: Google
ColumnLimit: 100
ObjCBlockIndentWidth: 2
ObjCSpaceAfterProperty: true
ObjCSpaceBeforeProtocolList: true
SortIncludes: false
IndentWidth: 2
AllowShortBlocksOnASingleLine: false
AllowShortFunctionsOnASingleLine: Empty
BreakBeforeBraces: Attach
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing Objective-C code:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
4. **Read rule files** in `rules/` for detailed examples

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New class/header | `arc-`, `null-`, `name-` |
| New public API/framework | `api-`, `null-`, `doc-` |
| Blocks/GCD code | `conc-`, `arc-` |
| Error handling | `err-`, `api-` |
| KVO/KVC/Foundation collections | `kvc-`, `arc-` |
| Memory/retain-cycle review | `arc-`, `anti-` |
| Swift-facing API | `interop-`, `null-` |
| Performance tuning | `perf-`, `arc-` |
| Code review | `anti-`, `lint-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) - language-agnostic GoF/architectural pattern selection covering Objective-C; prefer idiomatic Cocoa constructs (delegate/data-source protocols, class clusters, category-based composition) before reaching for a named pattern.
- [security-review](../security-review/SKILL.md) - multi-language security/correctness review; use it for security audits and PR review of Objective-C code (format-string, unsafe C interop, and memory-safety bug classes), and use `objectivec-coding` for day-to-day authoring and idiom review.
- [swift-coding](../swift-coding/SKILL.md) - the sibling Apple-platform skill for Swift itself, including its "Objective-C Interop" category (`interop-` rules) covering the Swift-side view of bridging (`@objc`/`@objcMembers` exposure, bridging headers, force-cast avoidance). This skill (`objectivec-coding`) covers the reverse direction: writing and reviewing Objective-C itself, including the ObjC-side interop annotations (`NS_SWIFT_NAME`, `NS_REFINED_FOR_SWIFT`) that make an Objective-C API bridge cleanly to Swift.

## Sources

This skill synthesizes best practices from:
- [Apple Objective-C Programming Language Guide](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ProgrammingWithObjectiveC/Introduction/Introduction.html) (official)
- [Apple Cocoa Coding Guidelines](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CodingGuidelines/CodingGuidelines.html) (official)
- [Apple Nullability and Objective-C](https://developer.apple.com/swift/blog/?id=25) and Clang's nullability/Swift-interop attribute documentation
- [Google Objective-C Style Guide](https://google.github.io/styleguide/objcguide.html)
- [NSHipster](https://nshipster.com/) (ARC, nullability, lightweight generics, and Foundation-idiom deep dives)
- Production/reference codebases: AFNetworking, Apple's open-source Objective-C frameworks (e.g. `swift-corelibs-foundation`'s ObjC-facing shims), and long-lived Cocoa/Cocoa Touch libraries
- Community conventions (2015-2026, including post-ARC and Swift-interop era practices)
