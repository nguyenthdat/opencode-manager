# col-groupBy-partition

> Use `.groupBy{}` for grouping, not manual maps

## Why It Matters

Manually building maps with nested loops for grouping is verbose and error-prone. `.groupBy{}` returns a `Map` keyed by the closure result with lists of matching elements. It expresses grouping intent clearly and handles edge cases like empty lists gracefully.

## Bad

```groovy
def ordersByStatus = [:]
orders.each { order ->
    if (!ordersByStatus.containsKey(order.status)) {
        ordersByStatus[order.status] = []
    }
    ordersByStatus[order.status] << order
}

def usersByDepartment = [:]
users.each { user ->
    def dept = user.department
    def list = usersByDepartment[dept]
    if (list == null) {
        usersByDepartment[dept] = [user]
    } else {
        list << user
    }
}
```

## Good

```groovy
def ordersByStatus = orders.groupBy { it.status }

def usersByDepartment = users.groupBy { it.department }

// Group by compound key
def byRegionAndDept = users.groupBy {
    [region: it.region, dept: it.department]
}

// Group and transform values
def orderCountsByStatus = orders.groupBy { it.status }
    .collectEntries { status, list -> [(status): list.size()] }

// Multi-level grouping
def byDeptThenRole = users.groupBy { it.department }
    .collectEntries { dept, deptUsers ->
        [(dept): deptUsers.groupBy { it.role }]
    }
```

## Partitioning

```groovy
// Split into two groups based on a predicate
def (active, inactive) = users.split { it.active }

assert active.every { it.active }
assert inactive.every { !it.active }

// Collate — split into fixed-size chunks
def pages = items.collate(20)
```

## See Also

- [col-collect-over-map](col-collect-over-map.md) - Use collect for transformations
- [col-find-results](col-find-results.md) - Use findAll for filtering
- [col-count-sum](col-count-sum.md) - Use count and sum for aggregation
