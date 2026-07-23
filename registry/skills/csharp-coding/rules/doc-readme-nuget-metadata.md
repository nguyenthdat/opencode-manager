# doc-readme-nuget-metadata

> Fill in NuGet package metadata (description, license, README, repository link) for any published package

## Why It Matters

A package listed on nuget.org (or an internal feed) with a blank description, no README, and no license information is both hard to evaluate ("what does this even do?") and a legal/compliance question mark for consumers. Complete metadata is what shows up on the package's nuget.org page and in Visual Studio's NuGet browser - it's effectively your package's landing page.

## Bad

```xml
<PropertyGroup>
  <PackageId>MyCompany.OrderProcessing</PackageId>
  <Version>1.0.0</Version>
  <!-- No description, no license, no README, no repository link -->
</PropertyGroup>
```

## Good

```xml
<PropertyGroup>
  <PackageId>MyCompany.OrderProcessing</PackageId>
  <Version>1.0.0</Version>
  <Authors>MyCompany</Authors>
  <Description>Order processing and payment orchestration library for .NET.</Description>
  <PackageLicenseExpression>MIT</PackageLicenseExpression>
  <PackageReadmeFile>README.md</PackageReadmeFile>
  <PackageProjectUrl>https://github.com/mycompany/order-processing</PackageProjectUrl>
  <RepositoryUrl>https://github.com/mycompany/order-processing</RepositoryUrl>
  <PackageTags>orders;payments;ecommerce</PackageTags>
  <PackageReleaseNotes>See CHANGELOG.md for release notes.</PackageReleaseNotes>
</PropertyGroup>

<ItemGroup>
  <None Include="README.md" Pack="true" PackagePath="\" />
</ItemGroup>
```

## Symbol Packages for Source-Level Debugging

```xml
<PropertyGroup>
  <IncludeSymbols>true</IncludeSymbols>
  <SymbolPackageFormat>snupkg</SymbolPackageFormat>
  <PublishRepositoryUrl>true</PublishRepositoryUrl>
  <EmbedUntrackedSources>true</EmbedUntrackedSources> <!-- source link support -->
</PropertyGroup>
```

## Central Metadata via Directory.Build.props

```xml
<!-- Directory.Build.props: shared metadata across every package in a multi-project solution -->
<Project>
  <PropertyGroup>
    <Authors>MyCompany</Authors>
    <PackageLicenseExpression>MIT</PackageLicenseExpression>
    <RepositoryUrl>https://github.com/mycompany/monorepo</RepositoryUrl>
  </PropertyGroup>
</Project>
```

## See Also

- [proj-directory-build-props](proj-directory-build-props.md) - Centralizing this metadata across projects
- [doc-generate-xml-docfile](doc-generate-xml-docfile.md) - IntelliSense docs shipped alongside the package
