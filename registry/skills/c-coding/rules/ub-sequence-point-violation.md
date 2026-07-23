# ub-sequence-point-violation

> Never modify a variable more than once, or read and modify it in an unsequenced way, between sequence points

## Why It Matters

Prior to C11's clarified sequencing rules (and still relevant conceptually), expressions like `i = i++ + 1` or `a[i] = i++` have unspecified or undefined behavior because the order of the side effects (writing to `i`) relative to other reads/writes of `i` in the same full expression isn't fixed. The compiler is free to evaluate sub-expressions in any order, so such code can produce different results across compilers or even optimization levels.

## Bad

```c
int i = 0;
a[i] = i++;          /* is `i` on the left evaluated before or after the increment? unspecified/UB */

int x = 1;
x = x++ + 1;          /* multiple unsequenced modifications of x: UB */

printf("%d %d\n", i++, i++);  /* order of argument evaluation is unspecified, and this modifies i twice unsequenced */
```

## Good

```c
int i = 0;
a[i] = i;
i++;                     /* split into separate, clearly sequenced statements */

int x = 1;
x = x + 1;                /* no ambiguity about ordering */
x++;

int a1 = i++;
int a2 = i++;
printf("%d %d\n", a1, a2);   /* explicit ordering via separate statements */
```

## Function Calls Are Sequence Points for Their Own Arguments (C11+)

```c
/* Since C11, each function-call argument is fully evaluated (sequenced)
 * relative to the others' side effects, but the *order between arguments*
 * is still unspecified — write code that doesn't depend on that order. */
```

## See Also

- [ub-signed-integer-overflow](ub-signed-integer-overflow.md) - Another expression-level UB category
- [lint-undefined-behavior-sanitizer](lint-undefined-behavior-sanitizer.md) - Detects some sequencing violations at runtime
- [anti-deeply-nested-code](anti-deeply-nested-code.md) - Simpler expressions avoid this class of bug entirely
