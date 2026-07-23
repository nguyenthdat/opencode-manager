# anti-sizeof-array-parameter

> Don't call `sizeof` on a pointer parameter expecting the original array's size; arrays decay to pointers at function boundaries

## Why It Matters

Inside a function, an "array parameter" is really a pointer — the compiler doesn't preserve the caller's array length across the call. `sizeof` on that parameter yields the pointer's size (typically 4 or 8 bytes), not the number of bytes or elements the caller's array actually had, a bug that's invisible until you notice the loop only ever processes 1-2 elements.

## Bad

```c
void zero_out(int arr[]) {
    size_t n = sizeof(arr) / sizeof(arr[0]);   /* sizeof(int*) / sizeof(int): almost always wrong (e.g. 2 on 64-bit) */
    for (size_t i = 0; i < n; i++) {
        arr[i] = 0;
    }
}

int data[100];
zero_out(data);   /* only the first ~2 elements get zeroed, not 100 */
```

## Good

```c
void zero_out(int *arr, size_t n) {
    for (size_t i = 0; i < n; i++) {
        arr[i] = 0;
    }
}

int data[100];
zero_out(data, sizeof(data) / sizeof(data[0]));   /* computed at the call site, where sizeof(data) is still meaningful */
```

## sizeof Only Behaves as Expected on the Original Array, in Its Own Scope

```c
void f(void) {
    int local[50];
    size_t n = sizeof(local) / sizeof(local[0]);   /* correct: 50, computed before any decay occurs */
}
```

## See Also

- [ptr-array-decay-awareness](ptr-array-decay-awareness.md) - The full rule this anti-pattern violates
- [mem-sizeof-pointer-pitfall](mem-sizeof-pointer-pitfall.md) - A related `sizeof` pitfall in allocation code
- [ptr-array-vs-pointer-param](ptr-array-vs-pointer-param.md) - Writing array-parameter signatures that make this explicit
