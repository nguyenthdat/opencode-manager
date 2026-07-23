# doc-yard-format

> Use YARD comments (@param, @return, @example)

## Why It Matters

YARD is the standard Ruby documentation format, generating browsable HTML from structured comments. @param, @return, @raise, and @example tags create consistent, searchable documentation.

## Bad

```ruby
# Process an order and return the result
def process(order, options = {})
  # ...
end
```


## Good

```ruby
# Processes an order, applying discounts and calculating tax.
#
# @param order [Order] the order to process
# @param options [Hash] processing options
# @option options [Boolean] :validate whether to validate before processing
# @return [ProcessedOrder] the processed order with calculated totals
# @raise [InvalidOrderError] if the order fails validation
# @example Basic usage
#   process(Order.last, validate: true)
def process(order, options = {})
  # ...
end
```


## See Also

- [doc-return-type](./doc-return-type.md)
- [doc-yard-inheritable](./doc-yard-inheritable.md)
