# obj-initialize-super

> Call super in initialize when subclassing

## Why It Matters

When a subclass has its own `initialize`, it must call `super` to ensure the parent class initializes correctly. Forgetting `super` is a common bug that leaves the parent's instance variables unset, causing `nil` errors downstream.

Use `super` without arguments to forward all arguments, or `super()` to call parent with no arguments. Use `super(...)` for explicit forwarding in Ruby 3.0+.


## Bad

```ruby
class Animal
  attr_reader :name

  def initialize(name:)
    @name = name
  end
end

class Dog < Animal
  attr_reader :breed

  def initialize(name:, breed:)
    @breed = breed
    # Forgot super -- @name is never set!
  end
end

dog = Dog.new(name: "Rex", breed: "Labrador")
dog.name  # nil -- bug!
```


## Good

```ruby
class Animal
  attr_reader :name

  def initialize(name:)
    @name = name
  end
end

class Dog < Animal
  attr_reader :breed

  def initialize(name:, breed:)
    super(name: name)
    @breed = breed
  end
end

dog = Dog.new(name: "Rex", breed: "Labrador")
dog.name   # => "Rex"
dog.breed  # => "Labrador"
```


## See Also

- [anti-super-with-args](./anti-super-with-args.md)
- [obj-prefer-composition](./obj-prefer-composition.md)
