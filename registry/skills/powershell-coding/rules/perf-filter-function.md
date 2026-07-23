# perf-filter-function

> Use filter keyword over function with process block

## Why It Matters

The `filter` keyword is syntactic sugar for `function` with an implicit `process` block — but the engine can optimize it better because the intent is explicit. For simple, stateless pipeline filters, `filter` conveys the purpose more clearly and can be marginally faster.

## Bad

```powershell
# Verbose filter function
function Get-LongFiles {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline)]
        [System.IO.FileInfo]$File
    )

    process {
        if ($File.Length -gt 1MB) {
            $File
        }
    }
}
```

## Good

```powershell
# Clean filter syntax
filter Get-LongFiles {
    if ($_.Length -gt 1MB) {
        $_
    }
}

# Usage
Get-ChildItem -Recurse | Get-LongFiles

# Filter with parameters
filter Where-IsError {
    param(
        [Parameter(ValueFromPipeline)]
        [string]$Line,

        [string]$Pattern = 'ERROR'
    )
    if ($Line -match $Pattern) { $Line }
}
```

## Filter vs Function

```powershell
# filter — implicit process block, $_ automatic variable
filter ConvertTo-TitleCase {
    (Get-Culture).TextInfo.ToTitleCase($_)
}

# Equivalent function — explicit process block
function ConvertTo-TitleCase {
    param([Parameter(ValueFromPipeline)][string]$InputObject)
    process {
        (Get-Culture).TextInfo.ToTitleCase($InputObject)
    }
}

# Use filter for: simple transformations, predicates, format conversions
# Use function for: anything with begin/end, complex state, multiple outputs
```

## See Also

- [pipe-where-object](pipe-where-object.md) - Where-Object filtering
- [pipe-foreach-object](pipe-foreach-object.md) - ForEach-Object streaming
