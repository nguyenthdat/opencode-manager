# name-error-set-members

> Name error set members descriptively, in `TitleCase`, reflecting the specific failure reason

## Why It Matters

Since an error carries no payload (`err-error-payload`), its name is the *only* information a caller gets — a vague `error.Failed` or `error.Bad` tells them nothing actionable, while `error.ConnectionTimedOut` or `error.InvalidUtf8Sequence` tells them exactly what went wrong and hints at what to do next (retry, reject the input, log and alert).

## Bad

```zig
const std = @import("std");

const ParseError = error{
    Bad,     // bad how? syntax? encoding? range?
    Failed,  // failed at what step?
    Error1,  // meaningless
};
```

## Good

```zig
const std = @import("std");

const ParseError = error{
    InvalidUtf8Sequence,
    UnexpectedEndOfInput,
    NumberOutOfRange,
    DuplicateKey,
};

fn describe(err: ParseError) []const u8 {
    return switch (err) {
        error.InvalidUtf8Sequence => "input contained invalid UTF-8",
        error.UnexpectedEndOfInput => "input ended before a value was complete",
        error.NumberOutOfRange => "a numeric value exceeded the representable range",
        error.DuplicateKey => "a key appeared more than once",
    };
}
```

## Error Names Read Naturally After `error.`

A useful test: read the name out loud after `error.` — `error.ConnectionRefused` reads clearly; `error.Bad` or `error.Invalid` (with no noun) does not say invalid *what*.

## See Also

- [err-error-set-explicit](err-error-set-explicit.md) - defining the sets whose members this rule names
- [err-error-payload](err-error-payload.md) - why the name alone has to carry the meaning
- [doc-error-set-document](doc-error-set-document.md) - documenting exactly when each named error is returned
