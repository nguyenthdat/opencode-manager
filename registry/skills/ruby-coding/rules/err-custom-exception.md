# err-custom-exception

> Create custom exception classes for domain errors

## Why It Matters

Custom exception classes allow callers to rescue by domain concept rather than by generic type. They also carry domain-specific context (e.g., validation errors with field names) and enable targeted error handling in middleware or rescue_from blocks.

Inherit from `StandardError` (or a project-specific base error class) and name them with the `Error` suffix.


## Bad

```ruby
def transfer(from:, to:, amount:)
  raise "Insufficient funds" if from.balance < amount
  raise "Account locked" if to.locked?
  # Caller must parse the message string to handle specific errors
end

begin
  transfer(from: a, to: b, amount: 100)
rescue RuntimeError => e
  if e.message == "Insufficient funds"  # fragile string matching
    # ...
  end
end
```


## Good

```ruby
class TransferError < StandardError; end

class InsufficientFundsError < TransferError
  attr_reader :account, :requested

  def initialize(account:, requested:)
    @account = account
    @requested = requested
    super("Account ##{account.id} has #{account.balance}, requested #{requested}")
  end
end

class AccountLockedError < TransferError
  attr_reader :account

  def initialize(account:)
    @account = account
    super("Account ##{account.id} is locked")
  end
end

def transfer(from:, to:, amount:)
  raise InsufficientFundsError.new(account: from, requested: amount) if from.balance < amount
  raise AccountLockedError.new(account: to) if to.locked?
  # ...
end

begin
  transfer(from: a, to: b, amount: 100)
rescue InsufficientFundsError => e
  notify_user(e.account, "You need #{e.requested - e.account.balance} more")
rescue AccountLockedError => e
  notify_admin("Transfer to locked account #{e.account.id}")
end
```


## See Also

- [err-exception-message](./err-exception-message.md)
- [err-cause-chaining](./err-cause-chaining.md)
