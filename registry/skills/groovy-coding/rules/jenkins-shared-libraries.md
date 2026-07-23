# jenkins-shared-libraries

> Extract reusable steps to shared libraries

## Why It Matters

Inline pipeline logic that's copy-pasted across multiple Jenkinsfiles creates a maintenance nightmare. Shared libraries centralize common steps — deployment strategies, notification patterns, environment setup — in versioned, testable Groovy code that all pipelines can consume.

## Bad

```groovy
// Jenkinsfile in repo A
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                script {
                    docker.build("app:${env.BUILD_ID}")
                    docker.withRegistry('https://registry.example.com', 'docker-creds') {
                        docker.image("app:${env.BUILD_ID}").push()
                        docker.image("app:${env.BUILD_ID}").push('latest')
                    }
                    // Same 20 lines copy-pasted in repo B, C, D...
                }
            }
        }
    }
}
```

## Good

```groovy
// vars/dockerBuild.groovy in shared library
def call(Map params) {
    def imageName = params.imageName ?: env.JOB_NAME
    def registry = params.registry ?: 'https://registry.example.com'
    def credsId = params.credentialsId ?: 'docker-creds'

    docker.build("${imageName}:${env.BUILD_ID}")
    docker.withRegistry(registry, credsId) {
        def image = docker.image("${imageName}:${env.BUILD_ID}")
        image.push()
        image.push(params.additionalTags ?: [])
    }
}

// Jenkinsfile — clean and reusable
@Library('my-shared-library') _

pipeline {
    agent any
    stages {
        stage('Docker Build') {
            steps {
                dockerBuild(
                    imageName: 'myapp',
                    additionalTags: ['latest', env.BRANCH_NAME]
                )
            }
        }
    }
}
```

## Library Structure

```
my-shared-library/
├── vars/
│   ├── dockerBuild.groovy      # Global variable / step
│   ├── notifySlack.groovy
│   └── deployToK8s.groovy
├── src/
│   └── com/example/
│       ├── DeployStrategy.groovy
│       └── HealthCheck.groovy
└── resources/
    └── com/example/
        └── template.yaml
```

## See Also

- [jenkins-declarative-syntax](jenkins-declarative-syntax.md) - Prefer declarative pipeline
- [anti-raw-groovy-in-jenkins](anti-raw-groovy-in-jenkins.md) - Don't inline complex Groovy
- [proj-script-vs-library](proj-script-vs-library.md) - Distinguish scripts from libraries
