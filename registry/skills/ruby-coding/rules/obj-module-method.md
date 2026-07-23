# obj-module-method

> Use module_function or extend self for module-level methods

## Why It Matters

When a module provides utility functions (no instance state), use `module_function` to make selected methods available as both module methods and private instance methods. Alternatively, use `extend self` to make all instance methods available at the module level.

`module_function` is the idiomatic Ruby choice — it explicitly marks which methods are part of the module's public API.


## Bad

```ruby
module MathUtils
  def self.square(x)
    x * x
  end

  def self.cube(x)
    x * x * x
  end

  # Can't include MathUtils to get these as instance methods
end

module TextHelpers
  def strip(text)
    text.strip
  end
end

# Must use extend to call on the module itself
TextHelpers.extend(TextHelpers)
TextHelpers.strip("  hello  ")
```


## Good

```ruby
module MathUtils
  module_function

  def square(x)
    x * x
  end

  def cube(x)
    x * x * x
  end
end

MathUtils.square(4)   # => 16  (module method)

class Calculator
  include MathUtils

  def area_of_square(side)
    square(side)       # => instance method
  end
end

# Alternative: extend self
module TextHelpers
  extend self

  def strip(text)
    text.strip
  end

  def titleize(text)
    text.split.map(&:capitalize).join(" ")
  end
end
```


## See Also

- [obj-prefer-composition](./obj-prefer-composition.md)
- [meta-macro-module](./meta-macro-module.md)
