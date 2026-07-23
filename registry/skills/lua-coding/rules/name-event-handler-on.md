# name-event-handler-on

> Use an `on_` prefix convention for event-handler callbacks

## Why It Matters

Codebases with many callback-shaped fields (UI event handlers, game entity lifecycle hooks, plugin autocmd callbacks) read far more clearly when every handler follows one predictable naming pattern (`on_click`, `on_collision`, `on_load`) — it instantly distinguishes "this field is a callback invoked by the framework" from an ordinary method you call directly.

## Bad

```lua
local Button = {}
Button.__index = Button

function Button.new(opts)
  return setmetatable({
    label = opts.label,
    clickHandler = opts.click,     -- inconsistent naming, unclear it's a callback
    hover = opts.hover_fn,          -- different suffix style again
  }, Button)
end

function Button:click()
  if self.clickHandler then self.clickHandler(self) end
end
```

## Good

```lua
local Button = {}
Button.__index = Button

function Button.new(opts)
  return setmetatable({
    label = opts.label,
    on_click = opts.on_click,
    on_hover = opts.on_hover,
  }, Button)
end

function Button:click()
  if self.on_click then self.on_click(self) end
end

function Button:hover()
  if self.on_hover then self.on_hover(self) end
end

local btn = Button.new({
  label = "Save",
  on_click = function(button) save_document() end,
  on_hover = function(button) show_tooltip("Save the document") end,
})
```

## Consistency With Game Engine / Plugin Conventions

LÖVE's own top-level callback contract follows this exact idea (`love.load`, `love.update`, `love.draw`, `love.keypressed`); Neovim autocmd callback options use `callback =`. Match whatever specific convention the embedding host already establishes, and use `on_` consistently for your own custom event hooks.

## See Also

- [embed-love2d-callbacks](embed-love2d-callbacks.md)
- [fn-callback-signature](fn-callback-signature.md)
- [name-is-has-boolean](name-is-has-boolean.md)
