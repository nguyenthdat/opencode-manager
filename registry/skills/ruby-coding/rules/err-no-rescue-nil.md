# err-no-rescue-nil

> Don't silently rescue and return nil

## Why It Matters

Rescuing an exception and returning `nil` hides errors, making bugs impossible to find. Callers have no way to distinguish between a successful nil result and a failure. This pattern creates cascading `NoMethodError: undefined method ... for nil` far from the actual error site.

Let exceptions propagate unless you have a specific recovery path. If nil is a valid return, use a Result object or Option type.


## Bad

```ruby
def parse_json(input)
  JSON.parse(input)
rescue
  nil  # Silently swallows ALL errors
end

def find_user(id)
  User.find(id)
rescue ActiveRecord::RecordNotFound
  nil  # Better, but still makes callers check nil everywhere
end

# Usage -- error is hidden, nil propagates
user = find_user(params[:id])
user.email  # NoMethodError -- confusing stack trace
```


## Good

```ruby
def parse_json(input)
  JSON.parse(input)
rescue JSON::ParserError => e
  raise ParseError, "Invalid JSON: #{e.message}"
end

# Use find_by which returns nil naturally -- no rescue needed
def find_user(id)
  User.find_by(id: id) || raise(UserNotFoundError, "User #{id} not found")
end

# Caller handles the error at the right level
begin
  user = find_user(params[:id])
  render json: user
rescue UserNotFoundError
  render json: { error: "User not found" }, status: :not_found
end
```


## See Also

- [err-custom-exception](./err-custom-exception.md)
- [api-null-object](./api-null-object.md)
