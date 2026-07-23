# anti-raw-groovy-in-jenkins

> Don't inline complex Groovy in Jenkins pipelines

## Why It Matters

Complex Groovy logic embedded in `script {}` blocks makes Jenkinsfiles hard to test, debug, and reuse. Shared libraries allow versioning, unit testing, and IDE development of pipeline steps. Inline scripts also can't leverage `@CompileStatic` and are prone to runtime errors.

## Bad

```groovy
pipeline {
    agent any
    stages {
        stage('Process') {
            steps {
                script {
                    def data = readJSON file: 'data.json'
                    def transformed = data.items.collect { item ->
                        def score = item.values.sum()
                        [id: item.id, score: score, grade: score > 80 ? 'A' : 'B']
                    }
                    // 50 more lines of business logic mixed with pipeline code
                }
            }
        }
    }
}
```

## Good

```groovy
// vars/processData.groovy in shared library
def call(Map config) {
    def data = readJSON file: config.dataFile ?: 'data.json'
    DataProcessor.process(data)   // Delegates to compiled, tested Groovy class
}

// src/com/example/DataProcessor.groovy
@groovy.transform.CompileStatic
class DataProcessor {
    static List<Map> process(Map data) {
        data.items.collect { item ->
            def score = (item.values as List<Number>).sum() as int
            [id: item.id, score: score, grade: score > 80 ? 'A' : 'B']
        }
    }
}

// Jenkinsfile — clean and simple
@Library('data-pipeline-lib') _
pipeline {
    agent any
    stages {
        stage('Process') {
            steps {
                processData(dataFile: 'data.json')
            }
        }
    }
}
```

## See Also

- [jenkins-shared-libraries](jenkins-shared-libraries.md) - Extract reusable steps
- [jenkins-declarative-syntax](jenkins-declarative-syntax.md) - Prefer declarative pipeline
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for production
