# immut-defensive-copy-collections

> Defensively copy or expose read-only views of internal collections at construction and access boundaries

## Why It Matters

Storing a caller-provided collection by reference (rather than copying it) means the caller can mutate your internal state after handing it to you - and returning your internal collection by reference lets external code mutate it too. Both directions need protection unless you deliberately choose an immutable collection type end-to-end.

## Bad

```csharp
public class Playlist
{
    private readonly List<string> _tracks;

    public Playlist(List<string> tracks) => _tracks = tracks; // stores the caller's list directly

    public IReadOnlyList<string> Tracks => _tracks; // "read-only" view, but same backing list!
}

var source = new List<string> { "Track 1" };
var playlist = new Playlist(source);

source.Add("Track 2"); // mutates playlist's internal state from the outside
```

## Good

```csharp
public class Playlist
{
    private readonly List<string> _tracks;

    public Playlist(IEnumerable<string> tracks) => _tracks = [..tracks]; // copies at the boundary

    public IReadOnlyList<string> Tracks => _tracks.AsReadOnly(); // wraps, doesn't expose the List<T> itself
}

var source = new List<string> { "Track 1" };
var playlist = new Playlist(source);

source.Add("Track 2"); // no effect - playlist copied the values at construction
```

## Prefer Immutable Types to Avoid Needing Defensive Copies at All

```csharp
public class Playlist
{
    public ImmutableArray<string> Tracks { get; }

    public Playlist(IEnumerable<string> tracks) => Tracks = [..tracks];
    // No defensive copy needed on read - ImmutableArray<T> can never be mutated by anyone
}
```

## `.AsReadOnly()` Wraps, It Doesn't Copy

```csharp
// Careful: List<T>.AsReadOnly() returns a live, read-only VIEW over the same list -
// if you still hold a mutable reference to the underlying list internally and mutate
// it, the "read-only" view reflects that change too. That's fine when the mutation
// is intentional and internal; it is NOT the same guarantee as an immutable copy.
```

## See Also

- [immut-immutable-collections](immut-immutable-collections.md) - Avoiding the need for defensive copies entirely
- [api-expose-interfaces-not-impls](api-expose-interfaces-not-impls.md) - The public-surface half of this concern
