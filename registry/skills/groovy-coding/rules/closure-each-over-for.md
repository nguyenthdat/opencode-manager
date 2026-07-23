# closure-each-over-for

> Prefer `.each{}` / `.collect{}` over explicit `for` loops

## Why It Matters

Groovy's GDK provides closure-based iteration methods that are more expressive, concise, and less error-prone than traditional `for` loops. Methods like `.each{}`, `.collect{}`, and `.findAll{}` eliminate off-by-one errors and reduce boilerplate index management.

## Bad

```groovy
def names = ['Alice', 'Bob', 'Charlie']
for (int i = 0; i < names.size(); i++) {
    println names[i]
}

def doubled = []
for (String name in names) {
    doubled << name * 2
}

def result = [:]
for (def entry : map.entrySet()) {
    result[entry.key] = entry.value.toUpperCase()
}
```

## Good

```groovy
def names = ['Alice', 'Bob', 'Charlie']
names.each { println it }

def doubled = names.collect { it * 2 }

def result = map.collectEntries { k, v ->
    [(k): v.toUpperCase()]
}
```

## With Index

```groovy
// When index is needed, use eachWithIndex
names.eachWithIndex { name, i ->
    println "$i: $name"
}

// Or collect with index
def indexed = names.collect { name -> "Item: $name" }
```

## See Also

- [col-collect-over-map](col-collect-over-map.md) - Use `.collect{}` over manual loops
- [col-find-results](col-find-results.md) - Use `.findAll{}` over filtering loops
- [closure-no-side-effects](closure-no-side-effects.md) - Keep closures side-effect-free
