# perf-include-vs-extend

> Prefer include over extend for module methods

## Why It Matters

include adds methods as instance methods; extend adds them as singleton methods. Instance method dispatch is faster because it doesn't go through the singleton class lookup chain.

## Bad

```ruby
module Helpers
  def format_price(amount)
    "$#{format('%.2f', amount)}"
  end
end

class Invoice
  extend Helpers
  Helpers.format_price(100)  # Singleton method -- slower dispatch
end
```


## Good

```ruby
module Helpers
  def format_price(amount)
    "$#{format('%.2f', amount)}"
  end
end

class Invoice
  include Helpers

  def display_total
    format_price(total)  # Instance method -- faster dispatch
  end
end
```


## See Also

- [obj-module-method](./obj-module-method.md)
- [obj-prefer-composition](./obj-prefer-composition.md)
