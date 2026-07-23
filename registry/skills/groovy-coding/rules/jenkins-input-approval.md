# jenkins-input-approval

> Use `input{}` for manual approvals with timeout

## Why It Matters

Automated deployment to production without human approval is risky. `input{}` adds a manual gate that pauses the pipeline until an authorized user approves. Always enforce a timeout so the pipeline doesn't hold an executor indefinitely waiting for approval.

## Bad

```groovy
stage('Deploy to Production') {
    steps {
        sh './deploy.sh production'
        // No approval — deploys immediately, potentially unreviewed
    }
}

stage('Approve') {
    steps {
        input 'Deploy to production?'   // No timeout, no submitter restriction
    }
}
```

## Good

```groovy
stage('Deploy to Production') {
    when {
        branch 'main'
    }
    steps {
        timeout(time: 1, unit: 'HOURS') {
            input(
                message: "Deploy ${env.BUILD_TAG ?: env.BRANCH_NAME} to production?",
                submitter: 'release-team,admin',
                submitterParameter: 'approver',
                parameters: [
                    string(
                        name: 'CHANGELOG',
                        defaultValue: '',
                        description: 'Describe what is being deployed'
                    ),
                    booleanParam(
                        name: 'SKIP_SMOKE_TESTS',
                        defaultValue: false,
                        description: 'Skip post-deployment smoke tests'
                    )
                ]
            )
        }
        sh "APPROVER=${env.approver} ./deploy.sh production"
    }
}
```

## See Also

- [jenkins-timeout-retry](jenkins-timeout-retry.md) - Add timeout and retry
- [jenkins-declarative-syntax](jenkins-declarative-syntax.md) - Prefer declarative pipeline
- [jenkins-when-conditions](jenkins-when-conditions.md) - Use when for conditionals
