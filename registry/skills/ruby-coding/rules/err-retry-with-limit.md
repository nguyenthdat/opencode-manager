# err-retry-with-limit

> Use retry only with a counter limit

## Why It Matters

`retry` restarts the `begin` block from the top. Without a limit, it can loop infinitely if the error condition persists. Always pair `retry` with a counter that limits the number of attempts.

For production retry logic, prefer a library like `retriable` or `faraday-retry` that provides exponential backoff.


## Bad

```ruby
begin
  response = Net::HTTP.get(URI("https://api.example.com/data"))
rescue Net::OpenTimeout
  retry  # Infinite retry -- stuck forever if the server is down
end
```


## Good

```ruby
MAX_RETRIES = 3

def fetch_with_retry(url, retries: MAX_RETRIES)
  attempts = 0
  begin
    attempts += 1
    Net::HTTP.get(URI(url))
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    if attempts < retries
      sleep(2**attempts)  # Exponential backoff
      retry
    else
      raise FetchError, "Failed after #{attempts} attempts: #{e.message}"
    end
  end
end
```


## See Also

- [err-ensure-cleanup](./err-ensure-cleanup.md)
- [err-custom-exception](./err-custom-exception.md)
