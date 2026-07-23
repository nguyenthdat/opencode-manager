# anti-global-variables

> Don't use global variables in scripts

## Why It Matters

Global variables in scripts persist across script invocations when using the same GroovyShell, create hidden dependencies between seemingly independent code, and prevent concurrent execution. Use method parameters, return values, and classes to manage state explicitly.

## Bad

```groovy
// global-script.groovy
def currentUser     // Global variable — survives between script evaluations
def dbConnection    // Open connection never closed

def login(String username) {
    currentUser = findUser(username)
    dbConnection = openDb()
}

def processData() {
    dbConnection.query("SELECT * FROM data WHERE user = ${currentUser.id}")
    // Uses global dbConnection — what if login() wasn't called?
}
```

## Good

```groovy
// Structured as a class
@groovy.transform.CompileStatic
class DataProcessor {
    private final Database db

    DataProcessor(Database db) {
        this.db = db
    }

    List<Map> processForUser(User user) {
        db.query("SELECT * FROM data WHERE user = ${user.id}")
    }
}

// Thin script entry point
def db = Database.connect('jdbc:...')
try {
    def user = findUser('Alice')
    def processor = new DataProcessor(db)
    def results = processor.processForUser(user)
    results.each { println it }
} finally {
    db.close()
}
```

## See Also

- [proj-script-vs-library](proj-script-vs-library.md) - Distinguish scripts from libraries
- [closure-no-side-effects](closure-no-side-effects.md) - Keep closures side-effect-free
- [err-with-resource](err-with-resource.md) - Use Groovy's automatic close
