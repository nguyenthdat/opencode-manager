# doc-brief-detailed-tags

> Use `\brief`/`\param`/`\return`/`\throws` consistently

## Why It Matters

Consistent Doxygen tag usage lets generated documentation render uniformly (a one-line summary in an index, full detail on the item's page) and lets readers scan for the specific piece of information they need (parameters? return semantics? what can go wrong?) without reading prose paragraphs each time.

## Bad — Inconsistent, Unstructured Comments

```cpp
// this opens a file and stuff, path is where the file is, returns
// something if it works I guess, throws maybe?
std::ifstream open_file(const std::string& path, bool binary);
```

## Good

```cpp
/// \brief Opens a file for reading.
///
/// \param path Filesystem path to the file to open.
/// \param binary If true, opens in binary mode; otherwise, text mode.
/// \return An open input stream positioned at the start of the file.
/// \throws std::ios_base::failure if the file cannot be opened.
std::ifstream open_file(const std::string& path, bool binary);
```

## Standard Tag Set

| Tag | Purpose |
|---|---|
| `\brief` | One-line summary (shown in indexes/tooltips) |
| `\param name` | Description of each parameter |
| `\return` | What the return value means |
| `\throws Type` | Which exceptions can propagate, and when |
| `\note` | Non-obvious caveats or context |
| `\see` | Cross-references to related items |
| `\deprecated` | Deprecation notice and migration guidance |

```cpp
/// \brief Computes the great-circle distance between two coordinates.
/// \param a First coordinate.
/// \param b Second coordinate.
/// \return Distance in meters.
/// \note Assumes a spherical Earth model; accuracy degrades near the poles.
/// \see Coordinate
double haversine_distance(const Coordinate& a, const Coordinate& b);
```

## See Also

- [doc-doxygen-public-api](doc-doxygen-public-api.md) - The overall documentation requirement
- [doc-deprecated-migration](doc-deprecated-migration.md) - `\deprecated` usage in depth
- [err-error-context-preserve](err-error-context-preserve.md) - Documenting what `\throws` actually means for callers
