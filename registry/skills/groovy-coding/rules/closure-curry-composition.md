# closure-curry-composition

> Use `.curry()` and `.rcurry()` for partial application

## Why It Matters

Currying creates specialized versions of closures with some arguments pre-filled, reducing duplication and making code more declarative. Instead of wrapping closures in new closures to fix arguments, use `.curry()` (left to right) or `.rcurry()` (right to left) for clean partial application.

## Bad

```groovy
def sendEmail = { from, to, subject, body ->
    println "From: $from, To: $to, Subject: $subject"
}

def users = ['alice@example.com', 'bob@example.com']
users.each { email ->
    sendEmail('noreply@company.com', email, 'Welcome', 'Hello!')
}

def formatCurrency = { currency, amount ->
    "$currency $amount"
}

// Wrapping closure to fix an argument
def formatUsd = { amount -> formatCurrency('USD', amount) }
def formatEur = { amount -> formatCurrency('EUR', amount) }
```

## Good

```groovy
def sendEmail = { from, to, subject, body ->
    println "From: $from, To: $to, Subject: $subject"
}

def sendWelcome = sendEmail.curry('noreply@company.com')
def users = ['alice@example.com', 'bob@example.com']
users.each { email ->
    sendWelcome(email, 'Welcome', 'Hello!')
}

def formatCurrency = { currency, amount ->
    "$currency $amount"
}

def formatUsd = formatCurrency.curry('USD')
def formatEur = formatCurrency.curry('EUR')

assert formatUsd(100) == 'USD 100'
assert formatEur(50) == 'EUR 50'
```

## rcurry for Rightmost Arguments

```groovy
def divide = { a, b -> a / b }

def half = divide.rcurry(2)    // Fix second argument
assert half(10) == 5.0

def reciprocal = divide.curry(1)  // Fix first argument
assert reciprocal(4) == 0.25
```

## See Also

- [closure-compose-pipe](closure-compose-pipe.md) - Use << and >> for composition
- [closure-memoize](closure-memoize.md) - Use memoize for repeated results
- [closure-trampoline](closure-trampoline.md) - Use trampoline for tail recursion
