# perf-avoid-boxing-hot-loop

> Avoid boxing primitives into `NSNumber` inside hot loops

## Why It Matters

`@(x)` and `[NSNumber numberWithDouble:x]` heap-allocate an object for every single primitive value, and unboxing with `.doubleValue`/`.intValue` adds a message-send on top. Inside a loop processing thousands of samples, this turns an O(1)-per-element arithmetic operation into an O(1)-per-element heap allocation plus retain/release traffic, which shows up as heavy Autorelease Pool churn in Instruments.

## Bad

```objc
- (double)averageOf:(NSArray<NSNumber *> *)rawSamples {
    // Building the boxed array in the first place: every sample becomes
    // a heap-allocated NSNumber just to compute a running sum.
    NSMutableArray<NSNumber *> *boxed = [NSMutableArray array];
    for (NSUInteger i = 0; i < sampleCount; i++) {
        [boxed addObject:@(rawDoubleSamples[i])]; // allocation per sample
    }

    double sum = 0;
    for (NSNumber *number in boxed) {
        sum += number.doubleValue; // unboxing message-send per sample
    }
    return sum / boxed.count;
}
```

## Good

```objc
- (double)averageOfSamples:(const double *)rawSamples count:(NSUInteger)sampleCount {
    // Work directly on the primitive C array; no boxing at all.
    double sum = 0;
    for (NSUInteger i = 0; i < sampleCount; i++) {
        sum += rawSamples[i];
    }
    return sampleCount > 0 ? sum / (double)sampleCount : 0;
}

// If the data must travel as a collection at an API boundary, use
// NSData/malloc'd buffers or vDSP, and only box at the edges (e.g. one
// final NSNumber for a computed result), never per-element inside a loop.
- (NSNumber *)averageOfDataSamples:(NSData *)sampleData {
    const double *samples = sampleData.bytes;
    NSUInteger count = sampleData.length / sizeof(double);
    double average = [self averageOfSamples:samples count:count];
    return @(average); // one allocation total, not one per sample
}
```

## Use `vDSP`/Accelerate for Numeric Hot Loops

```objc
#import <Accelerate/Accelerate.h>

- (double)fastAverageOfSamples:(const double *)samples count:(NSUInteger)count {
    double mean = 0;
    vDSP_meanvD(samples, 1, &mean, count); // vectorized, no boxing, no branching per element
    return mean;
}
```

## Avoid `NSArray<NSNumber *>` as the Primary Storage for Large Numeric Buffers

```objc
// Bad for large buffers: every element is a separate heap object,
// hostile to cache locality and to the allocator under high volume.
@property (nonatomic, strong) NSArray<NSNumber *> *audioSamples;

// Better: contiguous primitive storage, boxed only at the API boundary
// when a small handful of values need to travel through Cocoa APIs.
@property (nonatomic, strong) NSData *audioSampleData; // packed doubles/floats
```

## See Also

- [`anti-nsnumber-primitive-obsession`](anti-nsnumber-primitive-obsession.md) - Don't stringify/box everything into `NSNumber`/`NSString` instead of real types
- [`perf-avoid-kvo-hot-path`](perf-avoid-kvo-hot-path.md) - Avoid KVO on properties that mutate in tight loops
- [`perf-profile-instruments-first`](perf-profile-instruments-first.md) - Profile with Instruments before optimizing
