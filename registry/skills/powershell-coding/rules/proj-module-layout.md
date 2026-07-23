# proj-module-layout

> Follow standard module directory layout

## Why It Matters

A standard directory layout is immediately recognizable to every PowerShell developer — they know where to find functions, tests, and docs without reading a README. Tooling (PSScriptAnalyzer, platyPS, CI pipelines) also assumes this layout. Non-standard structures confuse both humans and tools.

## Bad

```
my-tools/               # Module named MyTools, folder is my-tools
├── MyTools.psm1         # All code in root
├── helpers.ps1          # Mixed with module file
├── test.ps1             # Single test file
└── docs/                # No standard structure
    └── help.md
```

## Good

```
MyTools/
├── MyTools.psd1                 # Module manifest
├── MyTools.psm1                 # Root module (dot-sources below)
├── Public/                      # Exported functions
│   ├── Get-ToolStatus.ps1
│   ├── Set-ToolConfig.ps1
│   └── Invoke-ToolScan.ps1
├── Private/                     # Internal functions
│   ├── Connect-ToolApi.ps1
│   ├── Format-ToolResponse.ps1
│   └── Test-ToolConnection.ps1
├── Classes/                     # PowerShell classes (if any)
│   └── ToolSession.ps1
├── en-US/                       # Help files
│   ├── MyTools-help.xml
│   └── about_MyTools.help.txt
├── tests/                       # Pester tests
│   ├── Unit/
│   │   ├── Get-ToolStatus.Tests.ps1
│   │   └── Set-ToolConfig.Tests.ps1
│   └── Integration/
│       └── MyTools.Integration.Tests.ps1
├── .gitignore
├── build.ps1                    # Build/CI script
├── README.md
├── LICENSE
└── CHANGELOG.md
```

## See Also

- [proj-public-private-dirs](proj-public-private-dirs.md) - Public/Private dirs
- [mod-root-module-single](mod-root-module-single.md) - Single root module
