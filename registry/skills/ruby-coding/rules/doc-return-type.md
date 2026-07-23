# doc-return-type

> Document return types in YARD

## Why It Matters

@return tags in YARD document what a method returns, including the type and a brief description. This is the most important YARD tag -- it tells callers what to expect without reading source code.

## Bad

```ruby
# Finds a user
def find(id)
  users.find { |u| u.id == id }
end
```


## Good

```ruby
# Finds a user by ID.
#
# @param id [Integer] the user's database ID
# @return [User, nil] the found user, or nil if not found
def find(id)
  users.find { |u| u.id == id }
end
```


## See Also

- [doc-yard-format](./doc-yard-format.md)
