# type-strong-typedef-ids

> Wrap raw ids/handles in strong types

## Why It Matters

Two different kinds of identifiers with the same underlying representation (`int`, `size_t`) can be silently swapped at a call site with no compiler error — `transfer(user_id, account_id)` compiles just as well with the arguments reversed. Wrapping each in a distinct strong type makes such a swap a compile error instead of a runtime data-corruption bug.

## Bad

```cpp
void transfer_funds(int user_id, int account_id, int amount);

transfer_funds(account_id, user_id, amount);   // Arguments swapped — compiles fine,
                                                  // silently transfers to/from the
                                                  // wrong entities
```

## Good

```cpp
struct UserId {
    explicit UserId(int value) : value(value) {}
    int value;
    friend bool operator==(UserId a, UserId b) { return a.value == b.value; }
};

struct AccountId {
    explicit AccountId(int value) : value(value) {}
    int value;
    friend bool operator==(AccountId a, AccountId b) { return a.value == b.value; }
};

void transfer_funds(UserId user, AccountId account, int amount);

transfer_funds(AccountId(42), UserId(7), 100);
// Compile error: AccountId isn't implicitly convertible to UserId's parameter slot
```

## Lightweight Strong Type Template

```cpp
template <typename Tag, typename T>
class StrongId {
public:
    explicit StrongId(T value) : value_(value) {}
    T get() const { return value_; }
    friend bool operator==(StrongId a, StrongId b) { return a.value_ == b.value_; }
private:
    T value_;
};

struct UserIdTag {};
struct AccountIdTag {};
using UserId = StrongId<UserIdTag, int>;
using AccountId = StrongId<AccountIdTag, int>;
```

## See Also

- [api-explicit-constructors](api-explicit-constructors.md) - `explicit` to prevent accidental implicit conversion
- [type-strongly-typed-units](type-strongly-typed-units.md) - The same principle applied to units of measure
- [api-consistent-overload-set](api-consistent-overload-set.md) - Reducing argument-order ambiguity more broadly
