# jenkins-when-conditions

> Use `when{}` blocks for conditional execution

## Why It Matters

`when{}` blocks provide declarative conditions for stage execution — branch matching, environment checks, expression evaluation. They're cleaner than `if/else` in script blocks, produce self-documenting pipelines, and are visible in Blue Ocean as skipped stages.

## Bad

```groovy
stage('Deploy') {
    steps {
        script {
            if (env.BRANCH_NAME == 'main') {
                sh 'make deploy-prod'
            } else if (env.BRANCH_NAME == 'staging') {
                sh 'make deploy-staging'
            }
        }
    }
}
```

## Good

```groovy
stage('Deploy') {
    when {
        anyOf {
            branch 'main'
            branch 'staging'
        }
    }
    steps {
        sh 'make deploy'
    }
}

// More conditions
stage('Production Deploy') {
    when {
        branch 'main'
        environment name: 'APPROVED', value: 'true'
        not { changeRequest() }
    }
    steps {
        sh 'make deploy-prod'
    }
}

stage('Full Test Suite') {
    when {
        expression { params.RUN_FULL_TESTS == true }
        beforeAgent true  // Evaluate before allocating agent
    }
    steps {
        sh 'make full-test'
    }
}
```

## See Also

- [jenkins-declarative-syntax](jenkins-declarative-syntax.md) - Prefer declarative pipeline
- [jenkins-parallel-stages](jenkins-parallel-stages.md) - Use parallel for independent stages
- [jenkins-input-approval](jenkins-input-approval.md) - Use input for manual approvals
