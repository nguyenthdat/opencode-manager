# name-self-convention

> Use `self` as the implicit first parameter name in method-style functions

## Why It Matters

Colon syntax (`function Class:method(...)`) automatically names the implicit first parameter `self` — matching this exactly (rather than reinventing a different name like `this` or `obj` when writing the equivalent dot-syntax form) keeps method definitions consistent and immediately recognizable as "this is a method, not a plain function."

## Bad

```lua
-- Written with dot syntax and a non-standard name for the instance parameter
function Counter.increment(this, step)
  this.value = this.value + (step or 1)
end

Counter.increment(counter, 5)   -- works, but doesn't read as idiomatic Lua
```

## Good

```lua
-- Colon syntax: `self` is implicit and automatic
function Counter:increment(step)
  self.value = self.value + (step or 1)
end

counter:increment(5)    -- sugar for Counter.increment(counter, 5)

-- If you must write the dot-syntax equivalent explicitly (e.g. for a
-- function stored dynamically), still name the parameter `self` to match
-- convention:
Counter.increment = function(self, step)
  self.value = self.value + (step or 1)
end
```

## See Also

- [meta-class-pattern](meta-class-pattern.md)
- [api-consistent-arg-order](api-consistent-arg-order.md)
- [name-snake-case-funcs](name-snake-case-funcs.md)
