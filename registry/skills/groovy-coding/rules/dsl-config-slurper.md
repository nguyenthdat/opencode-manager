# dsl-config-slurper

> Use `ConfigSlurper` for hierarchical config files

## Why It Matters

`ConfigSlurper` parses Groovy-like configuration files with environment-specific overrides, variable interpolation, and hierarchical merging. It's far more powerful than `.properties` files and more readable than JSON/YAML for complex configuration, supporting inheritance and computed values.

## Bad

```groovy
// Parsing application.properties manually
def props = new Properties()
new File('app.properties').withInputStream { props.load(it) }
def port = Integer.parseInt(props.getProperty('server.port', '8080'))

// JSON for complex config
def config = new JsonSlurper().parse(new File('config.json'))
def db = config.database[config.environment]
// Manual environment switching, no inheritance
```

## Good

```groovy
// config.groovy
environments {
    production {
        server {
            host = '0.0.0.0'
            port = 8080
        }
        database {
            url = 'jdbc:postgresql://localhost/prod'
            poolSize = 50
        }
    }
    development {
        server.port = 3000
        database {
            url = 'jdbc:postgresql://localhost/dev'
            poolSize = 5
        }
    }
    // Inherits from development
    test {
        server.port = 0  // random port
    }
}

// Loading
def config = new ConfigSlurper('development').parse(new File('config.groovy').toURL())
def port = config.server.port
def dbUrl = config.database.url
```

## Features

```groovy
// Environment-specific loading
def config = new ConfigSlurper(System.getProperty('env', 'development'))
    .parse(configUrl)

// Property interpolation
environments {
    common {
        app.name = 'MyApp'
        app.version = '1.0.0'
    }
    production {
        app.title = "${app.name} v${app.version}"   // Interpolates from common
    }
}

// Merging configs
def base = new ConfigSlurper().parse(baseUrl)
def override = new ConfigSlurper().parse(overrideUrl)
def merged = base.merge(override)

// Binding external variables
def slurper = new ConfigSlurper()
slurper.binding = [userHome: System.getProperty('user.home')]
def config = slurper.parse(configUrl)
```

## See Also

- [dsl-json-builder](dsl-json-builder.md) - Use JsonBuilder for JSON generation
- [dsl-named-params](dsl-named-params.md) - Use named parameters in constructors
- [proj-property-files](proj-property-files.md) - Use gradle.properties for build config
