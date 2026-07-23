# doc-inline-why

> Comment WHY, not WHAT

## Why It Matters

Comments should explain intent, not restate the code. WHAT the code does should be evident from well-named methods and variables. WHY explains the business logic, edge case, or gotcha.

## Bad

```ruby
# Save the record
record.save!

# Set the name to "Alice"
name = "Alice"

# Increment by 1
count += 1
```


## Good

```ruby
# Must validate before save to prevent orphan records
record.save!

# Default name for guest users who haven't completed registration
name = "Alice"

# Compensate for off-by-one in the external API response
count += 1
```


## See Also

- [doc-yard-format](./doc-yard-format.md)
