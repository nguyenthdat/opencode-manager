# android-parcelize-data-class

> Use `@Parcelize` on data classes crossing Android IPC boundaries

## Why It Matters

Passing objects between Activities/Fragments (via `Intent` extras or `Bundle`) or across process/IPC boundaries requires implementing `Parcelable`. Hand-written `writeToParcel`/`createFromParcel` boilerplate is error-prone — wrong field order or a field missed after a refactor silently corrupts data — while `@Parcelize` generates correct, maintained code from the primary constructor.

## Bad

```kotlin
data class UserProfile(val id: String, val name: String, val age: Int) : Parcelable {
    constructor(parcel: Parcel) : this(
        parcel.readString()!!,
        parcel.readString()!!,
        parcel.readInt(),
    )

    override fun writeToParcel(parcel: Parcel, flags: Int) {
        parcel.writeString(id)
        parcel.writeString(name)
        // BUG: forgot to write `age` - silently corrupts data on reconstruction
    }

    override fun describeContents(): Int = 0

    companion object CREATOR : Parcelable.Creator<UserProfile> {
        override fun createFromParcel(parcel: Parcel) = UserProfile(parcel)
        override fun newArray(size: Int): Array<UserProfile?> = arrayOfNulls(size)
    }
}
```

## Good

```kotlin
import kotlinx.parcelize.Parcelize

@Parcelize
data class UserProfile(val id: String, val name: String, val age: Int) : Parcelable
// all fields correctly serialized, regenerated automatically as the class evolves
```

## Custom Fields

```kotlin
@Parcelize
data class Session(
    val token: String,
    @IgnoredOnParcel val transientCache: MutableMap<String, Any> = mutableMapOf(), // excluded from parceling
) : Parcelable
```

## See Also

- [`type-data-class-value`](type-data-class-value.md) - data class conventions this relies on
- [`android-savedstatehandle-viewmodel`](android-savedstatehandle-viewmodel.md) - another form of Android state persistence
- [`name-classes-pascal`](name-classes-pascal.md) - naming convention for the data classes being parcelized
