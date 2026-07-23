# sec-regex-dos

> Guard against ReDoS with linear-time regex

## Why It Matters

Regular Expression Denial of Service (ReDoS) occurs when a regex with exponential backtracking matches malicious input, consuming CPU. Ruby's regex engine backtracks, making certain patterns dangerous. Avoid nested quantifiers. Use Regexp.linear_time? (Ruby 3.2+) to check safety.

## Bad

```ruby
# Vulnerable to ReDoS -- nested quantifiers:
pattern = /^(a+)+$/
# Input: "aaaaaaaaaaaaaaaaaaaa!" -- exponential backtracking

def valid_email?(email)
  email.match?(/^([a-z]+\.)*[a-z]+@([a-z]+\.)+[a-z]+$/)
end
```


## Good

```ruby
# Use simple patterns without nested quantifiers:
pattern = /\Aa+\z/  # Linear

# Ruby 3.2+ -- check if regex is safe:
Regexp.linear_time?(/\Aa+\z/)  # => true

# Set a timeout for complex regex (Ruby 3.2+):
Regexp.timeout = 1.0  # seconds
begin
  input.match?(pattern)
rescue Regexp::TimeoutError
  Rails.logger.warn("Regex timeout on input")
  false
end
```


## See Also

- [sec-no-eval](./sec-no-eval.md)
- [sec-safe-deserialize](./sec-safe-deserialize.md)
