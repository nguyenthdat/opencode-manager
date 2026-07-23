# lint-no-unused-vars

> Error on unused variables

## Why It Matters

Unused variables clutter code, indicate incomplete refactoring, and waste cognitive load. RuboCop's Lint/UnusedVariable catches them. Use _ prefix for intentionally unused params.

## Bad

```ruby
def process(order, options)
  result = calculate(order)
  unused = options[:debug]  # Never used -- clutter
  result
end
```


## Good

```ruby
def process(order, _options)
  calculate(order)
end

# Explicit unused params with _ prefix:
items.each_with_index { |item, _i| process(item) }

# Or:
def callback(order, *)  # Accept but ignore extra args
end
```


## See Also

- [lint-rubocop-standard](./lint-rubocop-standard.md)
