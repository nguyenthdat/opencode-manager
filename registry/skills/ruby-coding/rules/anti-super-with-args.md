# anti-super-with-args

> Always pass args to super explicitly unless forwarding

## Why It Matters

In Ruby 3.0+, super without parentheses forwards ALL arguments (including a block). super() passes nothing. Be explicit about what you intend to pass.

## Bad

```ruby
class Child < Parent
  def initialize(name:, email:)
    super  # Forwards name: and email: -- may be correct or may not
    @email = email
  end
end
```


## Good

```ruby
class Child < Parent
  def initialize(name:, email:)
    super(name: name)  # Explicit -- clear intent
    @email = email
  end
end

# Only use bare super when truly forwarding all args:
def process(*args, **kwargs, &block)
  # ... pre-processing ...
  super  # Explicitly forward everything
end
```


## See Also

- [obj-initialize-super](./obj-initialize-super.md)
- [api-keyword-arguments](./api-keyword-arguments.md)
