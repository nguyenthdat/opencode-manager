# anti-magic-data

> Don't hardcode magic numbers; use constants

## Why It Matters

Magic numbers (unexplained numeric literals) make code hard to understand and maintain. Replace with named constants that explain the value's meaning. Same applies to magic strings.

## Bad

```ruby
def validate_age(age)
  age.between?(18, 120)  # What do 18 and 120 represent?
end

def process_order(order)
  order.total * 0.08  # What is 0.08?
end
```


## Good

```ruby
MINIMUM_AGE = 18
MAXIMUM_AGE = 120
TAX_RATE = 0.08

def validate_age(age)
  age.between?(MINIMUM_AGE, MAXIMUM_AGE)
end

def calculate_tax(order)
  order.total * TAX_RATE
end
```


## See Also

- [name-constants-upper-snake](./name-constants-upper-snake.md)
- [obj-freeze-constants](./obj-freeze-constants.md)
