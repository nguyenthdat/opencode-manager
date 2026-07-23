# sec-no-hardcoded-secrets

> Use environment variables or secret managers for credentials

## Why It Matters

Hardcoded secrets in scripts get committed to version control, shared in backups, and exposed in code reviews. Once a secret touches git history, it's virtually impossible to fully remove. Always source secrets from environment variables, secret files with restricted permissions, or dedicated secret management tools.

## Bad

```bash
# Hardcoded credentials — will end up in git history
DB_PASSWORD="s3cr3t!"
API_TOKEN="sk-1234567890abcdef"
AWS_SECRET="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

curl -H "Authorization: Bearer sk-1234567890abcdef" https://api.example.com

# Hardcoded in heredoc
cat <<EOF > config.ini
[default]
password = hunter2
EOF
```

## Good

```bash
# Read from environment
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD must be set}"

# Read from file (Docker secrets style)
DB_PASSWORD="$(< /run/secrets/db_password)"
# File should be mode 0400, owned by the service user

# Read from secret manager
DB_PASSWORD="$(vault kv get -field=password secret/myapp/db)"
API_TOKEN="$(op read "op://vault/api_token")"   # 1Password CLI

# Load .env file (ensure .env is gitignored!)
set -a
source .env
set +a

# Function to safely prompt for secrets
read_secret() {
    local prompt="$1"
    local var_name="$2"
    local value
    read -r -s -p "${prompt}: " value
    echo >&2  # newline after hidden input
    printf -v "$var_name" '%s' "$value"
}
```

## Git Safety

```bash
# .gitignore
.env
*.secret
credentials.*
secrets/
*.gpg

# If you've committed a secret:
# 1. Rotate the secret immediately
# 2. git filter-branch / BFG Repo-Cleaner to remove from history
# 3. Force push (coordinate with team)
```

## See Also

- [sec-secrets-in-env](./sec-secrets-in-env.md) - Passing secrets via environment
- [sec-umask-restrictive](./sec-umask-restrictive.md) - Restrictive file permissions
