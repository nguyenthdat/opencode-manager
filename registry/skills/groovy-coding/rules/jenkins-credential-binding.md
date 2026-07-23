# jenkins-credential-binding

> Use `withCredentials()` for secrets

## Why It Matters

Hardcoding credentials, tokens, or keys in Jenkinsfiles is a security vulnerability. `withCredentials()` securely binds credentials from Jenkins' credential store into environment variables or files, ensuring secrets are never logged, exposed in the UI, or committed to source control.

## Bad

```groovy
pipeline {
    agent any
    environment {
        DOCKER_PASSWORD = 'my-secret-password'    // NEVER do this!
        API_KEY = 'sk-1234567890abcdef'            // In plain text, in source control
    }
    stages {
        stage('Deploy') {
            steps {
                sh 'curl -H "Authorization: Bearer ${API_KEY}" https://api.example.com'
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
        stage('Deploy') {
            steps {
                withCredentials([
                    string(credentialsId: 'api-key', variable: 'API_KEY'),
                    usernamePassword(
                        credentialsId: 'docker-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    ),
                    file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')
                ]) {
                    sh '''
                        echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin
                        curl -H "Authorization: Bearer ${API_KEY}" https://api.example.com
                        kubectl --kubeconfig="${KUBECONFIG}" apply -f deployment.yaml
                    '''
                }
            }
        }
    }
}
```

## See Also

- [jenkins-declarative-syntax](jenkins-declarative-syntax.md) - Prefer declarative pipeline
- [jenkins-shared-libraries](jenkins-shared-libraries.md) - Extract reusable steps
- [err-custom-exception](err-custom-exception.md) - Create domain-specific exceptions
