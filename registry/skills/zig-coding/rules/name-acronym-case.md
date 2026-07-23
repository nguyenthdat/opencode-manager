# name-acronym-case

> Treat acronyms as ordinary words in identifiers, matching the standard library's own style

## Why It Matters

The Zig standard library writes `Uri`, `Utf8`, `Tls`, and `Id` rather than `URI`, `UTF8`, `TLS`, and `ID` — treating an acronym as a single word that gets `TitleCase`d or `camelCase`d like any other word keeps casing rules uniform (no special-case exception needed) and matches identifiers you'll see throughout `std`.

## Bad

```zig
const std = @import("std");

const HTTPClient = struct { // ALL-CAPS acronym breaks the uniform TitleCase rule
    baseURL: []const u8,     // same issue in a field name

    fn parseURL(self: HTTPClient, raw: []const u8) !void {
        _ = self;
        _ = raw;
    }
};
```

## Good

```zig
const std = @import("std");

const HttpClient = struct {
    base_url: []const u8,

    fn parseUrl(self: HttpClient, raw: []const u8) !void {
        _ = self;
        _ = raw;
    }
};

const UserId = u64; // matches std's own Id convention, not "UserID"

test "acronyms as ordinary words" {
    const client = HttpClient{ .base_url = "https://example.com" };
    _ = client;
}
```

## See Also

- [name-types-titlecase](name-types-titlecase.md) - the TitleCase rule this convention stays consistent with
- [name-fields-snake-or-camel](name-fields-snake-or-camel.md) - applying the same treatment to field names
- [interop-c-abi-types](interop-c-abi-types.md) - where C header acronym conventions may need explicit translation
