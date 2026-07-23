# name-no-stutter

> Avoid repeating the package name in its own exported identifiers

## Why It Matters

Every exported identifier is read together with its package name at the call site (`pkg.Thing`). If the identifier itself repeats the package name (`pkg.PkgThing`), that repetition is pure redundancy every single time it's referenced from outside the package - `go vet`'s `stutter`-adjacent guidance and virtually every style guide flag this as the single most common Go naming smell.

## Bad

```go
package user

type UserAccount struct{ /* ... */ }        // becomes user.UserAccount at call sites
func NewUserAccount() *UserAccount          { return nil }
func (a *UserAccount) UserAccountID() string { return "" }

package config

type ConfigLoader struct{ /* ... */ }  // becomes config.ConfigLoader
func LoadConfigFromFile(path string) (*ConfigLoader, error) { return nil, nil }
```

## Good

```go
package user

type Account struct{ /* ... */ }   // becomes user.Account - reads naturally
func New() *Account                { return nil }
func (a *Account) ID() string      { return "" }

package config

type Loader struct{ /* ... */ }    // becomes config.Loader
func LoadFromFile(path string) (*Loader, error) { return nil, nil }
```

## Call Sites Show Why This Matters

```go
// Stuttering:
acct := user.NewUserAccount()
id := acct.UserAccountID()

// Not stuttering:
acct := user.New()
id := acct.ID()
```

## Where Some Repetition Is Fine

If the identifier would be ambiguous or misleading without the repeated word (e.g., a package `http` exporting both `Client` and, distinctly, a `ClientError` type that specifically represents client-side HTTP errors, not just "an error"), a little redundancy for clarity beats an ambiguous short name. The rule is about avoiding *mechanical* repetition of the package name itself, not banning every word that happens to overlap.

## See Also

- [name-package-lowercase-short](name-package-lowercase-short.md) - Naming the package itself well in the first place
- [api-constructor-new-prefix](api-constructor-new-prefix.md) - `New` (not `NewUserAccount`) as the canonical constructor name
- [lint-revive-style](lint-revive-style.md) - Linter checks (`revive`'s `stutter`-style rules) that catch this
