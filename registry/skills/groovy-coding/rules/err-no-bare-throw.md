# err-no-bare-throw

> Always throw an exception; don't re-throw without context

## Why It Matters

A bare `throw` inside a `catch` block re-throws the original exception, but a bare `throw` at the top level (not in a `catch`) is a compilation error. More importantly, always wrapping exceptions with context preserves the original cause via `initCause()` or constructor chaining, producing meaningful stack traces and error messages.

## Bad

```groovy
def processFile(String path) {
    try {
        def content = new File(path).text
        return parse(content)
    } catch (IOException e) {
        throw e   // Same exception, no added context
    }
}

def validate(User user) {
    if (user.name == null) {
        throw new RuntimeException()   // No message, no context
    }
}

// Bailing out with wrong mechanism
def loadConfig() {
    def file = new File('config.groovy')
    if (!file.exists()) {
        return   // Silently returns null — caller gets NPE later
    }
    new ConfigSlurper().parse(file.toURL())
}
```

## Good

```groovy
def processFile(String path) {
    try {
        def content = new File(path).text
        return parse(content)
    } catch (IOException e) {
        throw new ProcessingException(
            "Failed to read input file: $path", e
        )
    }
}

def validate(User user) {
    if (user.name == null) {
        throw new IllegalArgumentException("User name is required")
    }
    if (user.email == null) {
        throw new IllegalArgumentException("User email is required for user: ${user.id}")
    }
}

def loadConfig() {
    def file = new File('config.groovy')
    if (!file.exists()) {
        throw new IllegalStateException(
            "Config file not found: ${file.absolutePath}. Run 'init-config' first."
        )
    }
    new ConfigSlurper().parse(file.toURL())
}
```

## See Also

- [err-custom-exception](err-custom-exception.md) - Create domain-specific exceptions
- [err-catch-specific](err-catch-specific.md) - Catch specific exceptions
- [err-avoid-checked-to-unchecked](err-avoid-checked-to-unchecked.md) - Don't silence checked exceptions
