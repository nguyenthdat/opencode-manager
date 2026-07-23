# anti-naked-return-abuse

> Avoid naked returns in anything but very short functions

## Why It Matters

A naked `return` (no explicit values, relying on named return variables) works, but forces the reader to scroll back up to the function signature to remember what's actually being returned - fine in a three-line function, actively confusing in a long one where the named return values may have been reassigned several times across multiple branches since they were last visible on screen.

## Bad

```go
func process(input string) (result string, count int, err error) {
	if input == "" {
		err = errors.New("empty input")
		return // what's being returned here? scroll up to check.
	}

	parts := strings.Fields(input)
	count = len(parts)

	for _, p := range parts {
		if isValid(p) {
			result += p
		} else {
			err = fmt.Errorf("invalid part: %s", p)
			return // and here - by this point in a long function, it's easy to lose track
		}
	}

	result = strings.ToUpper(result)
	return // and here too, with three different meanings depending on which branch got here
}
```

## Good

```go
func process(input string) (string, int, error) {
	if input == "" {
		return "", 0, errors.New("empty input")
	}

	parts := strings.Fields(input)
	count := len(parts)

	var result string
	for _, p := range parts {
		if !isValid(p) {
			return "", 0, fmt.Errorf("invalid part: %s", p)
		}
		result += p
	}

	return strings.ToUpper(result), count, nil
}
```

## Where Named Returns (With an Explicit Return) Still Earn Their Keep

```go
// Named returns are useful for documentation and for a deferred cleanup
// function that needs to modify the return value - but still return explicitly:
func writeFile(path string, data []byte) (err error) {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer func() {
		if cerr := f.Close(); cerr != nil && err == nil {
			err = cerr // named return lets the deferred func adjust the final error
		}
	}()
	_, err = f.Write(data)
	return err // explicit, not naked - still clear what's being returned
}
```

## Rule of Thumb

Named return values are fine (even valuable, for the deferred-modification pattern above); *naked* returns that rely on the reader remembering the current state of those variables are the actual problem, especially once a function exceeds roughly ten lines or has more than one return point.

## See Also

- [err-return-early](err-return-early.md) - The guard-clause style shown in the "Good" example above
- [err-check-immediately](err-check-immediately.md) - Complementary style guidance for clear, explicit error handling
- [name-receiver-consistency](name-receiver-consistency.md) - Another readability convention worth applying alongside this one
