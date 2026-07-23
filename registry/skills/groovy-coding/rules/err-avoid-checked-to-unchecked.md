# err-avoid-checked-to-unchecked

> Don't silence checked exceptions unnecessarily

## Why It Matters

Java checked exceptions exist for recoverable conditions that callers should handle. Catching and re-throwing them as unchecked exceptions without adding context or handling logic discards valuable type information and makes error recovery impossible upstream.

## Bad

```groovy
def readConfig(String path) {
    try {
        return new File(path).text
    } catch (IOException e) {
        throw new RuntimeException(e)   // Lost the fact that it's an IO issue
    }
}

def loadAll() {
    try {
        def config = readConfig('app.conf')
        def data = parseData(config)
        return data
    } catch (Exception e) {
        // Can't differentiate IO failure from parse failure
        println "Failed to load: ${e.message}"
    }
}
```

## Good

```groovy
class ConfigException extends Exception {
    ConfigException(String message, Throwable cause) {
        super(message, cause)
    }
}

def readConfig(String path) throws ConfigException {
    try {
        return new File(path).text
    } catch (IOException e) {
        throw new ConfigException(
            "Unable to read config from $path: ${e.message}", e
        )
    }
}

def loadAll() {
    try {
        def config = readConfig('app.conf')
        def data = parseData(config)
        return data
    } catch (ConfigException e) {
        log.error("Config error — using defaults", e)
        return defaultConfig
    } catch (ParseException e) {
        log.error("Parse error — aborting", e)
        throw e   // Don't swallow parse errors
    }
}
```

## See Also

- [err-catch-specific](err-catch-specific.md) - Catch specific exceptions
- [err-custom-exception](err-custom-exception.md) - Create domain-specific exceptions
- [err-no-bare-throw](err-no-bare-throw.md) - Always throw with context
