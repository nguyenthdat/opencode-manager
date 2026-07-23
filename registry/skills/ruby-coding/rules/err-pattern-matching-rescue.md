# err-pattern-matching-rescue

> Use pattern matching rescue for structured error handling

## Why It Matters

Ruby 3.0+ pattern matching can destructure errors in rescue blocks, making it cleaner to handle complex error scenarios. Use `in` clauses within rescue to match error attributes and messages.

This is especially useful with custom exceptions that carry structured data, or when matching HTTP response patterns.


## Bad

```ruby
begin
  api_client.submit(order)
rescue ApiError => e
  if e.status == 422 && e.body["errors"].any? { |err| err["code"] == "DUPLICATE" }
    handle_duplicate(e.body["errors"])
  elsif e.status == 429
    handle_rate_limit(e.headers["Retry-After"])
  else
    raise
  end
end
```


## Good

```ruby
begin
  api_client.submit(order)
rescue ApiError => e
  case [e.status, e.body]
  in [422, { "errors" => [*, { "code" => "DUPLICATE" } => dup_err, *] }]
    handle_duplicate(dup_err)
  in [429, _]
    handle_rate_limit(e.headers["Retry-After"].to_i)
  in [500.., _]
    raise ServerError, "Downstream server error", cause: e
  else
    raise
  end
end
```


## See Also

- [err-custom-exception](./err-custom-exception.md)
- [err-rescue-specific](./err-rescue-specific.md)
