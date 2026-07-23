# coro-generator-pattern

> Use coroutines as generators/iterators for lazy sequence production

## Why It Matters

Coroutines let you write a producer as straight-line imperative code (loop, `yield` each value) instead of manually implementing a stateful iterator object with saved position/state fields. This is idiomatic Lua and mirrors generator functions in other languages, while staying within plain Lua semantics — no special syntax required.

## Bad

```lua
-- Manually tracking iteration state to walk a tree in-order
local function make_inorder_iterator(tree)
  local stack = {}
  local function push_left(node)
    while node do table.insert(stack, node); node = node.left end
  end
  push_left(tree)
  return function()
    if #stack == 0 then return nil end
    local node = table.remove(stack)
    push_left(node.right)
    return node.value
  end
end
```

## Good

```lua
-- Coroutine-based generator: express the walk as natural recursive code
local function inorder(tree)
  return coroutine.wrap(function()
    local function visit(node)
      if not node then return end
      visit(node.left)
      coroutine.yield(node.value)
      visit(node.right)
    end
    visit(tree)
  end)
end

for value in inorder(tree) do
  print(value)
end

-- A simple range generator
local function range(from, to, step)
  step = step or 1
  return coroutine.wrap(function()
    for i = from, to, step do
      coroutine.yield(i)
    end
  end)
end

for i in range(1, 10, 2) do
  print(i)  -- 1, 3, 5, 7, 9
end
```

## See Also

- [coro-wrap-vs-create](coro-wrap-vs-create.md)
- [coro-status-check](coro-status-check.md)
- [fn-first-class-functions](fn-first-class-functions.md)
