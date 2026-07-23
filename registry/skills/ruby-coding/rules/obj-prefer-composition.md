# obj-prefer-composition

> Prefer composition and modules over deep inheritance

## Why It Matters

Deep inheritance hierarchies create rigid, tightly-coupled code that is hard to change. Modules and composition allow mixing in behaviors from multiple sources, keeping classes small and focused on a single responsibility.

Use `include` for instance methods, `extend` for class methods, and `prepend` to override existing methods while calling `super` to the original.


## Bad

```ruby
class Animal
  def speak; end
end

class Mammal < Animal
  def give_birth; end
end

class Dog < Mammal
  def speak; "Woof"; end
  def fetch; end
end

class Fish < Animal
  def swim; end
end

# Fish inherits give_birth -- wrong abstraction
# Adding flying? Need Bird class. Adding swimming mammal? Problem.
```


## Good

```ruby
module Speakable
  def speak
    raise NotImplementedError
  end
end

module Swimmable
  def swim
    "splashing"
  end
end

module Fetchable
  def fetch(item)
    "bringing back #{item}"
  end
end

class Dog
  include Speakable
  include Swimmable
  include Fetchable

  def speak
    "Woof"
  end
end

class Fish
  include Speakable
  include Swimmable

  def speak
    "..."
  end
end
```


## See Also

- [obj-single-responsibility](./obj-single-responsibility.md)
- [obj-module-method](./obj-module-method.md)
