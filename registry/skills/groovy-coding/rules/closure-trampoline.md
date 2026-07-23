# closure-trampoline

> Use `.trampoline()` for tail-recursive closures

## Why It Matters

Deep recursion in Groovy causes `StackOverflowError` on the JVM because each call consumes stack space. The `.trampoline()` method converts tail-recursive closures into iterative loops, eliminating stack consumption while preserving the recursive code structure.

## Bad

```groovy
def factorial = { n ->
    n <= 1 ? 1G : n * call(n - 1)
}

println factorial(1000)  // StackOverflowError!

def sumTree = { node ->
    if (node.children.isEmpty()) return node.value
    node.value + node.children.sum { sumTree(it) }  // Deep trees overflow
}
```

## Good

```groovy
def factorial = { n, acc = 1G ->
    n <= 1 ? acc : trampoline(n - 1, acc * n)
}.trampoline()

println factorial(1000)  // Works! No stack overflow

def sumTree
sumTree = { node, acc = 0 ->
    if (node.children.isEmpty()) return node.value + acc
    trampoline(node.children[0], acc + node.value)
}.trampoline()

// For arbitrary tail recursion, wrap in TrampolineClosure
Closure fib = { Long n, Long a = 1, Long b = 1 ->
    n < 2 ? b : fib.trampoline(n - 1, b, a + b)
}.trampoline()
```

## When Not to Use

```groovy
// Non-tail-recursive — trampoline won't help
def treeSize = { node ->
    1 + node.children.sum { treeSize(it) }  // sum breaks tail position
}

// Use iterative approach instead
def treeSizeIterative(Node root) {
    def count = 0
    def stack = [root]
    while (stack) {
        def node = stack.pop()
        count++
        stack.addAll(node.children)
    }
    count
}
```

## See Also

- [closure-memoize](closure-memoize.md) - Use memoize for overlapping subproblems
- [closure-curry-composition](closure-curry-composition.md) - Use curry for partial application
- [closure-compose-pipe](closure-compose-pipe.md) - Use << and >> for composition
