# perf-precompute-predicate-once

> Build an `NSPredicate` once, reuse it, rather than rebuilding per iteration

## Why It Matters

`+predicateWithFormat:` parses a format string into an expression tree every time it's called — that parse cost is paid again on every loop iteration if the predicate is rebuilt inside the loop instead of hoisted outside it. For a filter applied across a large collection, or a predicate reused across many `NSFetchRequest`s, this parsing overhead can dwarf the cost of actually evaluating the predicate.

## Bad

```objc
- (NSArray<OMWUser *> *)activeAdultUsersIn:(NSArray<OMWUser *> *)allUsers {
    NSMutableArray<OMWUser *> *result = [NSMutableArray array];
    for (OMWUser *user in allUsers) {
        // Parses the same format string on every single iteration.
        NSPredicate *predicate = [NSPredicate predicateWithFormat:@"isActive == YES AND age >= 18"];
        if ([predicate evaluateWithObject:user]) {
            [result addObject:user];
        }
    }
    return result;
}
```

## Good

```objc
- (NSArray<OMWUser *> *)activeAdultUsersIn:(NSArray<OMWUser *> *)allUsers {
    // Parsed exactly once, before the loop starts.
    static NSPredicate *predicate;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        predicate = [NSPredicate predicateWithFormat:@"isActive == YES AND age >= 18"];
    });

    NSMutableArray<OMWUser *> *result = [NSMutableArray array];
    for (OMWUser *user in allUsers) {
        if ([predicate evaluateWithObject:user]) {
            [result addObject:user];
        }
    }
    return result;
}

// Or, more idiomatically for a one-shot filter of an array:
- (NSArray<OMWUser *> *)activeAdultUsersFiltering:(NSArray<OMWUser *> *)allUsers {
    NSPredicate *predicate = [NSPredicate predicateWithFormat:@"isActive == YES AND age >= 18"];
    return [allUsers filteredArrayUsingPredicate:predicate]; // predicate built once, applied to whole array
}
```

## Parameterized Predicates via Substitution Variables

```objc
// When the same *shape* of predicate is reused with different bound
// values, build the template once and substitute variables per call
// instead of reformatting a new predicate string each time.
static NSPredicate *ageThresholdTemplate(void) {
    static NSPredicate *template;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        template = [NSPredicate predicateWithFormat:@"age >= $minAge"];
    });
    return template;
}

- (NSArray<OMWUser *> *)usersAtLeastAge:(NSInteger)minAge in:(NSArray<OMWUser *> *)allUsers {
    NSPredicate *bound = [ageThresholdTemplate()
        predicateWithSubstitutionVariables:@{@"minAge": @(minAge)}];
    return [allUsers filteredArrayUsingPredicate:bound];
}
```

## Reuse Fetch-Request Predicates in Core Data

```objc
// Cache and reuse compiled fetch request templates for a query that
// runs repeatedly (e.g. once per pull-to-refresh) instead of rebuilding
// the NSPredicate string on every call.
@property (nonatomic, strong, readonly) NSPredicate *unreadMessagesPredicate;
```

## See Also

- [`perf-avoid-string-format-in-loop`](perf-avoid-string-format-in-loop.md) - Avoid `stringWithFormat:`/`NSLog` inside hot loops
- [`perf-batch-core-data-fetch`](perf-batch-core-data-fetch.md) - Batch and page Core Data fetch requests instead of loading everything
- [`perf-profile-instruments-first`](perf-profile-instruments-first.md) - Profile with Instruments before optimizing
