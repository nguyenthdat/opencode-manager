# obj-public-private

> Use public/protected/private intentionally

## Why It Matters

Ruby's visibility keywords communicate intent: `public` methods define the class API, `protected` methods are for subclass/internal use with a receiver, and `private` methods are implementation details never called with an explicit receiver (except `self`).

Group visibility sections logically with `private` at the bottom. Avoid scattering `private` calls throughout the class.


## Bad

```ruby
class BankAccount
  def balance
    @balance
  end
  private

  def deposit(amount)
    @balance += amount
  end

  def withdraw(amount)
    raise "Insufficient" if amount > @balance
    @balance -= amount
  end
  public

  def transfer_to(other, amount)
    withdraw(amount)
    other.deposit(amount)  # Error -- can't call private method on other
  end
end
```


## Good

```ruby
class BankAccount
  def initialize
    @balance = 0
  end

  def transfer_to(other, amount)
    withdraw(amount)
    other.deposit(amount)
  end

  def balance
    @balance
  end

  protected

  def deposit(amount)
    @balance += amount
  end

  private

  def withdraw(amount)
    raise ArgumentError, "Insufficient funds" if amount > @balance
    @balance -= amount
  end
end
```


## See Also

- [api-public-api-minimal](./api-public-api-minimal.md)
- [api-single-responsibility](./api-single-responsibility.md)
