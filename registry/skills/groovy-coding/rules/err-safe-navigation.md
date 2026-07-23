# err-safe-navigation

> Use `?.` operator over explicit null checks

## Why It Matters

The safe navigation operator `?.` prevents `NullPointerException` by short-circuiting to `null` when the receiver is `null`. It eliminates verbose `if (x != null)` chains and makes null-safe traversal of object graphs concise and readable.

## Bad

```groovy
def getManagerName(Employee emp) {
    if (emp != null) {
        def dept = emp.department
        if (dept != null) {
            def manager = dept.manager
            if (manager != null) {
                return manager.name
            }
        }
    }
    return null
}

def city = null
if (user != null && user.address != null && user.address.city != null) {
    city = user.address.city
}
```

## Good

```groovy
def getManagerName(Employee emp) {
    emp?.department?.manager?.name
}

def city = user?.address?.city

// Combine with Elvis for defaults
def cityName = user?.address?.city ?: 'Unknown'

// Works with method calls too
def upperName = user?.name?.toUpperCase()

// Works with collections
def firstItem = items?.getAt(0)     // or items?[0]
```

## Safe Navigation Deep Dive

```groovy
// Safe method calls
def result = service?.process(data)

// Safe property access on method returns
def customerName = orderService?.findOrder(id)?.customer?.name

// With closures
def names = users?.collect { it?.name?.toUpperCase() }

// Safe indexing
def firstTag = document?.tags?[0]

// Safe navigation with GPath
def value = config?.server?.port ?: 8080
```

## See Also

- [err-elvis-default](err-elvis-default.md) - Use Elvis for default values
- [err-avoid-npe](err-avoid-npe.md) - Prevent NullPointerException
- [err-groovy-truth](err-groovy-truth.md) - Understand Groovy truth
