# meta-call-functor

> Use `__call` to make tables callable (functors)

## Why It Matters

`__call` lets an instance of a table-based "class" be invoked like a plain function: `obj(args)` desugars to `obj.__call(obj, args)`. This is useful for objects that have one dominant "do the thing" operation (a memoized function, a validator, a strategy object) while still carrying state and other methods.

## Bad

```lua
-- Forces callers to remember a specific method name just to "invoke" the object
local Validator = {}
Validator.__index = Validator

function Validator.new(pattern) return setmetatable({ pattern = pattern }, Validator) end
function Validator:check(s) return s:match(self.pattern) ~= nil end

local is_email = Validator.new("^[%w.]+@[%w.]+$")
if is_email:check(input) then ... end
```

## Good

```lua
local Validator = {}
Validator.__index = Validator

Validator.__call = function(self, s)
  return s:match(self.pattern) ~= nil
end

function Validator.new(pattern)
  return setmetatable({ pattern = pattern }, Validator)
end

local is_email = Validator.new("^[%w.]+@[%w.]+$")
if is_email(input) then           -- reads like a plain function call
  process(input)
end

-- Memoizing functor example: caches results while acting like a function
local Memoized = {}
Memoized.__index = Memoized
Memoized.__call = function(self, arg)
  if self.cache[arg] == nil then
    self.cache[arg] = self.fn(arg)
  end
  return self.cache[arg]
end

function Memoized.new(fn)
  return setmetatable({ fn = fn, cache = {} }, Memoized)
end

local slow_square = Memoized.new(function(n) return n * n end)
print(slow_square(5))  -- computes and caches
print(slow_square(5))  -- returns cached value
```

## See Also

- [meta-operator-overload](meta-operator-overload.md)
- [fn-first-class-functions](fn-first-class-functions.md)
- [perf-avoid-metatable-hot-path](perf-avoid-metatable-hot-path.md)
