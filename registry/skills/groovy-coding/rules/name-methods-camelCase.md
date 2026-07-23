# name-methods-camelCase

> Use `camelCase` for methods and variables

## Why It Matters

`camelCase` (lower camel case) for methods, variables, and parameters is the Java/Groovy standard. It provides a visual distinction from class names (`PascalCase`) and constants (`UPPER_SNAKE_CASE`), making code scannable and consistent across the JVM ecosystem.

## Bad

```groovy
class UserService {
    def GetUserById(Long id) { }       // PascalCase — looks like a class
    def find_user_by_name(name) { }     // snake_case — not JVM convention
    def ProcessOrder(order) { }         // PascalCase
}

def User_Name = 'Alice'                // snake_case
def OrderTotal = calculateTotal()      // PascalCase variable
```

## Good

```groovy
class UserService {
    def getUserById(Long id) { }
    def findUserByName(String name) { }
    def processOrder(Order order) { }
}

def userName = 'Alice'
def orderTotal = calculateTotal()

// Verb-first naming for methods
def fetchUsers() { }
def createReport() { }
def deleteRecord() { }
def validateInput() { }
```

## See Also

- [name-classes-PascalCase](name-classes-PascalCase.md) - Use PascalCase for classes
- [name-boolean-is-has](name-boolean-is-has.md) - Prefix booleans with is/has
- [name-no-get-prefix](name-no-get-prefix.md) - Drop get prefix for getters
