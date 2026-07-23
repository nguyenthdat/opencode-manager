# test-pending-skip

> Mark unfinished tests as pending, not silently skipped or commented out

## Why It Matters

A commented-out test or a test quietly disabled with an early `return` disappears from anyone's radar — nobody sees it in the test report and it's easily forgotten forever. Explicitly marking a test `pending` keeps it visible in the test output (usually with a distinct color/count) as a reminder that work remains, while not failing the build.

## Bad

```lua
-- Commented out: invisible in test output, easy to forget entirely
-- it("handles concurrent writes safely", function()
--   ...
-- end)

it("handles concurrent writes safely", function()
  return  -- silently does nothing -- looks like a passing test in reports!
end)
```

## Good

```lua
-- busted: pending() shows up distinctly in the test summary
it("handles concurrent writes safely", function()
  pending("needs a mock for the lock manager; tracked in TICKET-123")
end)

-- Alternatively, busted supports marking the whole `it` as pending via a
-- third argument in some versions, or via `describe`-level `#pending` tags
-- depending on configuration -- check your test runner's exact API, but the
-- principle holds: unfinished tests stay visible, not silent.
```

## See Also

- [test-busted-describe-it](test-busted-describe-it.md)
- [doc-changelog](doc-changelog.md)
- [test-descriptive-names](test-descriptive-names.md)
