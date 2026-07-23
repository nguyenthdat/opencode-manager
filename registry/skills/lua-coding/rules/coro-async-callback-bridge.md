# coro-async-callback-bridge

> Bridge callback-based async APIs to coroutines for sequential-looking code

## Why It Matters

Embeddings that expose async I/O via callbacks (Neovim's `vim.loop`/`vim.uv`, OpenResty's `ngx.*` non-blocking calls, custom game-engine asset loaders) force deeply nested callback code unless you bridge them through a coroutine: yield inside the coroutine, resume it from the callback when the result arrives. This turns "callback hell" back into linear, readable, top-to-bottom code.

## Bad

```lua
-- Deeply nested callbacks for three sequential async steps
read_file_async("a.txt", function(a)
  read_file_async("b.txt", function(b)
    read_file_async("c.txt", function(c)
      print(a, b, c)
    end)
  end)
end)
```

## Good

```lua
-- A generic "await" bridge: runs an async function, resumes the coroutine
-- with its result once the callback fires
local function await(async_fn, ...)
  local co = coroutine.running()
  assert(co, "await() must be called from inside a coroutine")
  async_fn(..., function(result)
    local ok, err = coroutine.resume(co, result)
    if not ok then error(err, 0) end
  end)
  return coroutine.yield()
end

local function main()
  local a = await(read_file_async, "a.txt")
  local b = await(read_file_async, "b.txt")
  local c = await(read_file_async, "c.txt")
  print(a, b, c)     -- reads sequentially, but each await() yields control
end

coroutine.wrap(main)()
```

## Real-World Analogue: Neovim's `vim.uv`

Neovim plugins commonly wrap `vim.uv` (libuv bindings) callbacks in exactly this pattern (or use a small library like `plenary.async`) so plugin authors can `await` file reads, timers, and process spawns without manual callback nesting.

## See Also

- [coro-cooperative-scheduling](coro-cooperative-scheduling.md)
- [embed-neovim-vim-api](embed-neovim-vim-api.md)
- [embed-openresty-non-blocking](embed-openresty-non-blocking.md)
