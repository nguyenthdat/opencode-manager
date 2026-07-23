# proj-gitignore-powershell

> Include standard PS ignores (.psd1 secrets, etc.)

## Why It Matters

PowerShell generates temporary files, credentials exports, and build artifacts that must never be committed. A proper `.gitignore` prevents secret exposure, keeps the repo clean, and saves reviewers from sifting through generated files. Every PowerShell project needs one.

## Bad

```gitignore
# Minimal or no .gitignore
node_modules/
*.exe

# Credential files committed accidentally
# build artifacts in repo
# editor temp files everywhere
```

## Good

```gitignore
# PowerShell specific
*.psd1.secret
*_Secrets.ps1
*.enc.xml
*.clixml
credential*.xml
*.pfx

# Build outputs
output/
dist/
*.nupkg

# Pester test results
test-results.xml
coverage.xml

# Editor
.vscode/
.idea/
*.swp
*~

# OS
.DS_Store
Thumbs.db

# Module dependencies (installed locally)
*.psd1  # Only ignore if generating from source
# If .psd1 IS committed, remove the *.psd1 line above
```

## See Also

- [proj-source-control-psm1](proj-source-control-psm1.md) - Source control strategy
- [sec-no-hardcoded-creds](sec-no-hardcoded-creds.md) - No hardcoded credentials
