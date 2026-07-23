# name-package-lowercase-short

> Package names: lowercase, short, no underscores or mixedCaps

## Why It Matters

A package name becomes part of every qualified reference to its exported identifiers (`pkgname.Thing`), so it's read constantly at every call site. Go convention keeps package names short, lowercase, single-word where possible - this is different from, and stricter than, the general identifier naming rule, because the package name prefixes everything else.

## Bad

```go
package UserManagement // mixedCaps not used for packages

package user_management // no underscores in package names

package utils // too generic - "utils" tells the reader nothing about what's inside
```

## Good

```go
package user   // short, lowercase, single word
package auth   // short, lowercase, single word
package httputil // compound but still lowercase, no separator - matches stdlib convention (net/http, encoding/json)
```

## Standard Library Examples

```go
package http     // not "httppkg" or "HTTPPackage"
package json     // not "jsonutils"
package strconv  // "string conversion", abbreviated, but immediately recognizable
package fmt      // "format", abbreviated further still
```

## Avoid Generic "Junk Drawer" Names

```go
// Bad: tells the reader nothing about what the package actually does
package utils
package common
package helpers
package misc

// Good: name the package after what it provides
package retry    // instead of "utils" containing a Retry function
package validate // instead of "common" containing validation helpers
```

## The Package Name Is Not Repeated in Its Own Identifiers

```go
package user

// Bad: stutters when referenced as user.UserID from another package
type UserID string

// Good: reads naturally as user.ID from another package
type ID string
```

## See Also

- [name-no-stutter](name-no-stutter.md) - The specific stutter problem shown above, in more depth
- [proj-package-by-feature](proj-package-by-feature.md) - Organizing packages so their names naturally describe a feature
- [name-mixedcaps](name-mixedcaps.md) - The general identifier casing convention, distinct from package naming
