# name-setter-equals

> Use = suffix for setter methods

## Why It Matters

Setter methods should end with = so they can be called with assignment syntax. This is idiomatic Ruby that allows natural object.field = value syntax.

## Bad

```ruby
def name(val); @name = val; end
user.name("Alice")  # Awkward
```


## Good

```ruby
def name=(value); @name = value; end
user.name = "Alice"  # Natural assignment syntax
```


## See Also

- [name-methods-snake-case](./name-methods-snake-case.md)
- [obj-attr-accessor-auto](./obj-attr-accessor-auto.md)
