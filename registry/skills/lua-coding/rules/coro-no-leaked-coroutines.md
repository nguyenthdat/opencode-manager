# coro-no-leaked-coroutines

> Ensure coroutines either run to completion or are explicitly dropped

## Why It Matters

A suspended coroutine that nothing ever resumes again isn't automatically "cleaned up" in any special way — it just sits there as an ordinary garbage-collectable object, kept alive for as long as something references it (a scheduler's ready-list, a closure, a table). If a scheduler or event system keeps growing its list of tracked coroutines without ever removing dead or abandoned ones, that's a plain memory leak, just like an ever-growing table.

## Bad

```lua
local Scheduler = { tasks = {} }

function Scheduler:spawn(fn)
  local co = coroutine.create(fn)
  table.insert(self.tasks, co)
  return co
end

function Scheduler:tick()
  for _, co in ipairs(self.tasks) do
    if coroutine.status(co) ~= "dead" then
      coroutine.resume(co)
    end
    -- dead coroutines are never removed from self.tasks -- unbounded growth
  end
end
```

## Good

```lua
local Scheduler = { tasks = {} }

function Scheduler:spawn(fn)
  local co = coroutine.create(fn)
  table.insert(self.tasks, co)
  return co
end

function Scheduler:tick()
  for i = #self.tasks, 1, -1 do   -- iterate backwards so removal is safe
    local co = self.tasks[i]
    if coroutine.status(co) == "dead" then
      table.remove(self.tasks, i)   -- reclaim: allow GC to collect it
    else
      coroutine.resume(co)
    end
  end
end

-- If a task must be cancelled before it finishes, drop your only reference
-- to it so it becomes garbage-collectable (there is no coroutine.kill()):
function Scheduler:cancel(co)
  for i, t in ipairs(self.tasks) do
    if t == co then
      table.remove(self.tasks, i)
      break
    end
  end
  -- co is now unreferenced (assuming nothing else holds it) and will be GC'd;
  -- it will never resume again, and it never needed an explicit "kill" call
end
```

## See Also

- [coro-status-check](coro-status-check.md)
- [coro-cooperative-scheduling](coro-cooperative-scheduling.md)
- [meta-weak-tables](meta-weak-tables.md)
