# lint-unused-variable-warning

> Enable and fix unused-variable/unused-import warnings

## Why It Matters

An unused local variable or a dangling `#import` is almost always the residue of a refactor that didn't finish: a value that was meant to be checked but isn't, or a dependency that used to be needed and no longer is. Left unaddressed, unused variables hide real bugs (a result that should have been checked or returned is silently thrown away) and unused imports bloat compile time and obscure a file's true dependency list, making it harder to reason about what actually changes when a header is edited.

## Bad

```objc
// GCC_WARN_UNUSED_VARIABLE off, so this compiles cleanly despite the
// mistake: the validation result is computed but never checked.
- (void)submitFormWithFields:(NSDictionary *)fields {
    BOOL isValid = [self validateFields:fields];   // Never read again --
                                                     // the bug is that the
                                                     // form submits even
                                                     // when invalid.
    [self.networkClient postFields:fields];
}
```

```objc
// OMWOrder.m
#import "OMWOrder.h"
#import "OMWLegacyPricingEngine.h"   // Pricing was migrated to
                                       // OMWPricingEngine two releases
                                       // ago; this import is dead weight
                                       // nobody noticed because unused
                                       // import warnings aren't on.
```

## Good

```
// Shared.xcconfig
GCC_WARN_UNUSED_VARIABLE = YES
GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE
```

```objc
// Fixed: the result is now actually used to gate submission, which is
// what the missing warning should have forced someone to notice.
- (void)submitFormWithFields:(NSDictionary *)fields {
    BOOL isValid = [self validateFields:fields];
    if (!isValid) {
        [self showValidationError];
        return;
    }
    [self.networkClient postFields:fields];
}
```

```objc
// OMWOrder.m -- dead import removed once GCC_WARN_UNUSED_VARIABLE-style
// tooling (or `clang -Wunused-import`, via -Wall) surfaced it.
#import "OMWOrder.h"
#import "OMWPricingEngine.h"
```

## Deliberately Unused Parameters

```objc
// A protocol conformance sometimes requires a parameter the
// implementation genuinely doesn't need. Silence just that one
// warning at the declaration, rather than disabling the class of
// warning project-wide.
- (void)tableView:(UITableView *)tableView
      didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    __unused UITableView *unusedTableView = tableView;
    [self.delegate itemSelectedAtIndex:indexPath.row];
}
```

## See Also

- [`lint-warnings-as-errors-build-setting`](lint-warnings-as-errors-build-setting.md) - Treat warnings as errors (`GCC_TREAT_WARNINGS_AS_ERRORS`) in CI builds
- [`proj-import-vs-forward-declare`](proj-import-vs-forward-declare.md) - Forward-declare with `@class`/`@protocol` in headers; `#import` in implementation files
- [`err-check-return-value-first`](err-check-return-value-first.md) - Check the BOOL/nil return value, not just whether an error was set
