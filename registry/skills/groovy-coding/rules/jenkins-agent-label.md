# jenkins-agent-label

> Specify agent labels explicitly; avoid `any`

## Why It Matters

`agent any` runs your pipeline on any available agent, which may not have the required tools, OS, or architecture. Explicit agent labels ensure your pipeline runs on a properly configured node and enable multi-platform testing. This prevents mysterious failures from missing toolchains.

## Bad

```groovy
pipeline {
    agent any   // Random agent — might not have Docker, JDK, etc.

    stages {
        stage('Build') {
            steps {
                sh 'docker build .'       // Fails if Docker not installed
                sh './gradlew build'      // Fails if wrong JDK version
            }
        }
    }
}
```

## Good

```groovy
pipeline {
    agent {
        label 'docker && java17'   // Only agents with both labels
    }

    stages {
        stage('Build') {
            steps {
                sh 'docker build .'
                sh './gradlew build'
            }
        }
    }
}

// Per-stage agents
pipeline {
    agent none   // No global agent — each stage gets its own

    stages {
        stage('Build on Linux') {
            agent { label 'linux && docker' }
            steps { sh './gradlew build' }
        }
        stage('Test on Windows') {
            agent { label 'windows && java17' }
            steps { bat 'gradlew.bat test' }
        }
        stage('Docker Build') {
            agent {
                docker {
                    image 'gradle:8.5-jdk17'
                    args '-v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps { sh './gradlew build' }
        }
    }
}
```

## See Also

- [jenkins-parallel-stages](jenkins-parallel-stages.md) - Use parallel for independent stages
- [jenkins-declarative-syntax](jenkins-declarative-syntax.md) - Prefer declarative pipeline
- [jenkins-clean-workspace](jenkins-clean-workspace.md) - Clean workspace before checkout
