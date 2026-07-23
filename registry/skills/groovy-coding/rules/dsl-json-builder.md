# dsl-json-builder

> Use `JsonBuilder` / `StreamingJsonBuilder` for JSON generation

## Why It Matters

Manual JSON string construction is error-prone with escaping, commas, and nesting. Groovy's `JsonBuilder` and `StreamingJsonBuilder` produce valid JSON from closure-based DSL, handling all encoding and structure correctly. `JsonOutput` provides additional pretty-printing and conversion utilities.

## Bad

```groovy
def json = "{\"users\": ["
users.eachWithIndex { user, i ->
    json += "{\"id\": ${user.id}, \"name\": \"${user.name}\"}"
    if (i < users.size() - 1) json += ', '
}
json += ']}'

// Hand-crafted nested JSON — fragile and unreadable
def response = """{
  "status": "${status}",
  "data": {
    "items": ${items.collect{"{\\"key\\": \\"${it.key}\\", \\"value\\": ${it.value}}"}
    .join(',')}
  }
}"""
```

## Good

```groovy
import groovy.json.JsonBuilder

def builder = new JsonBuilder()
builder {
    users users.collect { user ->
        [id: user.id, name: user.name, email: user.email]
    }
}
println builder.toPrettyString()

// Streaming for large output
import groovy.json.StreamingJsonBuilder

def writer = new StringWriter()
def json = new StreamingJsonBuilder(writer)
json {
    status 'ok'
    data {
        items items.collect { item ->
            [key: item.key, value: item.value]
        }
    }
}
println writer.toString()

// Quick conversion
import groovy.json.JsonOutput
println JsonOutput.prettyPrint(JsonOutput.toJson([name: 'Alice', age: 30]))
```

## See Also

- [dsl-groovy-markup](dsl-groovy-markup.md) - Use MarkupBuilder for XML/HTML
- [dsl-config-slurper](dsl-config-slurper.md) - Use ConfigSlurper for config files
- [dsl-command-chains](dsl-command-chains.md) - Design method chains like DSL
