# str-buffer-size-discipline

> Always pass a buffer's size alongside its pointer, computed with `sizeof` at the buffer's declaration site, never as a separately-tracked magic number

## Why It Matters

A buffer's size and its pointer are two halves of one fact; if the size is written as a literal (`256`) rather than derived from `sizeof(buf)`, resizing the buffer later requires remembering to update every literal that referenced its old size — miss one, and you have a buffer overflow that a compiler cannot catch.

## Bad

```c
char path[256];
snprintf(path, 256, "%s/%s", dir, file);   /* magic number, disconnected from path's actual declaration */

/* Later, someone resizes path... */
char path[512];
snprintf(path, 256, "%s/%s", dir, file);    /* still 256: now silently truncates unnecessarily, and easy to miss */
```

## Good

```c
char path[256];
snprintf(path, sizeof(path), "%s/%s", dir, file);   /* always tracks path's actual size */

/* Resizing path automatically keeps every sizeof(path) call site correct: */
char path[512];
snprintf(path, sizeof(path), "%s/%s", dir, file);
```

## Threading Size Through Function Boundaries

```c
/* Once a buffer decays to a pointer at a function boundary, sizeof no longer
 * works — the size must be passed explicitly as a parameter and threaded
 * through every nested call that touches the buffer. */
void build_path(char *out, size_t out_size, const char *dir, const char *file) {
    snprintf(out, out_size, "%s/%s", dir, file);
}

char path[256];
build_path(path, sizeof(path), dir, file);   /* sizeof still valid here, at the call site */
```

## See Also

- [ptr-array-decay-awareness](ptr-array-decay-awareness.md) - Why `sizeof` stops working once a pointer decays
- [str-avoid-sprintf-use-snprintf](str-avoid-sprintf-use-snprintf.md) - Using the tracked size correctly with `snprintf`
- [mem-avoid-buffer-overflow](mem-avoid-buffer-overflow.md) - The consequence of losing track of buffer sizes
