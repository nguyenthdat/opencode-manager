# jenkins-timeout-retry

> Add `timeout{}` and `retry{}` on flaky steps

## Why It Matters

Network calls, external services, and resource-intensive operations can hang or fail transiently. Without timeouts, hung steps block pipeline executors indefinitely. Without retries, transient failures cause unnecessary build failures and manual re-runs.

## Bad

```groovy
stage('Deploy') {
    steps {
        sh 'kubectl apply -f deployment.yaml'
        sh 'kubectl rollout status deployment/myapp'
        // No timeout — can hang forever
        // No retries — any transient failure fails the build
    }
}

stage('Tests') {
    steps {
        sh './run-flaky-integration-tests.sh'
        // Fails 1 in 5 times on network hiccup
    }
}
```

## Good

```groovy
stage('Deploy') {
    steps {
        timeout(time: 10, unit: 'MINUTES') {
            retry(3) {
                sh 'kubectl apply -f deployment.yaml'
            }
            sh 'kubectl rollout status deployment/myapp'
        }
    }
}

stage('Tests') {
    steps {
        retry(2) {
            timeout(time: 15, unit: 'MINUTES') {
                sh './run-flaky-integration-tests.sh'
            }
        }
    }
}

// Input with timeout
stage('Approval') {
    steps {
        timeout(time: 1, unit: 'HOURS') {
            input(
                message: 'Approve production deployment?',
                submitter: 'release-team'
            )
        }
    }
}
```

## See Also

- [jenkins-input-approval](jenkins-input-approval.md) - Use input for manual approvals
- [jenkins-parallel-stages](jenkins-parallel-stages.md) - Use parallel for independent stages
- [jenkins-post-actions](jenkins-post-actions.md) - Use post for notifications
