# jenkins-parallel-stages

> Use `parallel{}` for independent stages

## Why It Matters

Serial execution of independent stages wastes CI time. `parallel{}` runs multiple stages concurrently when they don't depend on each other, speeding up pipeline execution. This is essential for multi-platform testing, matrix builds, and independent deployment steps.

## Bad

```groovy
pipeline {
    agent any
    stages {
        stage('Unit Tests') {
            steps { sh 'make unit-test' }
        }
        stage('Integration Tests') {
            steps { sh 'make integration-test' }
        }
        stage('Lint') {
            steps { sh 'make lint' }
        }
        // All run sequentially — 3x slower than needed
    }
}
```

## Good

```groovy
pipeline {
    agent any
    stages {
        stage('Checks') {
            parallel {
                stage('Unit Tests') {
                    steps { sh 'make unit-test' }
                }
                stage('Integration Tests') {
                    steps { sh 'make integration-test' }
                }
                stage('Lint') {
                    steps { sh 'make lint' }
                }
            }
        }
    }
}

// Dynamic parallel with matrix
stage('Test Matrix') {
    steps {
        script {
            def platforms = ['linux', 'windows', 'mac']
            parallel platforms.collectEntries { platform ->
                [("Test on $platform")]: {
                    node(platform) {
                        checkout scm
                        sh "make test PLATFORM=$platform"
                    }
                }
            }
        }
    }
}
```

## See Also

- [jenkins-declarative-syntax](jenkins-declarative-syntax.md) - Prefer declarative pipeline
- [jenkins-agent-label](jenkins-agent-label.md) - Specify agent labels explicitly
- [jenkins-when-conditions](jenkins-when-conditions.md) - Use when for conditionals
