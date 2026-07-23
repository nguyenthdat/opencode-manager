# ptr-array-decay-awareness

> Know that arrays decay to pointers at function boundaries, and always pass the length alongside

## Why It Matters

When an array is passed to a function, it decays to a pointer to its first element — the function has no way to recover the original array's length from the parameter itself. `sizeof` on that parameter gives the pointer's size, not the array's, a frequent source of bugs for developers new to C.

## Bad

```c
void process(int arr[]) {
    size_t n = sizeof(arr) / sizeof(arr[0]);  /* sizeof(int*) / sizeof(int): wrong! */
    for (size_t i = 0; i < n; i++) {
        arr[i] *= 2;
    }
}

int data[100];
process(data);   /* n above is not 100 */
```

## Good

```c
void process(int *arr, size_t n) {
    for (size_t i = 0; i < n; i++) {
        arr[i] *= 2;
    }
}

int data[100];
process(data, sizeof(data) / sizeof(data[0]));   /* compute length at the call site, where the array type is still known */
```

## sizeof Works Correctly Only in the Defining Scope

```c
int data[100];
size_t n = sizeof(data) / sizeof(data[0]);   /* correct: 100, computed before decay */

/* A macro helps avoid repeating the division: */
#define ARRAY_LEN(a) (sizeof(a) / sizeof((a)[0]))
size_t n2 = ARRAY_LEN(data);
```

## See Also

- [ptr-array-vs-pointer-param](ptr-array-vs-pointer-param.md) - Signature clarity for array parameters
- [anti-sizeof-array-parameter](anti-sizeof-array-parameter.md) - The specific anti-pattern this causes
- [ptr-bounds-before-index](ptr-bounds-before-index.md) - Bounds discipline once length is tracked correctly
