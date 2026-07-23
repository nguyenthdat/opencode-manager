# doc-avoid-redundant-comments

> Don't write comments that just restate what the code already says

## Why It Matters

A comment that repeats exactly what a well-named function/variable/line already communicates adds reading time without adding information, and worse, it can silently drift out of sync with the code it's supposedly describing. Comments earn their keep by explaining *why*, documenting a non-obvious constraint, or summarizing intent that isn't visible from the code alone - not by narrating *what* a self-explanatory line does.

## Bad

```go
// increment i by 1
i++

// loop over all users
for _, u := range users {
	// check if user is active
	if u.Active {
		// send the user a notification
		notify(u)
	}
}

// UserID is the user's ID
type UserID string

// GetName returns the name
func (u *User) GetName() string { return u.name } // also violates name-no-get-prefix
```

## Good

```go
for _, u := range users {
	if u.Active {
		notify(u)
	}
}
// No comments needed - the code already reads clearly.

// UserID uniquely identifies a user across all API versions; it is stable
// even if the user's email or username changes.
type UserID string

func (u *User) Name() string { return u.name }
```

## Where a Comment Adds Real Value

```go
// Retry with backoff: the upstream service rate-limits aggressively and
// returns 429 rather than queueing, so a fixed retry count without backoff
// would make the problem worse under load.
for attempt := 0; attempt < maxAttempts; attempt++ {
	if err := call(); err == nil {
		return nil
	}
	time.Sleep(backoff(attempt))
}

// Field order matters here: alignment keeps this struct at 16 bytes instead
// of 24 - see mem-struct-field-alignment before reordering.
type Event struct {
	Timestamp int64
	Count     int32
	Active    bool
}
```

## Rule of Thumb

Before writing a comment, ask: "if I renamed things well, would this comment be unnecessary?" If yes, improve the name instead of adding the comment. Reserve comments for the *why* - a tradeoff, a workaround for someone else's bug, an invariant the type checker can't express.

## See Also

- [doc-comment-starts-with-name](doc-comment-starts-with-name.md) - Comments that do earn their place: exported-identifier documentation
- [name-mixedcaps](name-mixedcaps.md) - Better naming as the alternative to a narrating comment
- [mem-struct-field-alignment](mem-struct-field-alignment.md) - An example of the kind of non-obvious constraint worth commenting
