# test-protocol-mock-injection

> Inject dependencies via protocols to enable mocking

## Why It Matters

A type that hard-codes a concrete dependency (a real network client, a singleton database) can only be tested by exercising that real dependency, which is slow, flaky, and often impossible in CI. Defining a narrow protocol for the dependency and injecting it lets tests substitute a lightweight fake, isolating the unit under test and making failures deterministic.

## Bad

```swift
final class UserProfileViewModel {
    private let client = URLSession.shared // hard-coded, untestable without real network

    func loadProfile(id: String) async throws -> Profile {
        let (data, _) = try await client.data(from: URL(string: "https://api.example.com/users/\(id)")!)
        return try JSONDecoder().decode(Profile.self, from: data)
    }
}
```

## Good

```swift
protocol ProfileFetching {
    func fetchProfile(id: String) async throws -> Profile
}

struct APIProfileFetcher: ProfileFetching {
    let session: URLSession = .shared

    func fetchProfile(id: String) async throws -> Profile {
        let (data, _) = try await session.data(from: URL(string: "https://api.example.com/users/\(id)")!)
        return try JSONDecoder().decode(Profile.self, from: data)
    }
}

final class UserProfileViewModel {
    private let fetcher: ProfileFetching

    init(fetcher: ProfileFetching = APIProfileFetcher()) {
        self.fetcher = fetcher
    }

    func loadProfile(id: String) async throws -> Profile {
        try await fetcher.fetchProfile(id: id)
    }
}
```

## Test Double

```swift
import Testing

struct MockProfileFetcher: ProfileFetching {
    var result: Result<Profile, Error>

    func fetchProfile(id: String) async throws -> Profile {
        try result.get()
    }
}

struct UserProfileViewModelTests {
    @Test
    func loadProfileReturnsFetchedProfile() async throws {
        let expected = Profile(id: "42", name: "Ada Lovelace")
        let viewModel = UserProfileViewModel(fetcher: MockProfileFetcher(result: .success(expected)))

        let profile = try await viewModel.loadProfile(id: "42")

        #expect(profile == expected)
    }

    @Test
    func loadProfilePropagatesFetchError() async {
        let viewModel = UserProfileViewModel(fetcher: MockProfileFetcher(result: .failure(URLError(.notConnectedToInternet))))

        await #expect(throws: URLError.self) {
            try await viewModel.loadProfile(id: "42")
        }
    }
}
```

## See Also

- [`api-protocol-oriented`](api-protocol-oriented.md) - Designing around protocols
- [`test-arrange-act-assert-swift`](test-arrange-act-assert-swift.md) - Structuring the test body
- [`api-existential-any`](api-existential-any.md) - Storing protocol-typed dependencies
