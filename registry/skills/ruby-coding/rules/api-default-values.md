# api-default-values

> Set meaningful defaults in method signatures

## Why It Matters

Defaults reduce boilerplate for the common case and make method behavior predictable. Use `fetch` for required keyword arguments, and provide sensible defaults for optional ones. Avoid defaulting to `nil` when a concrete default is more useful (e.g., `[]` for collections).

## Bad

```ruby
def fetch_data(url, timeout, retries, headers)
  timeout ||= 30; retries ||= 3; headers ||= {}
end  # Caller doesn't know defaults
def search(query = nil, page = nil, per_page = nil); end  # nil means "use default"
```

## Good

```ruby
def fetch_data(url, timeout: 30, retries: 3, headers: {}); end  # Defaults visible
def search(query:, page: 1, per_page: 25); end  # query required, rest defaulted
def create_session(user:, expires_at: 1.hour.from_now, remember: false)
  Session.create!(user: user, expires_at: expires_at, remember_me: remember)
end
```

## See Also

- [api-keyword-arguments](./api-keyword-arguments.md)
- [api-splat-args](./api-splat-args.md)
