# name-initialisms

> Keep initialisms at consistent casing: `ID`, `URL`, `HTTP` - not `Id`, `Url`, `Http`

## Why It Matters

Go convention treats well-known initialisms/acronyms as a single unit, cased consistently regardless of their position in the identifier - `ID` and `URL`, never `Id` and `Url`. This is codified in the community's `initialisms` list (used by `golint`'s successor `revive` and `staticcheck`), and following it makes identifiers instantly recognizable and consistent across every Go codebase.

## Bad

```go
type UserId struct {
	Id      string
	HomeUrl string
	ApiKey  string
}

func GetUserById(id string) (*UserId, error) { return nil, nil }
func ParseJson(data []byte) (any, error)      { return nil, nil }
```

## Good

```go
type UserID struct {
	ID      string
	HomeURL string
	APIKey  string
}

func GetUserByID(id string) (*UserID, error) { return nil, nil }
func ParseJSON(data []byte) (any, error)      { return nil, nil }
```

## Casing Depends on Export, Not on the Acronym Itself

```go
type Client struct {
	id  string // unexported: lowercase throughout, including the initialism - "id" not "iD" or "ID"
	URL string // exported: initialism fully uppercase - "URL" not "Url"
}

func (c *Client) userID() string { return c.id } // unexported method: "userID", not "userId"
func (c *Client) parseURL(raw string) (*url.URL, error) { return url.Parse(raw) } // "parseURL", not "parseUrl"
```

The rule: an initialism that appears mid-word keeps its consistent casing (all-upper for well-known ones like `ID`, `URL`, `HTTP`, `API`, `JSON`) regardless of whether the surrounding identifier is exported. Only the *first letter of the whole identifier* changes based on export status.

## Common Initialisms to Get Right

```
ID, URL, HTTP, HTTPS, API, JSON, XML, HTML, SQL, TCP, UDP, IP, UUID, UID, CPU, GC
```

## See Also

- [name-mixedcaps](name-mixedcaps.md) - The general MixedCaps convention initialisms fit into
- [name-no-stutter](name-no-stutter.md) - Another common naming-review finding alongside initialism casing
- [lint-revive-style](lint-revive-style.md) - Linter that flags inconsistent initialism casing automatically
