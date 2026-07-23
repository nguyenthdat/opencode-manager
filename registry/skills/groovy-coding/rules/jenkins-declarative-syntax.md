# jenkins-declarative-syntax

> Prefer declarative pipeline over scripted

## Why It Matters

Declarative pipelines provide a structured, validated syntax with built-in stages, post-actions, and when-conditions. They're easier to read, validate at startup, produce better Blue Ocean visualizations, and are the recommended syntax for new Jenkins pipelines.

## Bad

```groovy
node {
    stage('Checkout') {
        checkout scm
    }
    try {
        stage('Build') {
            sh 'make build'
        }
        stage('Test') {
            sh 'make test'
        }
    } catch (e) {
        echo "Build failed: ${e.message}"
        currentBuild.result = 'FAILURE'
        throw e
    } finally {
        junit '**/test-results/*.xml'
        deleteDir()
    }
}
```

## Good

```groovy
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
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
            cleanWs()
        }
        failure {
            slackSend(
                channel: '#builds',
                message: "Build failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            )
        }
    }
}
```

## See Also

- [jenkins-shared-libraries](jenkins-shared-libraries.md) - Extract reusable steps
- [jenkins-post-actions](jenkins-post-actions.md) - Use post for notifications
- [jenkins-when-conditions](jenkins-when-conditions.md) - Use when for conditionals
