---
name: protobuf-best-practices
description: >-
  Protocol Buffers schema authoring, evolution, migration, and review guidance
  for .proto files, gRPC contracts, protobuf storage, and breaking-change
  checks. Use when creating, editing, or reviewing protobuf messages, fields,
  enum or tag numbers, packages, generated-code options, ProtoJSON or text
  interchange, Any, well-known types, RPC/storage models, or compatibility
  migrations. Do not use for language-specific generated-runtime APIs alone.
compatibility: opencode
metadata:
  domain: protobuf
  audience: software-engineer
  workflow: schema-authoring-and-review
---

# Protobuf Best Practices

Design and evolve Protocol Buffers schemas without breaking independently
deployed readers, writers, stored payloads, or generated code. The rules are
based on the official Protocol Buffers dos and don'ts and are organized for
both implementation and review work.

## Core contract

- Assume readers and writers run different schema versions. Simultaneous
  deployment and rollback do not eliminate version skew.
- Treat a field or enum number as permanent once released. Old binaries,
  queues, logs, backups, and stored bytes can outlive the current source tree.
- Distinguish binary wire compatibility from operational safety. A parseable
  type change can still truncate values, change meaning, or fail during rollout.
- Treat ProtoJSON and text format as weaker evolution boundaries because they
  encode field and enum names and do not preserve unknown fields like the binary
  wire format does.
- Prefer additive, staged migrations over in-place reinterpretation.

## Workflow

### 1. Establish the compatibility surface

Before editing or reviewing, determine:

1. The schema dialect: `proto2`, `proto3`, Edition 2023, Edition 2024, or later.
2. The baseline schema or diff being changed.
3. Generated target languages and package/file options.
4. Whether messages cross RPC, queue, file, database, cache, log, or public API
   boundaries.
5. Whether interchange is binary, ProtoJSON, text format, or more than one.
6. Whether historical payloads, old clients, or rollback versions must remain
   readable.

Do not assume a source-only change is safe when the runtime or persistence
context is unknown. State the unknown as a review assumption.

### 2. Apply the complete rule set

Read `references/rules.md` before making a schema change or completing a
review. Check every changed construct against the relevant rule cluster. The
23 rules below map one-to-one to the official dos and don'ts page.

| Rule | Requirement | Default level |
|---|---|---|
| `PB-TAG-001` | Never reuse a field tag number | BLOCKER |
| `PB-TAG-002` | Reserve deleted field numbers and preferably names | BLOCKER |
| `PB-ENUM-001` | Reserve deleted enum numbers and preferably names | BLOCKER |
| `PB-ENUM-002` | Add a new enum alias last and migrate it in stages | WARNING |
| `PB-TYPE-001` | Do not change a field type in place | BLOCKER |
| `PB-PRESENCE-001` | Do not add a required field | BLOCKER |
| `PB-SIZE-001` | Avoid messages with hundreds of fields | WARNING |
| `PB-ENUM-003` | Put a non-semantic `*_UNSPECIFIED = 0` value first | WARNING |
| `PB-ENUM-004` | Avoid C/C++ macro names as enum values | WARNING |
| `PB-EXT-001` | Prefer extensions over `Any` where extensions fit | WARNING |
| `PB-COMMON-001` | Reuse well-known and common types | WARNING |
| `PB-FILE-001` | Prefer one top-level entity and build target per file | ADVISORY |
| `PB-DEFAULT-001` | Do not change a field default | BLOCKER |
| `PB-CARDINALITY-001` | Do not change repeated to scalar | BLOCKER |
| `PB-STYLE-001` | Keep generated identifiers valid for target languages | WARNING |
| `PB-FORMAT-001` | Do not use text format as an interchange format | BLOCKER |
| `PB-SERIAL-001` | Never depend on serialized byte stability | BLOCKER |
| `PB-JAVA-001` | Keep generated Java in a proto-only package | WARNING |
| `PB-JAVA-002` | Derive Java package overrides from the proto package | WARNING |
| `PB-NAME-001` | Avoid target-language keywords in symbols and paths | WARNING |
| `PB-BOUNDARY-001` | Use separate RPC/API and storage messages | WARNING |
| `PB-MODEL-001` | Use an enum when a two-state concept may grow | WARNING |
| `PB-JAVA-003` | Use filename-derived `java_outer_classname` before Edition 2024 | WARNING |

Escalate a WARNING to BLOCKER when the concrete change causes a generated-code
collision, parse failure, data loss, semantic reinterpretation, or unsafe
mixed-version rollout. Downgrade only with evidence tied to the actual schema,
formats, generated languages, and deployment plan.

### 3. Use expand-migrate-contract

When replacing a field or changing its meaning:

1. Add a new field with a new tag and the desired type or semantics.
2. Keep the old field readable; deprecate it when supported.
3. Deploy readers that understand both fields.
4. Deploy writers that populate the new field, using dual-write only when the
   migration requires it.
5. Migrate persisted data and verify rollback behavior.
6. Stop writing the old field after all readers are ready.
7. Remove the old field only when safe, then reserve its number and name.

Use the same staged reasoning for enum aliases: add the new alias last, deploy
parsers, swap alias order, deploy serializers, then remove and reserve the old
name when the compatibility surface allows it.

### 4. Keep transport and storage contracts separate

Do not reuse a long-lived storage message as an RPC request or response merely
to avoid mapping code. Storage and API contracts evolve under different
constraints. Keep translation at the boundary so either representation can
change without forcing the other to change in lockstep.

### 5. Verify with the repository's toolchain

Use tools already configured by the project. Do not invent or install a new
protobuf toolchain without approval.

- Compile every affected `.proto` target.
- Run the configured formatter and linter.
- Run descriptor or breaking-change checks against the repository's baseline
  when such checks are configured.
- Compile generated code for every affected target language.
- Run binary round-trip and mixed-version tests for compatibility-sensitive
  changes.
- Run ProtoJSON/text tests separately when those formats are real boundaries.
- Confirm deleted numbers and names are reserved.
- Confirm persistent data and rollback behavior are covered by the migration
  plan.

A successful `protoc` run proves syntax and code generation, not schema
compatibility.

## Review output

Report confirmed findings first, ordered by severity:

```text
[BLOCKER][PB-TAG-001] path/to/file.proto:42 - Tag 7 is reused for customer_id.
Why: Older payloads encode tag 7 as legacy_account_id and will be misread.
Fix: Restore/reserve tag 7 and assign customer_id a new unused tag.
Evidence: <old declaration, baseline descriptor, or migration context>
```

Then include:

- Assumptions or missing compatibility context.
- Verification performed and commands run.
- Residual risks, especially untested target languages or stored payloads.
- A migration sequence when the requested change cannot be safely done in one
  deployment.

For implementation requests, make the safe schema change and summarize it.
For review requests, do not rewrite code unless asked. If no findings exist,
state that explicitly and identify any unverified compatibility surfaces.

## References

- `references/rules.md` - complete definitions, rationale, detection guidance,
  fixes, examples, and edition/format caveats for all 23 rules.
- [Official Proto Best Practices](https://protobuf.dev/best-practices/dos-donts/)
  - primary source; prefer the current page over this snapshot when details
  conflict.
