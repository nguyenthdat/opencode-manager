# proj-script-vs-library

> Distinguish scripts (executable) from libraries (reusable)

## Why It Matters

Groovy scripts are standalone `.groovy` files that can be run directly. Libraries are organized into packages with classes and are consumed as dependencies. Mixing the two leads to poor modularity, untestable business logic embedded in scripts, and inability to reuse code.

## Bad

```
my-app/
├── run-all.groovy              # 500 lines of business logic
├── deploy-prod.groovy          # Copy-pasted from run-all
├── process-data.groovy         # More business logic in scripts
└── helpers.groovy              # Functions loaded via evaluate()
```

## Good

```
my-app/
├── build.gradle
├── src/
│   ├── main/groovy/com/example/
│   │   ├── service/
│   │   │   ├── DataProcessor.groovy
│   │   │   └── DeploymentService.groovy
│   │   ├── model/
│   │   │   └── Order.groovy
│   │   └── util/
│   │       └── FileHelpers.groovy
│   └── test/groovy/com/example/
│       └── service/
│           └── DataProcessorSpec.groovy
└── scripts/
    ├── run-all.groovy           # Thin entry points
    ├── deploy-prod.groovy       # Orchestrates library code
    └── db-migrate.groovy
```

## Script Best Practices

```groovy
#!/usr/bin/env groovy
// scripts/run-all.groovy — Thin entry point

@groovy.transform.CompileStatic
def main() {
    def processor = new com.example.service.DataProcessor()
    def orders = processor.loadOrders('data/orders.csv')
    def summary = processor.summarize(orders)
    println "Processed ${summary.count} orders, total: ${summary.total}"
}

main()
```

## See Also

- [name-script-vs-class](name-script-vs-class.md) - Script files vs class files
- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
- [gradle-script-vs-plugin](gradle-script-vs-plugin.md) - Move complex logic to plugins
