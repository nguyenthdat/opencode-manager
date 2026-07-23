# perf-struct-of-arrays

> For hot loops that process one field across many objects, prefer a struct-of-arrays (SoA) layout over an array-of-structs (AoS) layout

## Why It Matters

Array-of-structs (`struct point points[N];`) is natural to model but forces the CPU to load every field of each element even when a loop only touches one field, wasting cache bandwidth and reducing how many relevant elements fit in a single cache line. Struct-of-arrays (`float xs[N]; float ys[N];`) packs each field contiguously, letting a loop over just that field stream through memory efficiently and vectorize more readily.

## Bad — Array of Structs

```c
struct point { float x, y, z; };
struct point points[100000];

float sum_x(void) {
    float total = 0;
    for (int i = 0; i < 100000; i++) {
        total += points[i].x;   /* loads y, z into cache too, unused by this loop */
    }
    return total;
}
```

## Good — Struct of Arrays

```c
struct point_cloud {
    float x[100000];
    float y[100000];
    float z[100000];
};
struct point_cloud cloud;

float sum_x(const struct point_cloud *c) {
    float total = 0;
    for (int i = 0; i < 100000; i++) {
        total += c->x[i];   /* tight, sequential access; no wasted y/z bytes in cache */
    }
    return total;
}
```

## Trade-off: AoS Is Often Better for "Whole Object" Access Patterns

If your dominant access pattern reads/writes an entire object's fields together (not just one field across many objects), AoS keeps that object's data in one cache line and is usually the better choice — SoA is specifically a win when a loop is field-major, not object-major.

## See Also

- [perf-cache-friendly-struct-layout](perf-cache-friendly-struct-layout.md) - The broader cache-locality principle
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Verify the access pattern before restructuring
- [perf-avoid-false-sharing](perf-avoid-false-sharing.md) - A related layout concern in multi-threaded code
