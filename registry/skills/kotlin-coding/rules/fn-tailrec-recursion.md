# fn-tailrec-recursion

> Mark provably tail-recursive functions `tailrec`

## Why It Matters

A recursive function without `tailrec` grows the JVM call stack one frame per call, so deep recursion (large inputs, long lists) throws `StackOverflowError`. When a function's recursive call is truly the last operation performed (a tail call), the `tailrec` modifier tells the compiler to rewrite it into an equivalent loop at compile time, giving you recursive-style code with iterative performance and no stack growth.

## Bad

```kotlin
fun factorial(n: Long): Long =
    if (n <= 1) 1 else n * factorial(n - 1)
// Not a tail call: the multiplication happens AFTER the recursive call returns,
// so each call must stay on the stack waiting for its result. Overflows around n ~ 10,000+
// depending on stack size, and `tailrec` here would be a no-op (compiler warns it can't optimize it).

fun sum(numbers: List<Int>): Int =
    if (numbers.isEmpty()) 0 else numbers.first() + sum(numbers.drop(1))
```

## Good

```kotlin
tailrec fun factorial(n: Long, acc: Long = 1): Long =
    if (n <= 1) acc else factorial(n - 1, acc * n)
// The recursive call IS the entire expression - nothing happens after it returns -
// so the compiler rewrites this into a plain loop. No stack growth, no overflow risk.

tailrec fun sum(numbers: List<Int>, acc: Int = 0): Int =
    if (numbers.isEmpty()) acc else sum(numbers.drop(1), acc + numbers.first())
```

## Verifying `tailrec` Actually Applies

```kotlin
// The compiler warns if a function marked `tailrec` isn't actually tail-recursive:
// "A function is marked as tail-recursive but no tail calls are found"
// Common reasons a call isn't a tail call:
// - it's inside a try/catch block
// - its result is used in a further expression (e.g., n * factorial(n - 1))
// - it's not a direct self-call (mutual recursion isn't optimized by tailrec)

tailrec fun gcd(a: Int, b: Int): Int = if (b == 0) a else gcd(b, a % b)  // valid tail call
```

## See Also

- [`fn-sequence-for-laziness`](fn-sequence-for-laziness.md) - another way to process large collections without stack/memory blowup
- [`perf-profile-before-optimize`](perf-profile-before-optimize.md) - measure before assuming recursion depth is a real bottleneck
- [`fn-function-composition`](fn-function-composition.md) - iterative composition as an alternative to deep recursion
