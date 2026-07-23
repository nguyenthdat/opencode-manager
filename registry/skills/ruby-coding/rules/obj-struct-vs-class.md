# obj-struct-vs-class

> Use Struct or Data over bare Hash for typed data

## Why It Matters

Bare Hashes have no schema, no type checking, and no method access — they lead to stringly-typed data and typos. `Struct` provides a lightweight class with named accessors. `Data.define` (Ruby 3.2+) provides the same with immutability.

Use `Data.define` for immutable value objects, `Struct` for mutable data bags, and a full class only when you need custom behavior beyond accessors.


## Bad

```ruby
def create_order(params)
  order = {
    customer: params[:customer_name],
    items: params[:order_items],
    total: params[:order_total]
  }
  # What fields does this hash have? No IDE support, no errors on typos
  order[:total]  # must remember exact key name
end

user = { "name" => "Bob", "email" => "bob@example.com" }
puts user["Name"]  # nil -- silent failure from typo
```


## Good

```ruby
Order = Struct.new(:customer, :items, :total, keyword_init: true)

order = Order.new(
  customer: "Alice",
  items: ["book", "pen"],
  total: 29.95
)
order.customer  # method access -- auto-complete, typo-safe

# Immutable alternative (Ruby 3.2+)
Customer = Data.define(:name, :email)

bob = Customer.new(name: "Bob", email: "bob@example.com")
bob.name         # => "Bob"
# bob.name = "X" # NoMethodError -- immutable

case bob
in { name: "Bob" }
  puts "Found Bob!"
end
```


## See Also

- [obj-immutable-value](./obj-immutable-value.md)
- [obj-identity-equality](./obj-identity-equality.md)
