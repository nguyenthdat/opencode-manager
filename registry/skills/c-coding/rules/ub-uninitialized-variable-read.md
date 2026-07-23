# ub-uninitialized-variable-read

> Reading an automatic (stack) variable before it has been assigned a value is undefined behavior

## Why It Matters

An uninitialized local variable's bits are indeterminate — not "zero," not "the last thing on the stack," but a value the compiler is free to treat inconsistently across even a single expression. Reading it (as opposed to merely having it exist unread) is undefined behavior, and optimizers have been known to produce surprising results (e.g., a variable that appears to hold two different values in two reads in the same statement).

## Bad

```c
int classify(int score) {
    int grade;
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    /* no else: grade is read uninitialized for score < 80 */
    return grade;
}
```

## Good

```c
int classify(int score) {
    int grade = 'F';    /* explicit default covers every path */
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    return grade;
}
```

## Catching This Class of Bug

```sh
cc -Wall -Wextra -Wuninitialized -Wmaybe-uninitialized file.c   # static warnings
cc -fsanitize=memory file.c                                       # MemorySanitizer (Clang), most precise
valgrind --track-origins=yes ./a.out                                # no recompilation needed
```

## See Also

- [mem-init-before-use](mem-init-before-use.md) - The practical discipline that prevents this
- [type-struct-designated-init](type-struct-designated-init.md) - Zero/designated initialization for structs
- [ptr-no-uninitialized-pointer](ptr-no-uninitialized-pointer.md) - The pointer-specific version of this rule
