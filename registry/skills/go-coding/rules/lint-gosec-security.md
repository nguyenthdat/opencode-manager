# lint-gosec-security

> Enable `gosec` to catch common security mistakes in Go code

## Why It Matters

Certain mistakes - weak randomness for security-sensitive values, SQL built via string concatenation, hardcoded credentials, unchecked file permissions - compile perfectly and often work correctly in normal testing, only to become a real vulnerability once deployed. `gosec` statically scans for these known-risky patterns so they're caught in CI rather than discovered later via a security audit or incident.

## Bad

```go
import "math/rand"

func generateToken() string {
	return fmt.Sprintf("%d", rand.Int63()) // G404: math/rand is not cryptographically secure
}

func findUser(db *sql.DB, name string) (*User, error) {
	query := "SELECT * FROM users WHERE name = '" + name + "'" // G201: SQL built via string concatenation - injection risk
	return scanUser(db.QueryRow(query))
}

func writeSecret(data []byte) error {
	return os.WriteFile("secret.key", data, 0o777) // G306: overly permissive file mode
}
```

## Good

```go
import "crypto/rand"

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil { // crypto/rand: cryptographically secure
		return "", fmt.Errorf("generate token: %w", err)
	}
	return hex.EncodeToString(b), nil
}

func findUser(db *sql.DB, name string) (*User, error) {
	query := "SELECT * FROM users WHERE name = $1" // parameterized query - no injection risk
	return scanUser(db.QueryRow(query, name))
}

func writeSecret(data []byte) error {
	return os.WriteFile("secret.key", data, 0o600) // restrictive permissions: owner read/write only
}
```

## Running `gosec`

```sh
gosec ./...
# or via golangci-lint:
golangci-lint run --enable=gosec ./...
```

## Handling False Positives Deliberately

```go
// #nosec G104 -- this write is to a temp file whose failure is checked immediately after
tmpFile.Write(data)
```

Suppress a specific finding with a `#nosec` comment referencing the exact rule ID, and always include a reason - blanket-disabling `gosec` (or a whole rule category) hides genuine findings alongside the false positive.

## Common High-Value Checks

| ID | Risk |
|---|---|
| `G401`/`G505` | Use of weak cryptographic primitives (MD5, SHA1, DES) |
| `G404` | Use of `math/rand` where `crypto/rand` is needed |
| `G201`/`G202` | SQL built via string formatting/concatenation |
| `G304` | File path built from unsanitized user input (path traversal) |
| `G306`/`G302` | Overly permissive file/directory permissions |

## See Also

- [lint-golangci-lint-config](lint-golangci-lint-config.md) - Enabling `gosec` as part of the broader lint suite
- [http-request-body-limit](http-request-body-limit.md) - A related defensive-programming concern for HTTP handlers
- [lint-ci-gating](lint-ci-gating.md) - Failing CI on `gosec` findings rather than merely reporting them
