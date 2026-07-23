# anti-nested-closure-hell

> Don't nest closures beyond 3 levels

## Why It Matters

Deeply nested closures create "callback hell": code becomes hard to read, harder to debug, and impossible to test in isolation. Each level of nesting introduces new scoping rules (`delegate`, `owner`, `this`) that interact in confusing ways. Extract nested closures into named methods or classes.

## Bad

```groovy
def buildDashboard(data) {
    new DashboardBuilder().build {
        section('Overview') {
            data.groups.each { group ->
                panel(group.name) {
                    group.items.findAll { it.visible }.each { item ->
                        widget(item.type) {
                            header {
                                title item.name
                                item.tags.each { tag ->
                                    badge(tag)
                                }
                            }
                            body {
                                item.values.collect { v -> v * 2 }.each { transformed ->
                                    row {
                                        cell("${item.prefix}${transformed}${item.suffix}")  // 7 levels deep!
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

## Good

```groovy
def buildDashboard(data) {
    new DashboardBuilder().build {
        section('Overview') {
            data.groups.each { group ->
                renderGroup(group)   // Extracted!
            }
        }
    }
}

private def renderGroup(group) {
    panel(group.name) {
        group.items.findAll { it.visible }.each { item ->
            renderWidget(item)
        }
    }
}

private def renderWidget(item) {
    widget(item.type) {
        renderHeader(item)
        renderBody(item)
    }
}
```

## See Also

- [closure-each-over-for](closure-each-over-for.md) - Prefer each over for loops
- [closure-delegate-strategy](closure-delegate-strategy.md) - Set delegate strategy for DSL closures
- [dsl-indent-style](dsl-indent-style.md) - Maintain consistent DSL indentation
