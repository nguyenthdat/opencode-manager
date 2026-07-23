# doc-about-topics

> Create about\_\* help topics for concepts

## Why It Matters

`about_*` topics document module concepts, architecture, and patterns that span multiple functions. `Get-Help about_MyModule_Architecture` gives users the big picture before they dive into individual cmdlets. Without about topics, users must piece together the module's design from scattered function help.

## Bad

```powershell
# No about topics — users must guess the architecture
# What's the authentication model?
# How do I handle errors?
# What's the recommended workflow?
```

## Good

```powershell
# en-US/about_MyModule.help.txt
TOPIC
    about_MyModule

SHORT DESCRIPTION
    Overview of the MyModule data processing module.

LONG DESCRIPTION
    MyModule provides cmdlets for ingesting, transforming, and exporting
    structured data from various sources. The module follows an ETL
    (Extract, Transform, Load) pipeline model.

    ## Authentication
    All cmdlets use certificate-based authentication. Set up with:
    Set-MyModuleAuth -CertificateThumbprint '...'

    ## Error Handling
    The module uses non-terminating errors for individual record failures
    and terminating errors for connection and authorization issues.

    ## Pipeline Architecture
    Data flows through three stages:
    1. Import-MyData     — Extract from source
    2. Convert-MyData    — Transform/cleanse
    3. Export-MyData     — Load to destination
```

## About Topic Layout

```powershell
# Minimal about topic structure:
TOPIC
    about_<ModuleName>[_<Concept>]

SHORT DESCRIPTION
    One-line summary.

LONG DESCRIPTION
    Full conceptual documentation.

    ## Section 1
    ...

    ## Section 2
    ...

KEYWORDS
    Space-separated search keywords.

SEE ALSO
    Get-Command, about_OtherTopic

# Topics to consider:
about_MyModule                    # Module overview
about_MyModule_Authentication     # Auth setup
about_MyModule_ErrorHandling      # Error conventions
about_MyModule_Pipeline           # Data flow design
about_MyModule_Migration          # Upgrade guide
```

## See Also

- [doc-maml-external](doc-maml-external.md) - MAML generation
- [doc-readme-module](doc-readme-module.md) - README documentation
