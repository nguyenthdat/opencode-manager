# doc-yard-inheritable

> Use @see for cross-references

## Why It Matters

The @see YARD tag creates links to related methods, classes, or external documentation. Use it to connect related APIs and help users discover relevant code.

## Bad

```ruby
# Processes a payment
def charge(amount)
end

# Refunds are also possible -- see the charge method above
def refund(amount)
end
```


## Good

```ruby
# Charges a payment.
#
# @param amount [Integer] amount in cents
# @return [Charge]
# @see #refund
def charge(amount); end

# Refunds a previous charge.
#
# @param amount [Integer] amount in cents
# @return [Refund]
# @see #charge
def refund(amount); end
```


## See Also

- [doc-yard-format](./doc-yard-format.md)
