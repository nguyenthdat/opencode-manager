# doc-maml-external

> Generate MAML XML for published modules

## Why It Matters

Comment-based help works for script modules but doesn't scale to large modules or provide the richest `Get-Help` experience. MAML (Microsoft Assistance Markup Language) XML enables updatable help, localization, and richer formatting. Published modules on PSGallery should ship with proper MAML help files.

## Bad

```powershell
# Module with only comment-based help
# No external help files — limited Get-Help experience
# No updateable help support
# No localization support
```

## Good

```powershell
# Generate MAML from comment-based help using platyPS
Install-Module platyPS -Scope CurrentUser

# Step 1: Create markdown help from module
New-MarkdownHelp -Module MyModule -OutputFolder ./docs

# Step 2: Edit markdown files (add details, fix formatting)

# Step 3: Update markdown from module (sync changes)
Update-MarkdownHelp ./docs

# Step 4: Generate MAML XML
New-ExternalHelp -Path ./docs -OutputPath ./en-US/

# Module folder structure:
# MyModule/
# ├── MyModule.psd1
# ├── MyModule.psm1
# └── en-US/
#     ├── MyModule-help.xml       # MAML help
#     └── about_MyModule.help.txt  # About topic
```

## platyPS Workflow

```powershell
# Create markdown help for all exported functions
New-MarkdownHelp -Module MyModule -OutputFolder ./docs -WithModulePage

# After changing parameters, update markdown
Update-MarkdownHelp -Path ./docs

# Generate external help (MAML)
New-ExternalHelp -Path ./docs -OutputPath ./en-US/ -Force

# Reference in module manifest
@{
    HelpInfoUri = 'https://myorg.com/help/MyModule'
}
```

## See Also

- [doc-updateable-help](doc-updateable-help.md) - Updatable help
- [doc-comment-based-help](doc-comment-based-help.md) - Comment-based help
