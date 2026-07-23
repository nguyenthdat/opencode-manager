# dsl-indent-style

> Maintain consistent DSL indentation for readability

## Why It Matters

Groovy DSLs rely heavily on closure nesting for structure, making indentation critical for readability. Inconsistent indentation makes it hard to see the DSL hierarchy at a glance and leads to misplaced blocks. Follow a standard 4-space indentation throughout DSL code.

## Bad

```groovy
pipeline {
    agent any
    stages {
    stage('Build') {
      steps {
    sh 'make build'
      }
      }
        stage('Test') {
            steps {
      sh 'make test'
            }
        }
    }
}
```

## Good

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'make build'
            }
        }
        stage('Test') {
            steps {
                sh 'make test'
            }
        }
    }
    post {
        always {
            junit '**/test-results/*.xml'
        }
    }
}

// Gradle build scripts use 4-space indent
plugins {
    id 'groovy'
    id 'application'
}

application {
    mainClass = 'com.example.Main'
}

tasks.register('processData') {
    inputs.file('data/input.csv')
    outputs.file('build/output.json')

    doLast {
        def input = inputs.files.singleFile
        def output = outputs.files.singleFile
        process(input, output)
    }
}
```

## See Also

- [name-script-vs-class](name-script-vs-class.md) - Script files vs class files
- [dsl-command-chains](dsl-command-chains.md) - Design method chains like DSL
- [jenkins-declarative-syntax](jenkins-declarative-syntax.md) - Prefer declarative pipeline
