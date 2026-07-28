# Protobuf Rule Catalog

This catalog expands the 23 rules from the official
[Proto Best Practices](https://protobuf.dev/best-practices/dos-donts/) page into
reviewable requirements. It was checked against the official documentation on
2026-07-28. The current official documentation wins if it changes.

Supporting official references:

- [Protocol Buffers style guide](https://protobuf.dev/programming-guides/style/)
- [1-1-1 best practice](https://protobuf.dev/best-practices/1-1-1/)
- [ProtoJSON format](https://protobuf.dev/programming-guides/json/)
- [Proto serialization is not canonical](https://protobuf.dev/programming-guides/serialization-not-canonical/)

## Severity model

| Level | Meaning |
|---|---|
| BLOCKER | Likely deserialization failure, data loss, semantic corruption, generated-code failure, or unsafe version-skew behavior. Do not approve without a safe migration. |
| WARNING | Evolution, portability, maintainability, or future-compatibility risk. Fix by default; escalate when a concrete consumer is affected. |
| ADVISORY | Recommended modularity or consistency improvement whose value depends on project scale and coupling. |

Severity is contextual. Cite the actual reader, writer, format, language, or
stored payload that makes a rule applicable.

## 1. `PB-TAG-001`: Never reuse a field tag number

**Default:** BLOCKER

Once released, a tag identifies the old field forever. Reassigning it causes
old bytes to be decoded under the new field's meaning. Current source usage is
not proof that old payloads or binaries no longer exist.

Detect:

- Compare the changed schema with the baseline or descriptor history.
- Check deleted declarations and `reserved` ranges before accepting a new tag.
- Include storage, logs, queues, backups, and rollback binaries in the search.

Fix:

- Restore and reserve the old number.
- Give the new field a never-used number.
- If an incompatible field replacement is needed, use expand-migrate-contract.

```proto
message Account {
  reserved 4;
  string display_name = 9;
}
```

## 2. `PB-TAG-002`: Reserve deleted field numbers and names

**Default:** BLOCKER for the number; WARNING for the name

Deleting a declaration does not release its identity. Reserving the number
prevents accidental wire reuse. Reserving the name also prevents later source
or JSON-facing reuse and documents the removed contract.

```proto
message User {
  reserved 2, 7 to 9;
  reserved "legacy_email", "fax_number";

  string email = 10;
}
```

Use separate `reserved` statements for numbers/ranges and quoted names. Types
are intentionally not part of reservations, which also avoids retaining
obsolete imports.

## 3. `PB-ENUM-001`: Reserve deleted enum numbers and names

**Default:** BLOCKER for the number; WARNING for the name

Enum numeric values can remain in serialized data and unknown-field paths.
Reusing a deleted value can reinterpret historical data.

```proto
enum JobState {
  reserved 3, 5 to 7;
  reserved "JOB_STATE_PAUSED";

  JOB_STATE_UNSPECIFIED = 0;
  JOB_STATE_PENDING = 1;
  JOB_STATE_RUNNING = 2;
}
```

Assign new enum values fresh numbers rather than filling old gaps.

## 4. `PB-ENUM-002`: Add new enum aliases last

**Default:** WARNING; BLOCKER when enum names are interchanged as text/JSON

For aliases with the same numeric value, serializers emit the first listed
name while parsers accept every declared alias. A safe rename therefore needs
staged parser and serializer deployments.

Migration:

1. Enable aliases and add the new name below the old name.
2. Deprecate the old name when the dialect/toolchain supports it.
3. Deploy until every parser accepts both names.
4. Put the new name first and deploy serializers.
5. After every serializer and rollback version is safe, remove the old name.
6. Reserve the removed name; keep the numeric value assigned to the new name.

```proto
enum Status {
  option allow_alias = true;

  STATUS_UNSPECIFIED = 0;
  STATUS_ACTIVE = 1 [deprecated = true];
  STATUS_ENABLED = 1;
}
```

Binary protobuf stores the number, but ProtoJSON and text format store the
name. Never treat an enum rename as universally source-only.

## 5. `PB-TYPE-001`: Do not change a field type in place

**Default:** BLOCKER

Some scalar types share a wire representation and may parse each other's old
bytes, but that does not make the change operationally safe. Signedness,
range, truncation, validation, generated APIs, and mixed-version writes can
still alter behavior or lose data. ProtoJSON has different compatibility rules
from binary protobuf.

Fix:

1. Add a new field with a new tag and the new type.
2. Deploy readers for both fields.
3. Migrate writers and persisted data.
4. Retire the old field and reserve its number and name.

Do not approve an in-place change solely because both types use the same wire
type or a compatibility tool labels the descriptor parseable.

## 6. `PB-PRESENCE-001`: Do not add a required field

**Default:** BLOCKER

Old writers cannot populate a newly required field, and forwarding middleware
may be unable to parse otherwise valid messages. Requirements also change over
the lifetime of a long-lived schema.

- In proto2, use `optional` or `repeated` and enforce business requirements at
  the API/application boundary.
- In proto3, `required` does not exist.
- In Editions, do not introduce `LEGACY_REQUIRED` for a new contract; it exists
  for preserving legacy behavior during migration.

Document the contract with comments and validation rather than parse-time
required presence.

## 7. `PB-SIZE-001`: Avoid messages with hundreds of fields

**Default:** WARNING

Very large messages increase generated-code size and per-instance memory. In
C++, even unset fields add object overhead. Generated Java methods can hit
platform method-size limits.

Detect:

- Messages approaching hundreds of fields.
- Unrelated domains accumulated into one message.
- Generated code near compiler or method-size limits.

Fix by extracting cohesive submessages or separating API/storage concerns. Do
not split a message mechanically if the result creates misleading ownership or
cycles; preserve clear semantics.

## 8. `PB-ENUM-003`: Start enums with a non-semantic unspecified zero value

**Default:** WARNING

The first enum value must use number `0` in proto3 and Editions. Old clients
encountering a new or unset value can observe the default/first declaration, so
that value must not silently mean a real business state.

```proto
enum PaymentState {
  PAYMENT_STATE_UNSPECIFIED = 0;
  PAYMENT_STATE_PENDING = 1;
  PAYMENT_STATE_SETTLED = 2;
}
```

Requirements:

- Use a name such as `<ENUM_NAME>_UNSPECIFIED` or `<ENUM_NAME>_UNKNOWN`.
- Prefer `UNSPECIFIED` when no value was provided and `UNKNOWN` only when that
  is the intended distinction.
- Prefix enum values with the enum name to avoid sibling-scope collisions in
  languages such as C++.
- Keep zero non-semantic even if one state appears to be the obvious default.

If the value set is intentionally open and cross-language enum constants are
not needed, assess whether an integer field is a better fit; document the lost
type safety before choosing it.

## 9. `PB-ENUM-004`: Avoid C/C++ macro constants as enum values

**Default:** WARNING; BLOCKER when generated C/C++ fails

Names defined by C/C++ headers can be expanded by the preprocessor before the
generated protobuf header is parsed. Avoid values such as `NULL`, `NAN`, and
`DOMAIN`, even when the schema is first consumed from another language.

Prefixing values with the enum name usually avoids both macro and sibling enum
collisions:

```proto
enum NumberClass {
  NUMBER_CLASS_UNSPECIFIED = 0;
  NUMBER_CLASS_NOT_A_NUMBER = 1;
}
```

## 10. `PB-EXT-001`: Prefer extensions over `Any` where possible

**Default:** WARNING

`Any` permits arbitrary type URLs and has discoverability, dependency, and
evolution costs. If the extension points are known and the schema dialect and
ownership model support extensions, prefer declared extensions.

Use `Any` only when infrastructure must propagate genuinely arbitrary message
types and declaring every legal extension would be infeasible. Before choosing
it, document:

- Why a typed field, `oneof`, or declared extension cannot model the legal set.
- How type URLs are registered and resolved.
- What happens when the embedded type is unavailable.
- How authorization, validation, and compatibility are enforced.

Do not recommend extension syntax that the project's selected dialect cannot
compile. The rule is explicitly "where possible."

## 11. `PB-COMMON-001`: Use well-known and common types

**Default:** WARNING

Do not invent ad hoc primitive encodings for concepts with a shared type. Use:

- `google.protobuf.Duration` for a signed fixed-length span.
- `google.protobuf.Timestamp` for an instant in time.
- `google.protobuf.FieldMask` for symbolic field paths.
- Google common types for `Interval`, `Date`, `Month`, `DayOfWeek`,
  `TimeOfDay`, `PostalAddress`, `Money`, `LatLng`, and `Color`.

For example, prefer `google.protobuf.Timestamp created_at` over
`int64 created_at_millis`.

Well-known types ship with the Protocol Buffers compiler. Google common types
come from the `googleapis` repository and require an explicit dependency. Do
not add that dependency blindly; verify that the repository already vendors or
can accept it.

## 12. `PB-FILE-001`: Prefer one top-level entity and build target per file

**Default:** ADVISORY

The 1-1-1 guideline is one top-level message, enum, extension, or service in one
`.proto` file and one corresponding build target. It makes refactoring easier
and can reduce transitive dependencies, build time, and binary size.

Use `lower_snake_case.proto` filenames. Keep widely shared types in small files
with minimal dependencies.

Reasonable exceptions include:

- A group of unavoidable cyclic dependencies.
- Tiny, tightly coupled declarations whose co-location materially improves
  readability.
- Dependency-free files where splitting has no practical technical benefit.

Apply judgment; do not turn a modularity guideline into file-count theater.

## 13. `PB-DEFAULT-001`: Do not change a field default

**Default:** BLOCKER

Readers on opposite sides of the schema change interpret the same absent field
differently. That creates semantic version skew even though no bytes changed.
Proto3 removed user-defined defaults, but proto2 and migrated Editions schemas
may still expose them.

Fix by introducing a new field or application-level behavior with an explicit
staged rollout. Do not silently reinterpret absence.

## 14. `PB-CARDINALITY-001`: Do not change repeated to scalar

**Default:** BLOCKER

This can lose either the whole message or field data:

- ProtoJSON repeated/scalar mismatch can make the message fail or lose data.
- Packed numeric data can be lost when read as scalar.
- For some non-packed binary fields, only the last value wins.

The reverse scalar-to-repeated direction is only binary-compatible in limited
cases, such as proto2 or proto3 with non-packed encoding. It still changes
generated APIs and can be unsafe for JSON. Prefer a new field and staged
migration in both directions.

## 15. `PB-STYLE-001`: Follow target-language style in generated code

**Default:** WARNING

`.proto` names and file options become public identifiers in generated code.
Use the official protobuf style guide and validate every target language.

Baseline:

- Files: `lower_snake_case.proto`.
- Messages, enums, services, and RPC methods: `TitleCase`.
- Fields and `oneof` names: `lower_snake_case`; repeated fields are plural.
- Enum values: `UPPER_SNAKE_CASE`, preferably prefixed by enum name.
- Proto packages: dot-delimited lowercase names, not Java-style reverse DNS.
- `java_outer_classname`: valid Java `TitleCase`.
- `java_package` and related options: valid lowercase Java package names.
- `ruby_package`: `Foo::Bar::Baz`, not `Foo.Bar.Baz`.
- Indentation: 2 spaces; strings: double quotes; line length: 80 where
  practical.

Avoid underscores before digits and leading, trailing, or repeated underscores;
identifier transformations can collide and ProtoJSON `FieldMask` paths may not
round-trip.

## 16. `PB-FORMAT-001`: Do not use text format for interchange

**Default:** BLOCKER for a new interchange or persistence boundary

Text format and ProtoJSON encode field and enum names. Old parsers can reject
renames, unknown fields, enum values, or extensions. Text format is intended
for human editing and debugging, not durable machine interchange.

- Prefer binary protobuf when both sides support it.
- If ProtoJSON is required, treat names as part of the permanent wire contract.
- Record parser behavior for unknown fields and enum values.
- Do not describe a binary-safe change as JSON-safe without separate evidence.

Existing public JSON contracts may make field or enum renames permanently
unsafe. Preserve names or perform an explicit API-version migration.

## 17. `PB-SERIAL-001`: Never rely on serialization stability

**Default:** BLOCKER

Protobuf serialization is not canonical. Equivalent messages can produce
different bytes across schema changes, application builds, compiler flags,
runtime versions, languages, or unknown-field handling. Deterministic output
is not canonical across builds.

Do not use raw serialized protobuf bytes as:

- A stable cache key.
- A durable fingerprint or checksum of semantic content.
- An equality test for messages.
- Input to a signature that must verify across implementations or versions.

Use semantic equality or a separately specified canonical representation. If a
cryptographic or cache protocol needs canonical bytes, define and test that
canonicalization independently of protobuf's serializer.

## 18. `PB-JAVA-001`: Keep generated Java in a proto-only package

**Default:** WARNING

Generated protobuf classes should not share a Java package with handwritten
classes. A common pattern is a dedicated `proto` subpackage containing only
generated code.

Review `package`, `java_package`, and any alternate API package options. Keep
handwritten adapters in a different package so generated names and future code
generation changes cannot collide with application classes.

## 19. `PB-JAVA-002`: Derive Java package overrides from proto packages

**Default:** WARNING; BLOCKER for a concrete generated-name collision

Mapping distinct proto packages to the same Java package can collapse two
otherwise unique fully qualified names into one generated Java name.

Bad:

```proto
package x;
option java_package = "com.example.proto";
```

```proto
package y;
option java_package = "com.example.proto";
```

Prefer a consistent mapping such as:

```proto
package y;
option java_package = "com.example.proto.y";
```

Apply the same principle to language-specific package/namespace overrides in
other generated languages.

## 20. `PB-NAME-001`: Avoid language keywords in symbols and paths

**Default:** WARNING; BLOCKER when generated code cannot compile or access it

Messages, fields, enums, enum values, and filenames can collide with keywords
or reserved identifiers in any target language. Generators may rename them or
require unusual access syntax, producing inconsistent APIs across languages.

Also avoid generated-accessor collision patterns from the style guide:

- Prefixes such as `has_`, `get_`, `set_`, and `clear_`.
- The suffix `_value` where it collides with generated enum accessors.
- Names such as `descriptor`.

Check every generated target language, including languages that may adopt the
schema later when the contract is public or widely shared.

## 21. `PB-BOUNDARY-001`: Separate RPC/API messages from storage messages

**Default:** WARNING

RPC and storage schemas evolve for different consumers, time horizons, and
performance constraints. Reusing one message couples client compatibility to
storage migrations and exposes internal persistence decisions to API users.

Use separate request/response/domain and storage messages, plus an explicit
translation layer. Duplication is acceptable here because it buys independent
evolution and isolates trust/validation boundaries.

Escalate when a public API directly exposes a long-lived storage schema or a
storage migration would force coordinated client updates.

## 22. `PB-MODEL-001`: Avoid booleans for concepts likely to gain states

**Default:** WARNING

A boolean permanently encodes exactly two states and often hides what `true`
means at call sites. If pending, unknown, unsupported, or future formats are
plausible, use an enum with an unspecified zero value.

```proto
message Photo {
  enum FileType {
    FILE_TYPE_UNSPECIFIED = 0;
    FILE_TYPE_GIF = 1;
    FILE_TYPE_WEBP = 2;
    FILE_TYPE_PNG = 3;
  }

  FileType file_type = 1;
}
```

Use a boolean when the domain is intrinsically binary for the contract's full
lifetime, not merely binary in the current implementation.

## 23. `PB-JAVA-003`: Use `java_outer_classname` before Edition 2024

**Default:** WARNING

Before Edition 2024, each schema file should explicitly set a predictable,
collision-free Java outer class name derived from the filename:

```proto
// student_record_request.proto
option java_outer_classname = "StudentRecordRequestProto";
```

Edition 2024 aligned the default behavior with this recommendation. For Edition
2024 or later, do not add the option solely to reproduce the default. Preserve
an existing explicit option when removing it would change generated API names
or break consumers.

## Final review checklist

- Every removed field number is reserved; removed names are reserved where
  practical.
- Every removed enum number is reserved; removed names are reserved where
  practical.
- No released tag is reused and no field changes type/default/cardinality in
  place.
- No new required or `LEGACY_REQUIRED` contract is introduced.
- Every enum has a non-semantic zero value and portable value names.
- Alias renames have a parser-first, serializer-second rollout.
- Binary, ProtoJSON, and text compatibility are evaluated separately.
- Serialized bytes are not used as canonical identity.
- Shared types, file boundaries, RPC/storage separation, and future state growth
  were considered.
- Generated package, class, symbol, and path names are safe in every target
  language.
- Edition-specific Java outer-class behavior is handled without generated API
  churn.
- Compilation, lint, generated-code builds, and mixed-version tests were run
  with the repository's configured tools.
