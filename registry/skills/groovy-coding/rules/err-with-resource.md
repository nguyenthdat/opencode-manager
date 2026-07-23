# err-with-resource

> Use Groovy's automatic close / try-with-resources

## Why It Matters

Unclosed resources (files, streams, database connections) cause resource leaks, file handle exhaustion, and connection pool starvation. Groovy provides convenient methods that auto-close resources, and Java's try-with-resources works natively.

## Bad

```groovy
def readFile(String path) {
    def reader = new File(path).newReader()
    def content = reader.text
    reader.close()        // Won't run if exception thrown
    return content
}

def writer = new FileWriter('output.txt')
writer.write(data)        // Exception leaves file open
writer.close()

def conn = dataSource.connection
def stmt = conn.prepareStatement('SELECT * FROM users')
def rs = stmt.executeQuery()
// Multiple resources, multiple close() calls — error prone
```

## Good

```groovy
def readFile(String path) {
    // Groovy's .withReader / .withWriter auto-close
    new File(path).withReader { reader ->
        reader.text   // Resource closed automatically
    }
}

// Groovy's .withCloseable
def content = new FileInputStream('data.bin').withCloseable { stream ->
    stream.bytes
}

// Java try-with-resources
try (def writer = new FileWriter('output.txt')) {
    writer.write(data)
}

// Multiple resources
try (
    def conn = dataSource.connection
    def stmt = conn.prepareStatement('SELECT * FROM users')
    def rs = stmt.executeQuery()
) {
    while (rs.next()) {
        processRow(rs)
    }
}
```

## Groovy Convenience Methods

```groovy
// .eachLine — reads lines and closes
new File('log.txt').eachLine { line ->
    println line
}

// .withInputStream / .withOutputStream
new File('data.zip').withInputStream { input ->
    new File('extracted').withOutputStream { output ->
        output << input
    }
}

// .withReader / .withWriter with encoding
new File('utf8.txt').withReader('UTF-8') { reader ->
    reader.text
}

// .filterLine — filtered line reading
def errors = new File('app.log').filterLine { line ->
    line.contains('ERROR')
}
```

## See Also

- [err-catch-specific](err-catch-specific.md) - Catch specific exceptions
- [err-avoid-npe](err-avoid-npe.md) - Prevent NullPointerException
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for performance
