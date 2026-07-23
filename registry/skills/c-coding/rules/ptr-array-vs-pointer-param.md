# ptr-array-vs-pointer-param

> Write array-style function parameters in the way that best documents intent, understanding both are pointers

## Why It Matters

`void f(int arr[], size_t n)` and `void f(int *arr, size_t n)` are identical to the compiler — array parameters always decay to pointers. Choosing the array syntax where a fixed shape is implied (and pointer syntax otherwise) communicates intent to readers even though it has no effect on the generated code, and C99's static bound syntax can express minimum-length contracts explicitly.

## Bad

```c
/* Signature gives no hint about the expected relationship between rows/cols */
void fill_matrix(int *m, int rows, int cols);

/* Multi-dimensional array parameter written confusingly */
void process(int m[][10]);   /* only the first dimension decays; is that obvious here? */
```

## Good

```c
/* Explicit and matches how it's called */
void fill_matrix(int *m, size_t rows, size_t cols);   /* m treated as rows*cols flat buffer */

/* For a true 2D array parameter, the second dimension must be fixed and explicit: */
void process(int m[][10], size_t rows);   /* each row is exactly 10 ints */

/* C99 static bound: documents (and in some compilers, checks) a minimum length */
void checksum(const unsigned char buf[static 16]);
```

## Prefer Explicit Pointer + Length Over Fixed-Size 2D Arrays

```c
/* More flexible: works for any rows/cols, computed once */
void fill_matrix(int *m, size_t rows, size_t cols) {
    for (size_t r = 0; r < rows; r++)
        for (size_t c = 0; c < cols; c++)
            m[r * cols + c] = 0;
}
```

## See Also

- [ptr-array-decay-awareness](ptr-array-decay-awareness.md) - Why the length must travel with the pointer
- [ptr-multidim-indexing-bounds](ptr-multidim-indexing-bounds.md) - Indexing math for flattened multi-dimensional arrays
- [api-const-correct-signatures](api-const-correct-signatures.md) - Combine with `const` for read-only array parameters
