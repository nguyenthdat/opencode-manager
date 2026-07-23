# anti-mixing-signed-unsigned-compare

> Don't compare a signed and an unsigned integer directly; the signed value is implicitly converted to unsigned, which can silently invert the comparison's intent

## Why It Matters

When a signed and unsigned value of the same rank are compared, C implicitly converts the signed operand to unsigned before comparing. A negative signed value becomes a very large unsigned value after that conversion, which can make a comparison intended to catch "negative" values instead treat them as enormous positive ones — silently inverting the logic.

## Bad

```c
int index = get_index();       /* could legitimately be -1 to signal "not found" */
size_t len = get_length();

if (index < len) {                /* index (-1) converts to SIZE_MAX: this is almost always true, even for -1! */
    process(arr[index]);            /* out-of-bounds access if index was actually -1 */
}
```

## Good

```c
int index = get_index();
size_t len = get_length();

if (index >= 0 && (size_t)index < len) {   /* check sign first, only then compare as unsigned */
    process(arr[index]);
}
```

## Compiler Warning That Catches This

```sh
cc -Wall -Wextra -Wsign-compare file.c   # -Wextra includes -Wsign-compare; flags exactly this hazard
```

## See Also

- [ub-signed-integer-overflow](ub-signed-integer-overflow.md) - Related signed-arithmetic hazards
- [type-avoid-implicit-narrowing](type-avoid-implicit-narrowing.md) - The broader implicit-conversion discipline
- [type-size-t-for-sizes](type-size-t-for-sizes.md) - Why sizes end up unsigned in the first place
