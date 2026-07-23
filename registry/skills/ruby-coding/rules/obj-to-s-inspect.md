# obj-to-s-inspect

> Override to_s and inspect for debugging output

## Why It Matters

`to_s` provides a human-readable string representation (used by `puts`, string interpolation), while `inspect` provides a detailed debugging representation (used by `p`, IRB). Well-crafted output saves hours of debugging.

Override both in all model/value classes with key identifying information.


## Bad

```ruby
class Order
  attr_accessor :id, :customer_name, :total

  def initialize(id:, customer_name:, total:)
    @id = id
    @customer_name = customer_name
    @total = total
  end
end

order = Order.new(id: 42, customer_name: "Alice", total: 99.95)
puts order     # #<Order:0x00007f9b8c0a3b20>
p order        # #<Order:0x00007f9b8c0a3b20 @id=42, @customer_name="Alice", @total=99.95>
```


## Good

```ruby
class Order
  attr_accessor :id, :customer_name, :total

  def initialize(id:, customer_name:, total:)
    @id = id
    @customer_name = customer_name
    @total = total
  end

  def to_s
    "Order ##{id} for #{customer_name} -- $#{format('%.2f', total)}"
  end

  def inspect
    "#<#{self.class.name} id=#{id} customer=#{customer_name.inspect} total=#{total}>"
  end
end

order = Order.new(id: 42, customer_name: "Alice", total: 99.95)
puts order     # Order #42 for Alice -- $99.95
p order        # #<Order id=42 customer="Alice" total=99.95>
```


## See Also

- [obj-identity-equality](./obj-identity-equality.md)
