# ui-view-small-composable

> Keep views small and composable; extract subviews

## Why It Matters

A `body` that grows to encompass an entire screen's worth of layout becomes hard to read, hard to preview in isolation, and forces SwiftUI to re-diff the entire tree whenever any single piece of state inside it changes. Extracting each logical section into its own small `View` gives each piece an independent identity, its own `#Preview`, and lets SwiftUI's diffing skip unaffected subviews when only one part of the state updates.

## Bad

```swift
struct ProfileScreen: View {
    let user: User

    var body: some View {
        VStack {
            HStack {
                AsyncImage(url: user.avatarURL) { image in
                    image.resizable().clipShape(Circle())
                } placeholder: {
                    Circle().fill(.gray)
                }
                .frame(width: 60, height: 60)
                VStack(alignment: .leading) {
                    Text(user.name).font(.headline)
                    Text(user.bio).font(.subheadline)
                }
            }
            Divider()
            ForEach(user.posts) { post in
                HStack {
                    Text(post.title)
                    Spacer()
                    Text(post.date, style: .date)
                }
            }
            // one giant body mixing avatar, bio, and post list layout together
        }
    }
}
```

## Good

```swift
struct ProfileScreen: View {
    let user: User

    var body: some View {
        VStack {
            ProfileHeader(user: user)
            Divider()
            PostList(posts: user.posts)
        }
    }
}

struct ProfileHeader: View {
    let user: User

    var body: some View {
        HStack {
            AvatarView(url: user.avatarURL)
            VStack(alignment: .leading) {
                Text(user.name).font(.headline)
                Text(user.bio).font(.subheadline)
            }
        }
    }
}

struct PostList: View {
    let posts: [Post]

    var body: some View {
        ForEach(posts) { post in
            PostRow(post: post)
        }
    }
}
```

## When One `body` Is Still Appropriate

Small, tightly coupled layout (a single row's icon + label + chevron) doesn't need extraction just for the sake of it — split when a section has its own meaningful identity, reusable shape, or independent state, not purely by line count.

## See Also

- [`ui-avoid-massive-view`](ui-avoid-massive-view.md) - the failure mode this rule prevents
- [`ui-identifiable-list-data`](ui-identifiable-list-data.md) - `ForEach`-friendly data for extracted list subviews
- [`ui-preview-provider`](ui-preview-provider.md) - previewing each extracted subview independently
