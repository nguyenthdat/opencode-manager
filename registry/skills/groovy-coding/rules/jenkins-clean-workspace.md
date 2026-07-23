# jenkins-clean-workspace

> Clean workspace before checkout or use `cleanWs()`

## Why It Matters

Stale files from previous builds can cause false positives (tests pass because of old artifacts) or false negatives (build uses outdated dependencies). Cleaning the workspace before checkout ensures a fresh, reproducible build environment.

## Bad

```groovy
pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                checkout scm   // Stale files from previous build remain
            }
        }
        stage('Build') {
            steps {
                sh './gradlew build'   // May use stale build/ directory
            }
        }
    }
}
```

## Good

```groovy
pipeline {
    agent any
    options {
        skipDefaultCheckout()
    }
    stages {
        stage('Clean & Checkout') {
            steps {
                cleanWs()                 // Remove everything
                checkout scm              // Fresh checkout
            }
        }
        stage('Build') {
            steps {
                sh './gradlew build'
            }
        }
    }
}

// Selective cleaning
stage('Partial Clean') {
    steps {
        cleanWs(patterns: [
            [pattern: 'build/', type: 'INCLUDE'],
            [pattern: '.gradle/', type: 'INCLUDE'],
        ])
    }
}

// DeleteDir is simpler but less flexible
stage('Quick Clean') {
    steps {
        deleteDir()    // Removes workspace directory entirely
        checkout scm
    }
}
```

## See Also

- [jenkins-declarative-syntax](jenkins-declarative-syntax.md) - Prefer declarative pipeline
- [jenkins-agent-label](jenkins-agent-label.md) - Specify agent labels explicitly
- [jenkins-post-actions](jenkins-post-actions.md) - Use post for notifications
