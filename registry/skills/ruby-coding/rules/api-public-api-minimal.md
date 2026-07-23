# api-public-api-minimal

> Keep public API surface minimal

## Why It Matters

Every public method is a commitment — it must be maintained, documented, and remains compatible. A large public API surface increases the cost of refactoring and the risk of breaking changes. Keep the public API small: expose only what callers need.

## Bad

```ruby
class PaymentGateway
  def charge; end; def refund; end; def validate_card; end; def encrypt_card; end
  def format_request; end; def parse_response; end; def log_transaction; end
  # 20 more public methods... Which should callers use?
end
```

## Good

```ruby
class PaymentGateway
  def charge(amount:, card_token:)  # Public API -- minimal, intentional
    validate!(amount: amount, card_token: card_token)
    response = process_charge(amount, card_token)
    log_transaction(response)
    response
  end
  def refund(transaction_id:); end
  private
  def validate!(amount:, card_token:); end
  def process_charge(amount, card_token); end
  def log_transaction(response); end
end
```

## See Also

- [obj-public-private](./obj-public-private.md)
- [api-single-responsibility](./api-single-responsibility.md)
- [api-duck-type-over-class](./api-duck-type-over-class.md)
