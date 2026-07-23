# anti-class-var

> Don't use @@class_variables; use class instance variables

## Why It Matters

@@class_variables are shared across the ENTIRE inheritance hierarchy -- a subclass can overwrite the parent's value. Use @class_instance_variables instead, defined in class << self.

## Bad

```ruby
class Parent
  @@count = 0
  def self.count; @@count; end
end

class Child < Parent
  @@count = 10  # Overwrites Parent's @@count!
end

Parent.count  # => 10 -- WTF?
```


## Good

```ruby
class Parent
  class << self
    attr_accessor :count
  end
  @count = 0
end

class Child < Parent
  @count = 10  # Sets Child's own @count
end

Parent.count  # => 0  -- expected
Child.count   # => 10 -- expected
```


## See Also

- [obj-module-method](./obj-module-method.md)
- [meta-singleton-class](./meta-singleton-class.md)
