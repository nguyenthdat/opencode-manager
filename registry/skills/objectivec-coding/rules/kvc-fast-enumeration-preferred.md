# kvc-fast-enumeration-preferred

> Prefer fast enumeration (`for...in`) over `NSEnumerator`/manual indexing

## Why It Matters

Fast enumeration (`for (id obj in collection)`) is implemented via `NSFastEnumeration`, which Foundation's collection classes back with a highly optimized bulk-buffer implementation - it's both faster and more concise than manually walking an `NSEnumerator` or indexing with `objectAtIndex:` in a `for` loop, and it automatically raises on concurrent mutation instead of silently reading stale or corrupted state (see `kvc-snapshot-before-mutation-iterate` for handling that case).

## Bad

```objc
- (NSArray<NSString *> *)uppercasedNames:(NSArray<NSString *> *)names {
    NSMutableArray<NSString *> *result = [NSMutableArray array];
    // Manual indexing: an extra bounds-checked objectAtIndex: call per
    // iteration, and easy to get the loop bound wrong (off-by-one).
    for (NSUInteger i = 0; i < names.count; i++) {
        [result addObject:[names[i] uppercaseString]];
    }
    return result;
}

- (void)logAllKeys:(NSDictionary<NSString *, id> *)dictionary {
    // NSEnumerator is slower than fast enumeration and more verbose
    // for the common "just walk every element" case.
    NSEnumerator *enumerator = [dictionary keyEnumerator];
    NSString *key;
    while ((key = [enumerator nextObject])) {
        NSLog(@"%@", key);
    }
}
```

## Good

```objc
- (NSArray<NSString *> *)uppercasedNames:(NSArray<NSString *> *)names {
    NSMutableArray<NSString *> *result = [NSMutableArray arrayWithCapacity:names.count];
    for (NSString *name in names) {
        [result addObject:[name uppercaseString]];
    }
    return result;
}

- (void)logAllKeys:(NSDictionary<NSString *, id> *)dictionary {
    for (NSString *key in dictionary) {
        NSLog(@"%@", key);
    }
}
```

## Getting the Index When You Need It

```objc
// enumerateObjectsUsingBlock: gives you the index without falling back
// to manual objectAtIndex: indexing, and supports early exit via *stop.
[names enumerateObjectsUsingBlock:^(NSString *name, NSUInteger idx, BOOL *stop) {
    NSLog(@"%lu: %@", (unsigned long)idx, name);
    if ([name isEqualToString:@"stop-here"]) {
        *stop = YES;
    }
}];
```

## When `NSEnumerator` Still Makes Sense

```objc
// NSEnumerator is appropriate when you need to walk two collections in
// lockstep, or pause/resume enumeration across separate method calls -
// something a single for...in loop can't express.
NSEnumerator *first = [firstNames objectEnumerator];
NSEnumerator *last = [lastNames objectEnumerator];
NSString *firstName, *lastName;
while ((firstName = [first nextObject]) && (lastName = [last nextObject])) {
    NSLog(@"%@ %@", firstName, lastName);
}
```

## See Also

- [`kvc-snapshot-before-mutation-iterate`](kvc-snapshot-before-mutation-iterate.md) - Copy a collection before iterating it while it may be mutated
- [`perf-avoid-boxing-hot-loop`](perf-avoid-boxing-hot-loop.md) - Avoid boxing primitives into `NSNumber` inside hot loops
- [`null-lightweight-generics`](null-lightweight-generics.md) - Parameterize collections with lightweight generics (`NSArray<NSString *> *`)
