# name-acronyms-lowercase

> Treat acronyms as words in CamelCase

## Why It Matters

In PascalCase, treat acronyms as regular words: only first letter uppercase. HTTP becomes Http, JSON becomes Json. This improves readability of multi-word names. Exception: when the entire name IS the acronym (e.g., URI).

## Bad

```ruby
class HTTPClient; end
class JSONParser; end
class XMLDocument; end
```


## Good

```ruby
class HttpClient; end   # Reads as "Http Client"
class JsonParser; end
class XmlDocument; end
# Exception -- when entire name is the acronym:
module URI; end  # Correct
```


## See Also

- [name-classes-pascal-case](./name-classes-pascal-case.md)
