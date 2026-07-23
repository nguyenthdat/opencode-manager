# err-no-silent-failure

> Never ignore return values that signal failure

## Why It Matters

Many standard library functions (`io.open`, `os.rename`, `os.remove`, `string.find` with plain patterns, `pcall`) return `nil`/`false` plus an error message on failure instead of throwing. If the caller doesn't check the first return value, the failure disappears silently and the program continues operating on garbage — a `nil` file handle, an unmoved file, a missed match — until it crashes somewhere unrelated and confusing.

## Bad

```lua
local file = io.open("data.txt", "r")
local contents = file:read("*a")  -- crashes here if the open failed, with a
                                   -- confusing "attempt to index a nil value"
                                   -- far from the real cause

os.rename("old.txt", "new.txt")  -- return value ignored; did it actually work?
```

## Good

```lua
local file, err = io.open("data.txt", "r")
if not file then
  error("could not open data.txt: " .. err)
end
local contents = file:read("*a")
file:close()

local ok, err = os.rename("old.txt", "new.txt")
if not ok then
  error("could not rename file: " .. tostring(err))
end

-- Or, for the very common "open or die" pattern, assert() is the idiom:
local file2 = assert(io.open("data.txt", "r"))
```

## Catching It With Tooling

`luacheck` flags unused return values only weakly; the more reliable defense is code review discipline plus wrapping risky calls in `assert()` so a forgotten check becomes an immediate, loud crash instead of a silent, delayed one.

## See Also

- [err-assert-precondition](err-assert-precondition.md)
- [err-nil-err-pattern](err-nil-err-pattern.md)
- [anti-ignore-pcall-result](anti-ignore-pcall-result.md)
