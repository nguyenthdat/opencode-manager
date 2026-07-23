# lint-parameter-count

> Limit parameters to 3-4

## Why It Matters

Methods with many parameters are error-prone and hard to call. A limit of 3-4 parameters encourages grouping into keyword arguments or parameter objects.

## Bad

```ruby
# 5 positional params -- easy to get wrong:
def create_user(name, email, role, active, department)
end
```


## Good

```ruby
# Keyword args -- self-documenting, counts as 1 param:
def create_user(name:, email:, role: :member, active: true, department: nil)
end
```


## See Also

- [api-keyword-arguments](./api-keyword-arguments.md)
- [lint-complexity](./lint-complexity.md)
