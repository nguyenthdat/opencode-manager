---
name: powershell-coding
description: "Comprehensive idiomatic PowerShell guidance: 129 prioritized rules across 12 categories. Use when writing, reviewing, refactoring, or debugging PowerShell (`.ps1`, `.psm1`, `.psd1`). Covers cmdlet design, pipeline, error handling, parameter binding, PowerShell 7.x features, security (execution policy/signing), module authoring, DSC, testing (Pester), and anti-patterns. Target PowerShell 7.4+ LTS."
compatibility: opencode
metadata:
  domain: powershell
  audience: software-engineer
  edition: pwsh-7.4
---

# PowerShell Best Practices

Comprehensive guide for writing high-quality, idiomatic, and secure PowerShell code. Contains 129 rules across 12 categories, prioritized by impact to guide LLMs in code generation and refactoring.

## When to Apply

Reference these guidelines when:
- Writing new PowerShell functions, scripts, or modules
- Implementing error handling or pipeline streaming
- Designing cmdlet parameters and parameter sets
- Reviewing code for security vulnerabilities or anti-patterns
- Authoring modules for publication to PSGallery
- Writing Pester tests for automation validation
- Optimizing pipeline performance or memory usage
- Refactoring legacy Windows PowerShell 5.1 code to PowerShell 7.4+

## PowerShell 7.4+ & Modern Features

This skill targets **PowerShell 7.4+ LTS** with cross-platform support (Windows, Linux, macOS). Key modern features to leverage:

- **Ternary operator (`?:`).** Use `$result = $condition ? $trueValue : $falseValue` for concise conditionals instead of verbose `if/else`.
- **Null-coalescing operators (`??`, `??=`).** Use `$value = $maybeNull ?? 'default'` and `$value ??= 'default'` for clean null handling.
- **Pipeline chain operators (`&&`, `||`).** Use `Test-Connection $host && Write-Host "Success"` for conditional chaining — runs only on success (`&&`) or failure (`||`).
- **ForEach-Object -Parallel.** Use `$items | ForEach-Object -Parallel { ... } -ThrottleLimit 10` for CPU-bound parallel work with automatic runspace pooling (7.0+).
- **PSReadLine 2.3+.** Predictive IntelliSense, syntax highlighting, multi-line editing, and plugin support for enhanced interactive experience.
- **PowerShell Crescendo.** Framework for creating native PowerShell cmdlets that wrap command-line tools — declarative JSON configuration yields proper pipeline-aware modules.
- **SecretManagement module.** Use `Get-Secret`, `Set-Secret`, `Get-SecretInfo` for cross-platform secret storage backed by SecretStore, Azure Key Vault, or HashiCorp Vault.
- **PowerShellGet 3.0.** Modern package management with `PSResourceRepository`, `Find-PSResource`, `Install-PSResource`, `Publish-PSResource` — replaces deprecated `PowerShellGet 2.x` cmdlets.
- **AMSI integration.** Use `Set-MpPreference -EnableScriptScanning $true` and register script content with `[System.Management.Automation.AmsiUtils]::AmsiInitialize()` for antimalware integration.
- **SSH-based remoting.** Use `New-PSSession -HostName $linuxServer -UserName $user -SSHTransport` for native SSH remoting to Linux/macOS without WinRM.
- **Simplified dynamic parameters.** Use `DynamicParam { ... }` block with `RuntimeDefinedParameterDictionary` for conditional parameter availability based on other parameter values.
- **Clean block syntax.** Prefer multi-line script blocks with `{` on the opening line; avoid `{` on its own line (Allman style) in PowerShell — as the AST parser treats newlines meaningfully in some contexts.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Cmdlet & Function Design | CRITICAL | `cmd-` | 14 |
| 2 | Error Handling & Debugging | CRITICAL | `err-` | 11 |
| 3 | Pipeline & Object Streaming | CRITICAL | `pipe-` | 11 |
| 4 | Parameter Binding & Validation | HIGH | `param-` | 12 |
| 5 | Security & Execution Policy | HIGH | `sec-` | 11 |
| 6 | Module & Script Authoring | HIGH | `mod-` | 10 |
| 7 | Naming & Style Conventions | MEDIUM | `name-` | 12 |
| 8 | Testing (Pester) | MEDIUM | `test-` | 10 |
| 9 | Help & Documentation | MEDIUM | `doc-` | 9 |
| 10 | Performance & Memory | MEDIUM | `perf-` | 9 |
| 11 | Project Structure & Tooling | LOW | `proj-` | 8 |
| 12 | Anti-patterns | REFERENCE | `anti-` | 12 |

---

## Quick Reference

### 1. Cmdlet & Function Design (CRITICAL)

- [`cmd-approved-verbs`](rules/cmd-approved-verbs.md) - Use approved verbs from Get-Verb (Get, Set, New, Remove, etc.)
- [`cmd-singular-nouns`](rules/cmd-singular-nouns.md) - Use singular nouns for cmdlet names (Get-User, not Get-Users)
- [`cmd-write-output`](rules/cmd-write-output.md) - Use Write-Output for pipeline output, Write-Host only for display
- [`cmd-should-process`](rules/cmd-should-process.md) - Support -WhatIf and -Confirm with SupportsShouldProcess
- [`cmd-supports-paging`](rules/cmd-supports-paging.md) - Implement -First/-Skip for large result sets
- [`cmd-advanced-function`](rules/cmd-advanced-function.md) - Use [CmdletBinding()] in all functions
- [`cmd-pipeline-input`](rules/cmd-pipeline-input.md) - Support pipeline input via ValueFromPipeline/ValueFromPipelineByPropertyName
- [`cmd-process-block`](rules/cmd-process-block.md) - Use begin/process/end blocks for pipeline functions
- [`cmd-no-write-host`](rules/cmd-no-write-host.md) - Prefer Write-Verbose/Write-Information over Write-Host
- [`cmd-stream-output-early`](rules/cmd-stream-output-early.md) - Output results as soon as available in process block
- [`cmd-single-responsibility`](rules/cmd-single-responsibility.md) - Each function does one thing well
- [`cmd-consistent-output`](rules/cmd-consistent-output.md) - Return consistent object types from functions
- [`cmd-terminating-vs-non`](rules/cmd-terminating-vs-non.md) - Use $ErrorActionPreference intentionally
- [`cmd-support-common`](rules/cmd-support-common.md) - Support -Verbose, -Debug, -ErrorAction common parameters

### 2. Error Handling & Debugging (CRITICAL)

- [`err-try-catch-specific`](rules/err-try-catch-specific.md) - Catch specific exception types, not all exceptions
- [`err-terminating-errors`](rules/err-terminating-errors.md) - Use throw or \$PSCmdlet.ThrowTerminatingError()
- [`err-non-terminating-write`](rules/err-non-terminating-write.md) - Use Write-Error for non-terminating errors
- [`err-erroraction-preference`](rules/err-erroraction-preference.md) - Don't globally set \$ErrorActionPreference to SilentlyContinue
- [`err-error-record`](rules/err-error-record.md) - Create proper ErrorRecord objects with ErrorDetails
- [`err-finally-cleanup`](rules/err-finally-cleanup.md) - Use finally block for resource cleanup
- [`err-no-empty-catch`](rules/err-no-empty-catch.md) - Never catch without logging or rethrowing
- [`err-log-errors`](rules/err-log-errors.md) - Log errors with timestamps and context
- [`err-exit-code`](rules/err-exit-code.md) - Set \$LASTEXITCODE or exit with non-zero for failures
- [`err-validate-before-use`](rules/err-validate-before-use.md) - Validate inputs before processing
- [`err-trap-handler`](rules/err-trap-handler.md) - Use trap statement for global error handling in scripts

### 3. Pipeline & Object Streaming (CRITICAL)

- [`pipe-objects-over-text`](rules/pipe-objects-over-text.md) - Pass objects through pipeline, not formatted text
- [`pipe-filter-left`](rules/pipe-filter-left.md) - Filter as early as possible (left side of pipeline)
- [`pipe-foreach-object`](rules/pipe-foreach-object.md) - Use ForEach-Object for stream processing
- [`pipe-parallel-foreach`](rules/pipe-parallel-foreach.md) - Use ForEach-Object -Parallel for independent operations (7.0+)
- [`pipe-select-object-last`](rules/pipe-select-object-last.md) - Select properties as late as possible
- [`pipe-no-format-left`](rules/pipe-no-format-left.md) - Don't use Format-\* before data processing
- [`pipe-where-object`](rules/pipe-where-object.md) - Use Where-Object for filtering; never manual if
- [`pipe-sort-efficient`](rules/pipe-sort-efficient.md) - Sort once, as late as possible
- [`pipe-tee-object`](rules/pipe-tee-object.md) - Use Tee-Object for debugging/logging pipeline
- [`pipe-out-null-performance`](rules/pipe-out-null-performance.md) - Use \$null = or [void] over Out-Null for speed
- [`pipe-group-object`](rules/pipe-group-object.md) - Use Group-Object for grouping data

### 4. Parameter Binding & Validation (HIGH)

- [`param-typed-parameters`](rules/param-typed-parameters.md) - Use [type] declarations for all parameters
- [`param-validate-attribute`](rules/param-validate-attribute.md) - Use [ValidateNotNullOrEmpty()], [ValidateSet()], etc.
- [`param-mandatory-explicit`](rules/param-mandatory-explicit.md) - Mark required params [Parameter(Mandatory=\$true)]
- [`param-default-values`](rules/param-default-values.md) - Set sensible defaults for optional params
- [`param-parameter-sets`](rules/param-parameter-sets.md) - Use parameter sets for mutually exclusive params
- [`param-valuefrompipeline`](rules/param-valuefrompipeline.md) - Enable pipeline binding with ValueFromPipeline
- [`param-supports-wildcards`](rules/param-supports-wildcards.md) - Support wildcard patterns when appropriate
- [`param-argument-completer`](rules/param-argument-completer.md) - Use [ArgumentCompleter()] for tab completion
- [`param-validate-script`](rules/param-validate-script.md) - Use [ValidateScript()] for complex validation
- [`param-no-position-binding`](rules/param-no-position-binding.md) - Don't rely on positional parameters in public functions
- [`param-named-params`](rules/param-named-params.md) - Pass parameters by name for clarity at call site
- [`param-splatting`](rules/param-splatting.md) - Use splatting (@params) for complex parameter sets

### 5. Security & Execution Policy (HIGH)

- [`sec-execution-policy`](rules/sec-execution-policy.md) - Use AllSigned or RemoteSigned in production
- [`sec-avoid-iex`](rules/sec-avoid-iex.md) - Never use Invoke-Expression (iex) with user input
- [`sec-no-clear-text-secrets`](rules/sec-no-clear-text-secrets.md) - Use SecretManagement module for secrets
- [`sec-script-signing`](rules/sec-script-signing.md) - Sign production scripts with Authenticode
- [`sec-constrained-language`](rules/sec-constrained-language.md) - Use ConstrainedLanguage mode for untrusted code
- [`sec-avoid-download-pipe-iex`](rules/sec-avoid-download-pipe-iex.md) - Never pipe downloaded content to Invoke-Expression
- [`sec-input-sanitize`](rules/sec-input-sanitize.md) - Sanitize user input for paths, commands, values
- [`sec-secure-string`](rules/sec-secure-string.md) - Use SecureString or PSCredential for passwords
- [`sec-audit-logging`](rules/sec-audit-logging.md) - Enable ScriptBlock and Module logging for auditing
- [`sec-no-hardcoded-creds`](rules/sec-no-hardcoded-creds.md) - Never store credentials in script files
- [`sec-amsi-integration`](rules/sec-amsi-integration.md) - Register with AMSI for antimalware integration

### 6. Module & Script Authoring (HIGH)

- [`mod-psm1-psd1`](rules/mod-psm1-psd1.md) - Separate module code (.psm1) from manifest (.psd1)
- [`mod-exported-functions`](rules/mod-exported-functions.md) - Use FunctionsToExport to control public API
- [`mod-script-module-over-binary`](rules/mod-script-module-over-binary.md) - Prefer script modules over binary when possible
- [`mod-module-scope-variables`](rules/mod-module-scope-variables.md) - Use Script scope for module-internal variables
- [`mod-private-functions`](rules/mod-private-functions.md) - Keep internal functions private with FunctionsToExport
- [`mod-dependency-declare`](rules/mod-dependency-declare.md) - Declare RequiredModules and RequiredAssemblies in manifest
- [`mod-version-semantic`](rules/mod-version-semantic.md) - Use semantic versioning in module manifests
- [`mod-classes-in-psm1`](rules/mod-classes-in-psm1.md) - Define PowerShell classes in .psm1 for module scoping
- [`mod-root-module-single`](rules/mod-root-module-single.md) - Use a single .psm1 root module with dot-sourcing
- [`mod-test-layout`](rules/mod-test-layout.md) - Include tests/ directory; bundle Pester tests with module

### 7. Naming & Style Conventions (MEDIUM)

- [`name-functions-Verb-Noun`](rules/name-functions-Verb-Noun.md) - Use Verb-Noun format for all functions
- [`name-variables-camelCase`](rules/name-variables-camelCase.md) - Use camelCase for variables
- [`name-parameters-PascalCase`](rules/name-parameters-PascalCase.md) - Use PascalCase for parameter names
- [`name-constants-UPPER_SNAKE`](rules/name-constants-UPPER_SNAKE.md) - Use UPPER_SNAKE_CASE for constants
- [`name-modules-PascalCase`](rules/name-modules-PascalCase.md) - PascalCase for module names
- [`name-scripts-kebab-case`](rules/name-scripts-kebab-case.md) - Use kebab-case for script file names
- [`name-prefix-module`](rules/name-prefix-module.md) - Use a short prefix for module-internal names
- [`name-no-aliases-scripts`](rules/name-no-aliases-scripts.md) - Don't use aliases in scripts (use full cmdlet names)
- [`name-boolean-is-has`](rules/name-boolean-is-has.md) - Prefix boolean variables with Is/Has/Should
- [`name-plural-collections`](rules/name-plural-collections.md) - Use plural names for arrays/collections
- [`name-ps-provider-nouns`](rules/name-ps-provider-nouns.md) - Match PSProvider nouns when creating new providers
- [`name-no-abbrev`](rules/name-no-abbrev.md) - Avoid abbreviations except well-known (VM, DNS, IP, CSV)

### 8. Testing — Pester (MEDIUM)

- [`test-pester-framework`](rules/test-pester-framework.md) - Use Pester for PowerShell testing
- [`test-describe-context`](rules/test-describe-context.md) - Structure with Describe/Context/It blocks
- [`test-before-each-after`](rules/test-before-each-after.md) - Use BeforeEach/AfterEach for fixture setup
- [`test-mock-commands`](rules/test-mock-commands.md) - Use Mock to replace external commands
- [`test-should-invoke`](rules/test-should-invoke.md) - Use Should -Invoke to verify command calls
- [`test-should-invoke-verifiable`](rules/test-should-invoke-verifiable.md) - Use Should -InvokeVerifiable for strict mock checking
- [`test-assertion-operators`](rules/test-assertion-operators.md) - Use Should -Be, -BeExactly, -BeLike, -Match
- [`test-code-coverage`](rules/test-code-coverage.md) - Enable code coverage with -CodeCoverage
- [`test-separate-unit-integration`](rules/test-separate-unit-integration.md) - Tag tests as Unit/Integration
- [`test-focus-danger`](rules/test-focus-danger.md) - Never commit -Tag 'Focus' or -ExcludeTag usage

### 9. Help & Documentation (MEDIUM)

- [`doc-comment-based-help`](rules/doc-comment-based-help.md) - Use <# ... #> comment-based help for all functions
- [`doc-synopsis-description`](rules/doc-synopsis-description.md) - Include .SYNOPSIS and .DESCRIPTION sections
- [`doc-parameter-help`](rules/doc-parameter-help.md) - Document .PARAMETER for each parameter
- [`doc-examples-section`](rules/doc-examples-section.md) - Include .EXAMPLE with real usage
- [`doc-maml-external`](rules/doc-maml-external.md) - Generate MAML XML for published modules
- [`doc-about-topics`](rules/doc-about-topics.md) - Create about\_\* help topics for concepts
- [`doc-updateable-help`](rules/doc-updateable-help.md) - Support Update-Help with HelpInfoUri
- [`doc-inline-why`](rules/doc-inline-why.md) - Comment WHY not WHAT
- [`doc-readme-module`](rules/doc-readme-module.md) - README with install, examples, full command reference

### 10. Performance & Memory (MEDIUM)

- [`perf-pipeline-over-loops`](rules/perf-pipeline-over-loops.md) - Use pipeline over manual foreach loops
- [`perf-foreach-object-parallel`](rules/perf-foreach-object-parallel.md) - Use ForEach-Object -Parallel for CPU work
- [`perf-avoid-write-host`](rules/perf-avoid-write-host.md) - Write-Host is slow; use [Console]::WriteLine or Output
- [`perf-hash-table-lookup`](rules/perf-hash-table-lookup.md) - Use hashtable for O(1) lookups over Where-Object
- [`perf-stream-over-collect`](rules/perf-stream-over-collect.md) - Stream pipeline results; don't collect in arrays unnecessarily
- [`perf-avoid-add-member`](rules/perf-avoid-add-member.md) - Avoid Add-Member in loops; use [PSCustomObject]
- [`perf-regex-compiled`](rules/perf-regex-compiled.md) - Use [regex]::new() with Compiled flag for repeated matching
- [`perf-string-builder`](rules/perf-string-builder.md) - Use StringBuilder over += for string building
- [`perf-filter-function`](rules/perf-filter-function.md) - Use filter keyword over function with process block

### 11. Project Structure & Tooling (LOW)

- [`proj-module-layout`](rules/proj-module-layout.md) - Follow standard module directory layout
- [`proj-public-private-dirs`](rules/proj-public-private-dirs.md) - Use Public/ and Private/ directories in modules
- [`proj-build-script`](rules/proj-build-script.md) - Provide build.ps1 for CI/CD
- [`proj-gitignore-powershell`](rules/proj-gitignore-powershell.md) - Include standard PS ignores (.psd1 secrets, etc.)
- [`proj-psd1-not-edited`](rules/proj-psd1-not-edited.md) - Don't manually edit .psd1 files; use Update-ModuleManifest
- [`proj-psrepository-publish`](rules/proj-psrepository-publish.md) - Publish to PSRepository/PSGallery correctly
- [`proj-source-control-psm1`](rules/proj-source-control-psm1.md) - Only commit .psm1 source; generate .psd1 fresh
- [`proj-ps1-psm1-separate`](rules/proj-ps1-psm1-separate.md) - Separate scripts (.ps1) from modules (.psm1)

### 12. Anti-patterns (REFERENCE)

- [`anti-iex-abuse`](rules/anti-iex-abuse.md) - Don't use Invoke-Expression for dynamic code execution
- [`anti-write-host-logging`](rules/anti-write-host-logging.md) - Don't use Write-Host for logging/output
- [`anti-format-right`](rules/anti-format-right.md) - Don't use Format-Table/List before passing data
- [`anti-backtick-continuation`](rules/anti-backtick-continuation.md) - Don't use backticks for line continuation
- [`anti-aliases-in-code`](rules/anti-aliases-in-code.md) - Don't use aliases (ls, dir, curl) in scripts
- [`anti-approve-all-confirm`](rules/anti-approve-all-confirm.md) - Don't use -Force to skip user prompts in scripts
- [`anti-global-variables`](rules/anti-global-variables.md) - Don't use \$global: scope in modules
- [`anti-null-comparison-wrong`](rules/anti-null-comparison-wrong.md) - Don't put \$null on the right side of comparison
- [`anti-overly-verbose-script`](rules/anti-overly-verbose-script.md) - Don't suppress errors globally with -ErrorAction 0
- [`anti-no-whatif`](rules/anti-no-whatif.md) - Don't skip -WhatIf implementation for destructive commands
- [`anti-string-interpolation-exec`](rules/anti-string-interpolation-exec.md) - Don't embed \$(...) execution in strings from user input
- [`anti-select-object-star`](rules/anti-select-object-star.md) - Don't use Select-Object \* for exploring; use Get-Member

---

## Recommended Module Manifest Settings

```powershell
@{
    RootModule           = 'MyModule.psm1'
    ModuleVersion        = '1.0.0'
    CompatiblePSEditions = @('Core')
    GUID                 = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    Author               = 'Your Name'
    CompanyName          = 'Your Company'
    Copyright            = '(c) 2024 Your Company. All rights reserved.'
    Description          = 'Module description'
    PowerShellVersion    = '7.4'
    FunctionsToExport    = @('Get-*', 'New-*', 'Set-*', 'Remove-*')
    CmdletsToExport      = @()
    VariablesToExport    = @()
    AliasesToExport      = @()
    PrivateData          = @{
        PSData = @{
            Tags         = @('Windows', 'Linux', 'macOS')
            LicenseUri   = 'https://opensource.org/licenses/MIT'
            ProjectUri   = 'https://github.com/yourorg/MyModule'
            ReleaseNotes = 'Initial release'
        }
    }
}
```

## Recommended Profile Settings

```powershell
# ~/.config/powershell/Microsoft.PowerShell_profile.ps1

# Strict mode for interactive debugging
Set-StrictMode -Version Latest

# Error preference for scripts
$ErrorActionPreference = 'Stop'

# PSReadLine configuration
Set-PSReadLineOption -PredictionSource HistoryAndPlugin
Set-PSReadLineOption -EditMode Emacs
Set-PSReadLineKeyHandler -Key Tab -Function Complete

# Module auto-loading preference
$PSModuleAutoLoadingPreference = 'ModuleQualified'

# Avoid default aliases in console too
Remove-Item Alias:ls -Force -ErrorAction SilentlyContinue
Remove-Item Alias:curl -Force -ErrorAction SilentlyContinue
Remove-Item Alias:wget -Force -ErrorAction SilentlyContinue
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing PowerShell code:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
4. **Read rule files** in `rules/` for detailed examples

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New function/cmdlet | `cmd-`, `name-`, `param-` |
| New module | `mod-`, `cmd-`, `doc-` |
| Pipeline processing | `pipe-`, `perf-` |
| Error handling | `err-`, `cmd-` |
| Security review | `sec-`, `anti-` |
| Performance tuning | `perf-`, `pipe-` |
| Code review / audit | `anti-`, `name-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) — choosing and implementing GoF/idiomatic patterns in PowerShell (pipeline/middleware, command, factory advanced functions).
- [security-review](../security-review/SKILL.md) — cross-language security/correctness review methodology (phases, finding format, severity guidance) applies to PowerShell reviews; it does not yet ship a dedicated PowerShell bug-class reference file, so apply the general workflow to execution-policy bypass, unsigned-script risk, and injection via untrusted input.

## Sources

This skill synthesizes best practices from:
- [PowerShell Best Practices and Style Guide](https://github.com/PoshCode/PowerShellPracticeAndStyle)
- [PowerShell Documentation — Microsoft Learn](https://learn.microsoft.com/en-us/powershell/)
- [PowerShell Scripting Performance Considerations](https://learn.microsoft.com/en-us/powershell/scripting/dev-cross-plat/performance/script-authoring-considerations)
- [PowerShell-Docs Community](https://github.com/MicrosoftDocs/PowerShell-Docs)
- [Pester Testing Framework](https://pester.dev/)
- Community conventions from PSGallery top modules (PSReadLine, Az, Pester, dbatools)
