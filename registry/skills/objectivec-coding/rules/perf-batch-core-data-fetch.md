# perf-batch-core-data-fetch

> Batch and page Core Data fetch requests instead of loading everything

## Why It Matters

An `NSFetchRequest` with no limit faults every matching row's data into memory at once, which for a large table means a huge spike in memory usage and a long stall on the main thread while Core Data materializes thousands of managed objects the UI will never display simultaneously. `fetchBatchSize`, `fetchLimit`, and predicates that narrow the working set keep both memory and latency bounded.

## Bad

```objc
- (NSArray<OMWTransactionMO *> *)allTransactions {
    NSFetchRequest<OMWTransactionMO *> *request =
        [OMWTransactionMO fetchRequest];
    // No batch size, no limit, no predicate — this pulls every
    // transaction ever recorded into memory in one shot.
    NSError *error = nil;
    NSArray<OMWTransactionMO *> *results =
        [self.managedObjectContext executeFetchRequest:request error:&error];
    return results;
}
```

## Good

```objc
- (NSArray<OMWTransactionMO *> *)recentTransactionsPage:(NSUInteger)page
                                                pageSize:(NSUInteger)pageSize {
    NSFetchRequest<OMWTransactionMO *> *request = [OMWTransactionMO fetchRequest];
    request.sortDescriptors = @[[NSSortDescriptor sortDescriptorWithKey:@"date" ascending:NO]];

    // fetchBatchSize keeps Core Data from materializing the whole result
    // set at once; it fetches in chunks as the array is enumerated.
    request.fetchBatchSize = 50;

    // fetchOffset/fetchLimit implement paging directly at the SQLite
    // level, so unrequested rows are never even faulted.
    request.fetchOffset = page * pageSize;
    request.fetchLimit = pageSize;

    NSError *error = nil;
    NSArray<OMWTransactionMO *> *results =
        [self.managedObjectContext executeFetchRequest:request error:&error];
    if (results == nil) {
        NSLog(@"Fetch failed: %@", error);
        return @[];
    }
    return results;
}
```

## Narrow the Fetch with a Predicate Instead of Filtering in Memory

```objc
// Don't fetch everything and then filter in a loop — push the filter
// down into the predicate so SQLite does the narrowing.
- (NSArray<OMWTransactionMO *> *)transactionsSince:(NSDate *)date {
    NSFetchRequest<OMWTransactionMO *> *request = [OMWTransactionMO fetchRequest];
    request.predicate = [NSPredicate predicateWithFormat:@"date >= %@", date];
    request.fetchBatchSize = 50;

    NSError *error = nil;
    return [self.managedObjectContext executeFetchRequest:request error:&error] ?: @[];
}
```

## Use `NSFetchedResultsController` for Table-Backed Paging

```objc
// NSFetchedResultsController manages batching, section grouping, and
// incremental table-view updates automatically — prefer it over manual
// paging when the fetch backs a UITableView/UICollectionView directly.
NSFetchRequest<OMWTransactionMO *> *request = [OMWTransactionMO fetchRequest];
request.sortDescriptors = @[[NSSortDescriptor sortDescriptorWithKey:@"date" ascending:NO]];
request.fetchBatchSize = 50;

NSFetchedResultsController *controller =
    [[NSFetchedResultsController alloc] initWithFetchRequest:request
                                          managedObjectContext:self.managedObjectContext
                                            sectionNameKeyPath:nil
                                                     cacheName:@"OMWTransactionsCache"];
```

## See Also

- [`perf-precompute-predicate-once`](perf-precompute-predicate-once.md) - Build an `NSPredicate` once, reuse it, rather than rebuilding per iteration
- [`perf-decode-image-off-main`](perf-decode-image-off-main.md) - Decode/resize images off the main thread
- [`conc-avoid-blocking-main-thread`](conc-avoid-blocking-main-thread.md) - Never perform synchronous network/disk I/O on the main thread
