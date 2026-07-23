# name-pointer-variable-suffix

> Adopt a lightweight, optional naming signal for pointer variables (e.g. a `p`/`ptr` prefix or suffix) only when it measurably improves clarity, and apply it consistently if you do

## Why It Matters

Unlike some naming conventions, marking pointer variables (`char *name_p`, `struct node *head_ptr`) is not universally practiced in C — many respected codebases (including the Linux kernel) explicitly avoid it, arguing the type declaration itself already says "pointer." Where a project does adopt it (common in some embedded/automotive coding standards, e.g. MISRA-adjacent style guides, to make pointer arithmetic and dereferencing more visually obvious), consistency matters more than the specific choice.

## Bad

```c
/* Inconsistent within the same file: some pointers marked, most not */
char *name_p;
struct node *head;             /* also a pointer, but unmarked */
int *countPtr;                    /* different casing style for the marker too */
```

## Good — If Adopting the Convention, Apply It Uniformly

```c
char        *name_p;
struct node *head_p;
int         *count_p;
```

## Good — Or, Equally Valid, Skip the Marker Entirely and Rely on the Type

```c
char        *name;
struct node *head;
int         *count;
/* This is the more common convention in modern C codebases (e.g. the Linux
 * kernel style guide explicitly discourages Hungarian-notation-style markers). */
```

## Rule of Thumb

Pick one of the two approaches for a given project and never mix them within the same codebase — the specific choice matters far less than consistency.

## See Also

- [name-snake-case-functions](name-snake-case-functions.md) - The base casing convention this builds on
- [ptr-const-correct-params](ptr-const-correct-params.md) - Pointer clarity achieved through `const`, independent of naming
- [name-avoid-abbreviation-ambiguity](name-avoid-abbreviation-ambiguity.md) - Related identifier-clarity guidance
