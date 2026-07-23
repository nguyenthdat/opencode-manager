# fn-first-class-functions

> Use functions as first-class values for dispatch tables and strategies

## Why It Matters

Functions in Lua are ordinary values that can be stored in tables, passed as arguments, and returned from other functions. This makes a table-of-functions "dispatch table" a natural, fast replacement for long `if/elseif` chains or (worse) string-based dynamic dispatch via `load()`, and is the idiomatic way to implement strategy/visitor-style patterns.

## Bad

```lua
-- Long if/elseif chain that grows linearly and is easy to get wrong
local function handle_event(event)
  if event.type == "click" then
    handle_click(event)
  elseif event.type == "keypress" then
    handle_keypress(event)
  elseif event.type == "resize" then
    handle_resize(event)
  else
    error("unknown event type: " .. event.type)
  end
end
```

## Good

```lua
-- Dispatch table: O(1) lookup, easy to extend, no long chain to maintain
local handlers = {
  click = handle_click,
  keypress = handle_keypress,
  resize = handle_resize,
}

local function handle_event(event)
  local handler = handlers[event.type]
  if not handler then
    error("unknown event type: " .. event.type)
  end
  handler(event)
end

-- Strategy pattern: swap behavior by swapping which function is stored
local compression_strategies = {
  gzip = function(data) return gzip_compress(data) end,
  zstd = function(data) return zstd_compress(data) end,
  none = function(data) return data end,
}

local function compress(data, algorithm)
  return (compression_strategies[algorithm] or compression_strategies.none)(data)
end
```

## See Also

- [meta-call-functor](meta-call-functor.md)
- [anti-string-dispatch](anti-string-dispatch.md)
- [perf-avoid-select-hash](perf-avoid-select-hash.md)
