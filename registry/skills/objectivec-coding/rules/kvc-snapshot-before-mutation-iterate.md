# kvc-snapshot-before-mutation-iterate

> Copy a collection before iterating it while it may be mutated

## Why It Matters

Fast enumeration (`for...in`) over an `NSMutableArray`/`NSMutableDictionary`/`NSMutableSet` detects structural mutation during the loop and raises `NSGenericException` ("was mutated while being enumerated"), even if the mutation happens inside a delegate callback triggered from within the loop body. This is common when a loop body calls out to code that, directly or indirectly, adds to or removes from the very collection being iterated (e.g. notifying observers who unregister themselves).

## Bad

```objc
- (void)notifyAllObserversOfEvent:(OMWEvent *)event {
    // If any observer's -eventStore:didReceiveEvent: removes itself
    // (a very common pattern for one-shot listeners), this throws
    // "*** Collection <NSMutableArray> was mutated while being enumerated."
    for (id<OMWEventObserver> observer in self.observers) {
        [observer eventStore:self didReceiveEvent:event];
    }
}

- (void)removeObserver:(id<OMWEventObserver>)observer {
    [self.observers removeObject:observer];
}
```

## Good

```objc
- (void)notifyAllObserversOfEvent:(OMWEvent *)event {
    // Snapshot into an immutable array first; mutations to the live
    // self.observers array during the loop no longer affect this copy.
    NSArray<id<OMWEventObserver>> *observersSnapshot = [self.observers copy];
    for (id<OMWEventObserver> observer in observersSnapshot) {
        [observer eventStore:self didReceiveEvent:event];
    }
}

- (void)removeObserver:(id<OMWEventObserver>)observer {
    [self.observers removeObject:observer];
}
```

## Dictionaries Need the Same Treatment

```objc
- (void)invalidateExpiredEntries {
    NSDictionary<NSString *, OMWCacheEntry *> *snapshot = [self.cache copy];
    for (NSString *key in snapshot) {
        if (snapshot[key].isExpired) {
            [self.cache removeObjectForKey:key]; // Safe: mutating the live
                                                  // dictionary, not the snapshot being enumerated.
        }
    }
}
```

## A Cheaper Alternative When You Control the Mutation

```objc
// If the removals are all known up front rather than triggered by
// callbacks mid-loop, collecting keys to remove and mutating once
// after the loop avoids the copy entirely.
- (void)invalidateExpiredEntriesNoCopy {
    NSMutableArray<NSString *> *expiredKeys = [NSMutableArray array];
    for (NSString *key in self.cache) {
        if (self.cache[key].isExpired) {
            [expiredKeys addObject:key];
        }
    }
    [self.cache removeObjectsForKeys:expiredKeys];
}
```

## See Also

- [`kvc-fast-enumeration-preferred`](kvc-fast-enumeration-preferred.md) - Prefer fast enumeration (`for...in`) over `NSEnumerator`/manual indexing
- [`arc-copy-value-objects`](arc-copy-value-objects.md) - Use `copy` (not `strong`) for `NSString`/`NSArray`/`NSDictionary` properties
- [`anti-mutable-public-property`](anti-mutable-public-property.md) - Don't expose a mutable (`NSMutableArray *`) property directly on a public interface
