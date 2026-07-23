# fn-small-focused

> Keep functions small and single-purpose

## Why It Matters

Shell functions tend to grow large because they're easy to extend inline. Large functions are hard to test, hard to understand, and prone to accidental variable leakage. Small, single-purpose functions compose better, are easier to name, and make the script's structure self-documenting. Aim for functions that do one thing well.

## Bad

```bash
# Giant function doing too many things
deploy_app() {
    echo "Starting deployment..."

    # Validate
    if [ -z "$1" ]; then echo "No env"; exit 1; fi

    # Build
    docker build -t app .
    docker tag app "registry/app:${VERSION}"

    # Test
    docker run --rm app ./test.sh

    # Push
    docker push "registry/app:${VERSION}"

    # Deploy
    ssh server "docker pull && docker-compose up -d"

    # Verify
    curl -f "https://app/health" || exit 1

    # Notify
    curl -X POST -d "Deployed $VERSION" "$SLACK_WEBHOOK"

    echo "Done!"
}
```

## Good

```bash
validate_environment() {
    local env="$1"
    [[ "$env" =~ ^(staging|production)$ ]] || {
        echo "Invalid environment: ${env}" >&2
        return 1
    }
}

build_image() {
    local version="$1"
    docker build -t "app:${version}" .
}

test_image() {
    local version="$1"
    docker run --rm "app:${version}" ./test.sh
}

push_image() {
    local version="$1"
    docker tag "app:${version}" "registry/app:${version}"
    docker push "registry/app:${version}"
}

deploy_to_server() {
    local version="$1" server="$2"
    ssh "$server" "docker pull registry/app:${version} && docker-compose up -d"
}

verify_deployment() {
    local url="$1" retries="${2:-5}"
    for ((i=0; i<retries; i++)); do
        curl -sf "$url" && return 0
        sleep 2
    done
    return 1
}

notify_slack() {
    local message="$1"
    curl -s -X POST -H "Content-type: application/json" \
        -d "{\"text\":\"${message}\"}" "${SLACK_WEBHOOK:-}" || true
}

deploy_app() {
    local env="$1" version="$2" server="$3"

    validate_environment "$env" || return 1
    build_image "$version" || return 1
    test_image "$version" || return 1
    push_image "$version" || return 1
    deploy_to_server "$version" "$server" || return 1
    verify_deployment "https://${server}/health" || return 1
    notify_slack "Deployed ${version} to ${env}"
}
```

## See Also

- [fn-pure-when-possible](./fn-pure-when-possible.md) - Pure function design
- [fn-no-side-effects](./fn-no-side-effects.md) - Minimizing side effects
