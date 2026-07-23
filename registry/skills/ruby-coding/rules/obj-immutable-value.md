# obj-immutable-value

> Use Data.define (3.2+) for immutable value objects

## Why It Matters

Immutable value objects prevent bugs from accidental mutation, are inherently thread-safe, and convey intent that the object represents a value rather than a mutable entity. `Data.define` auto-generates `==`, `eql?`, `hash`, `deconstruct`, `deconstruct_keys`, `to_h`, and `with` — saving boilerplate and ensuring correctness.

Prefer `Data.define` over `Struct` when immutability is desired, and over bare `Hash` when you need nominal typing and method access.


## Bad

```ruby
class Person
  attr_accessor :name, :age

  def initialize(name:, age:)
    @name = name
    @age = age
  end

  def ==(other)
    other.is_a?(Person) && name == other.name && age == other.age
  end
  alias eql? ==

  def hash
    [name, age].hash
  end
end

# Mutable -- bugs sneak in
p = Person.new(name: "Alice", age: 30)
p.age = 31
```


## Good

```ruby
Person = Data.define(:name, :age)

alice = Person.new(name: "Alice", age: 30)
# alice.age = 31  # NoMethodError -- immutable!

# Auto-generated accessors, ==, eql?, hash, deconstruct, deconstruct_keys
b = Person.new(name: "Alice", age: 30)
alice == b              # => true
alice.with(age: 31)     # => #<data Person name="Alice", age=31>

case alice
in { name: "Alice", age: }
  puts "#{name} is #{age}"
end
```


## See Also

- [obj-struct-vs-class](./obj-struct-vs-class.md)
- [obj-freeze-constants](./obj-freeze-constants.md)
