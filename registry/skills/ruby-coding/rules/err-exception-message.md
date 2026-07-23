# err-exception-message

> Include context in exception messages

## Why It Matters

A good exception message includes relevant identifiers, values, and the operation that failed — enough for a developer to understand and reproduce the error without reading code. Vague messages like 'Invalid data' or 'Operation failed' waste debugging time.

Use interpolation to include the specific values that caused the failure.


## Bad

```ruby
def charge(amount, card_token)
  raise "Charge failed" if card_token.nil?
  raise "Invalid amount" if amount <= 0

  stripe_response = Stripe::Charge.create(amount: amount, source: card_token)
  raise "Stripe error" if stripe_response.error?
end
```


## Good

```ruby
def charge(amount, card_token)
  raise ArgumentError, "card_token is required" if card_token.nil?
  raise ArgumentError, "amount must be positive, got: #{amount}" if amount <= 0

  stripe_response = Stripe::Charge.create(amount: amount, source: card_token)
  if stripe_response.error?
    raise PaymentError,
      "Stripe charge failed: #{stripe_response.error.message} " \
      "(code: #{stripe_response.error.code})"
  end
end
```


## See Also

- [err-custom-exception](./err-custom-exception.md)
- [err-cause-chaining](./err-cause-chaining.md)
