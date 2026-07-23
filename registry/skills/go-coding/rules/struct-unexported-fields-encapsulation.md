# struct-unexported-fields-encapsulation

> Keep fields unexported unless callers genuinely need direct access

## Why It Matters

An exported field can be mutated by any caller, at any time, bypassing whatever invariants the type's methods maintain. Unexported fields, paired with accessor methods where read access is needed, keep the type in control of its own consistency - callers can only change state through methods the type author has explicitly decided are safe.

## Bad

```go
type Account struct {
	Balance int // exported: any caller can set this to anything, including a negative number
}

func (a *Account) Withdraw(amount int) error {
	if amount > a.Balance {
		return errors.New("insufficient funds")
	}
	a.Balance -= amount
	return nil
}

acct := &Account{Balance: 100}
acct.Balance = -500 // bypasses Withdraw entirely - the invariant "Balance >= 0" is unenforceable
```

## Good

```go
type Account struct {
	balance int // unexported: can only be changed through Account's own methods
}

func NewAccount(initial int) (*Account, error) {
	if initial < 0 {
		return nil, errors.New("initial balance must not be negative")
	}
	return &Account{balance: initial}, nil
}

func (a *Account) Balance() int { return a.balance } // read access via an explicit accessor

func (a *Account) Withdraw(amount int) error {
	if amount > a.balance {
		return errors.New("insufficient funds")
	}
	a.balance -= amount
	return nil
}
```

## When Exported Fields Are the Right Choice

```go
// Plain data-holding types with no invariants to protect are fine with
// exported fields - forcing accessors here would be pure ceremony:
type Point struct {
	X, Y float64
}

type Config struct { // configuration structs are typically populated directly by callers/JSON, with no invariant beyond field types
	Timeout time.Duration
	Retries int
}
```

## Rule of Thumb

Ask whether the type has an invariant - a rule that must hold across its fields, or a rule about how a field may change over time - that direct field mutation could violate. If yes, keep the field unexported and mediate changes through methods. If the type is genuinely just a bag of independently-meaningful values, exported fields are simpler and equally idiomatic.

## See Also

- [struct-constructor-validation](struct-constructor-validation.md) - Enforcing the same invariants at construction time
- [name-no-get-prefix](name-no-get-prefix.md) - Naming the accessor method that exposes an unexported field
- [type-zero-value-useful](type-zero-value-useful.md) - Whether a useful zero value is still possible once fields are unexported
