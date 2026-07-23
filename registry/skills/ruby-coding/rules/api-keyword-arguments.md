# api-keyword-arguments

> Use keyword arguments for methods with 3+ params

## Why It Matters

Keyword arguments make method calls self-documenting, eliminate argument-order errors, and allow graceful defaults. They're especially important when parameters share the same type (e.g., multiple strings or integers) where positional arguments are easy to swap by mistake.

## Bad

```ruby
def create_user(name, email, role, active, send_email, department)
  # What order? Which is which?
end
create_user("Alice", "alice@example.com", "admin", true, false, "Engineering")
# Easy to swap true/false or get order wrong
```

## Good

```ruby
def create_user(name:, email:, role: :member, active: true, send_welcome: true, department: nil)
  # Self-documenting, order-independent, defaults clear
end
create_user(
  name: "Alice",
  email: "alice@example.com",
  role: :admin,
  department: "Engineering",
  send_welcome: false
)
```

## See Also

- [api-default-values](./api-default-values.md)
- [api-splat-args](./api-splat-args.md)
- [name-methods-snake-case](./name-methods-snake-case.md)
