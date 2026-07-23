# obj-identity-equality

> Implement == and eql? correctly for value objects

## Why It Matters

Ruby's default `==` uses object identity (`equal?`), not value equality. For value objects (money, coordinates, dates), you need to compare by attributes. `eql?` should be consistent with `==` but stricter about type — it's used by `Hash` for key comparison.

Always define `hash` when you define `eql?`, or `Hash` lookups will break. Use `Data.define` or `Struct` for auto-generated equality.


## Bad

```ruby
class Money
  attr_reader :amount, :currency

  def initialize(amount, currency)
    @amount = amount
    @currency = currency
  end

  # Missing ==, eql?, hash
end

Money.new(10, "USD") == Money.new(10, "USD")  # false -- identity comparison!
hash = { Money.new(10, "USD") => "ten dollars" }
hash[Money.new(10, "USD")]  # nil -- different hash values!
```


## Good

```ruby
# Prefer Data.define for auto-generated equality:
Money = Data.define(:amount, :currency)

Money.new(10, "USD") == Money.new(10, "USD")  # => true

# Or manually:
class MoneyManual
  attr_reader :amount, :currency

  def initialize(amount, currency)
    @amount = amount
    @currency = currency
  end

  def ==(other)
    other.is_a?(MoneyManual) && amount == other.amount && currency == other.currency
  end
  alias eql? ==

  def hash
    [self.class, amount, currency].hash
  end
end
```


## See Also

- [obj-immutable-value](./obj-immutable-value.md)
- [obj-struct-vs-class](./obj-struct-vs-class.md)
- [obj-to-s-inspect](./obj-to-s-inspect.md)
