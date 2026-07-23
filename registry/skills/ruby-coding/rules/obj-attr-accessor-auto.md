# obj-attr-accessor-auto

> Use attr_reader/attr_accessor over manual getter/setter methods

## Why It Matters

Ruby's `attr_reader`, `attr_writer`, and `attr_accessor` macros generate getter and setter methods at parse time with less boilerplate and fewer opportunities for error. Manual getters are verbose and add no safety benefit.

Use the most restrictive accessor that fits: `attr_reader` when no external writes are needed, `attr_accessor` only when mutation is intentional.


## Bad

```ruby
class Config
  def host
    @host
  end

  def host=(value)
    @host = value
  end

  def port
    @port
  end

  def port=(value)
    @port = Integer(value)
  end
end
```


## Good

```ruby
class Config
  attr_reader :host
  attr_writer :host

  attr_reader :port

  def port=(value)
    @port = Integer(value)
  end
end
```


## See Also

- [name-no-get-prefix](./name-no-get-prefix.md)
