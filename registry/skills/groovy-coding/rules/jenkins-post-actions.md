# jenkins-post-actions

> Use `post { always/success/failure }` for notifications

## Why It Matters

The `post` section guarantees actions run after stage or pipeline completion, regardless of success or failure. This is the correct place for cleanup, notifications, and artifact archiving. Manual try-catch-finally patterns in script blocks are error-prone and less readable.

## Bad

```groovy
stage('Build') {
    steps {
        script {
            try {
                sh 'make build'
                archiveArtifacts 'build/*.jar'
                slackSend(channel: '#builds', message: 'Build succeeded')
            } catch (e) {
                slackSend(channel: '#builds', message: "Build failed: ${e.message}")
                throw e
            } finally {
                cleanWs()
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
    }
    post {
        always {
            cleanWs()
            junit '**/test-results/*.xml'
        }
        success {
            archiveArtifacts artifacts: 'build/*.jar', fingerprint: true
            slackSend(
                channel: '#builds',
                color: 'good',
                message: "Build succeeded: ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
            )
        }
        failure {
            slackSend(
                channel: '#builds',
                color: 'danger',
                message: "Build FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
            )
        }
        unstable {
            slackSend(
                channel: '#builds',
                color: 'warning',
                message: "Build unstable: tests failed in ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            )
        }
    }
}
```

## See Also

- [jenkins-declarative-syntax](jenkins-declarative-syntax.md) - Prefer declarative pipeline
- [jenkins-shared-libraries](jenkins-shared-libraries.md) - Extract reusable steps
- [jenkins-clean-workspace](jenkins-clean-workspace.md) - Clean workspace before checkout
