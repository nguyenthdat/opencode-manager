# anti-lateinit-overuse

> Don't use `lateinit var` as a substitute for proper initialization/DI

## Why It Matters

`lateinit` disables the compiler's null-safety guarantee for that property in exchange for a promise that you'll initialize it before use — break that promise (wrong lifecycle timing, a reordered call, a skipped setup step) and you get an `UninitializedPropertyAccessException` at runtime with a message that only says the property name, not why it's still uninitialized. Using it to route around constructor injection or to defer setting a value that's actually known at construction time trades a compile-time guarantee for a runtime crash.

## Bad

```kotlin
class ReportGenerator {
    lateinit var config: ReportConfig // "I'll set it later" - by convention, not compiler-enforced

    fun generate(): Report {
        // Crashes if configure() wasn't called first, with no context
        return buildReport(config)
    }

    fun configure(config: ReportConfig) {
        this.config = config
    }
}

val generator = ReportGenerator()
generator.generate() // UninitializedPropertyAccessException, easy to trigger by accident
```

## Good

```kotlin
class ReportGenerator(private val config: ReportConfig) {
    // Compiler guarantees config exists before any method can run
    fun generate(): Report = buildReport(config)
}

val generator = ReportGenerator(config = loadConfig())
generator.generate() // can't be called in an invalid state
```

## When It's Still Sometimes Seen

```kotlin
// Android/JUnit lifecycle: the framework, not you, controls construction
// timing, and the property is guaranteed set before use by the framework
class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding // set in onCreate, framework-guaranteed order

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
    }
}

@ExtendWith(MockKExtension::class)
class ServiceTest {
    @MockK lateinit var repository: Repository // set by the test framework in @BeforeEach
}
```

This is acceptable specifically because a well-understood framework lifecycle enforces the initialization order — not because manual initialization is inconvenient.

## See Also

- [`type-lateinit-discipline`](type-lateinit-discipline.md) - the positive-framed rule for the narrow cases where `lateinit` is appropriate
- [`anti-not-null-assert-abuse`](anti-not-null-assert-abuse.md) - another shortcut around Kotlin's null-safety guarantees
- [`android-savedstatehandle-viewmodel`](android-savedstatehandle-viewmodel.md) - proper state initialization in the Android lifecycle this rule's exception references
