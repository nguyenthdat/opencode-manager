# err-assert-precondition

> Use `assert()` for precondition and invariant checks

## Why It Matters

`assert(v, message)` returns `v` unchanged if it's truthy, or raises `message` as an error otherwise — a compact way to state "this must hold, or we stop here" for invariants that indicate a programming bug rather than an expected runtime failure. It also composes neatly with functions that return `nil, err` on failure.

## Bad

```lua
local function connect(host, port)
  local socket = net.open(host, port)
  -- no check: a nil socket propagates silently until something much
  -- later crashes with a confusing "attempt to index a nil value"
  socket:send("HELLO")
  return socket
end
```

## Good

```lua
local function connect(host, port)
  local socket, err = net.open(host, port)
  assert(socket, "failed to connect to " .. host .. ":" .. port .. ": " .. tostring(err))
  socket:send("HELLO")
  return socket
end

-- assert() is especially idiomatic wrapping (value, err) returning calls
local file = assert(io.open("config.lua", "r"))

-- Precondition checks at the top of a function document the contract
local function set_volume(level)
  assert(type(level) == "number", "level must be a number")
  assert(level >= 0 and level <= 1, "level must be between 0 and 1")
  audio.volume = level
end
```

## assert() vs error(): When to Use Which

Use `assert` for conditions that should always hold given a correctly-written caller (programming errors); use `error()` with a structured table for conditions that are expected, recoverable, runtime failures the caller should branch on. Don't use `assert` for user-facing validation where you want a structured, catchable error object.

## See Also

- [err-error-table](err-error-table.md)
- [err-validate-args](err-validate-args.md)
- [err-nil-err-pattern](err-nil-err-pattern.md)
