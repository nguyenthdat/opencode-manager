# dsl-groovy-markup

> Use `MarkupBuilder` / `StreamingMarkupBuilder` for XML/HTML

## Why It Matters

Groovy's built-in markup builders turn closure hierarchies into well-formed XML/HTML without string concatenation or template engines. They handle escaping, indentation, and namespace management automatically, eliminating XSS vulnerabilities and malformed output.

## Bad

```groovy
def html = """
<html>
  <head><title>${title}</title></head>
  <body>
    <h1>${heading}</h1>
    <p>${userContent}</p>   <!-- XSS vulnerability if userContent has HTML -->
  </body>
</html>
"""

def xml = '<users>'
users.each { user ->
    xml += "<user id=\"${user.id}\"><name>${user.name}</name></user>"
}
xml += '</users>'
```

## Good

```groovy
import groovy.xml.MarkupBuilder

def writer = new StringWriter()
def xml = new MarkupBuilder(writer)

xml.users {
    users.each { user ->
        user(id: user.id) {
            name(user.name)
            email(user.email)
        }
    }
}
println writer.toString()

// Streaming for large documents
import groovy.xml.StreamingMarkupBuilder

def builder = new StreamingMarkupBuilder()
builder.encoding = 'UTF-8'

def doc = builder.bind {
    mkp.xmlDeclaration()
    users {
        users.each { user ->
            user(id: user.id) {
                name(user.name)
            }
        }
    }
}
println doc
```

## See Also

- [dsl-json-builder](dsl-json-builder.md) - Use JsonBuilder for JSON generation
- [dsl-method-missing](dsl-method-missing.md) - Use methodMissing for dynamic DSL
- [dsl-indent-style](dsl-indent-style.md) - Maintain consistent DSL indentation
