# anti-compact-model

> Don't use compact class/module definition

## Why It Matters

Compact definitions (class Foo::Bar) skip the outer namespace lookup and can create subtle module nesting bugs. Use nested definitions (module Foo; class Bar; end; end).

## Bad

```ruby
class Order::LineItem  # Compact -- skips Order constant lookup
  def total
    Order::TAX_RATE * price  # What if Order isn't loaded yet?
  end
end
```


## Good

```ruby
module Order
  class LineItem  # Nested -- correct constant resolution
    def total
      TAX_RATE * price  # Looks up Order::TAX_RATE correctly
    end
  end
end
```


## See Also

- [name-module-namespace](./name-module-namespace.md)
- [obj-prefer-composition](./obj-prefer-composition.md)
