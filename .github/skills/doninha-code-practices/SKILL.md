---
name: doninha-code-practices
description: "Software development best practices enforcer. Use when generating, reviewing, or refactoring code. Applies SOLID principles, Object Calisthenics (9 rules), and Clean Code standards. Use for: code review, refactoring, naming conventions, dependency injection, avoiding primitive obsession, early return patterns, clean architecture."
argument-hint: "Optional: specify a language or component to focus on (e.g. 'review this class', 'refactor service layer')"
---

# Skill: Software Development Best Practices

## Overview
You are a specialized code agent. When generating, reviewing, or refactoring any code, rigorously apply the principles below. Do not produce code that violates these guidelines without first alerting the user and justifying the exception.

---

## 1. SOLID

Apply the five principles to every class/module/function you create:

| Principle | Practical Rule |
|---|---|
| **S** – Single Responsibility | Each class/function has **one single reason to change**. If you need to use "and" to describe what it does, split it. |
| **O** – Open/Closed | Open for extension, closed for modification. Prefer inheritance, composition, or strategies over modifying existing code. |
| **L** – Liskov Substitution | Subclasses must be substitutable for their superclass without breaking behavior. Do not throw unexpected exceptions or weaken contracts. |
| **I** – Interface Segregation | Small, specific interfaces are better than a single general one. Clients should not depend on methods they do not use. |
| **D** – Dependency Inversion | Depend on abstractions, not concrete implementations. Inject dependencies instead of instantiating them internally. |

---

## 2. Object Calisthenics (9 Rules)

Apply the rules below when writing object-oriented code. These are design exercises, not absolute laws — document whenever an exception is necessary.

### Rule 1 – Only one level of indentation per method
Use **Guardianship Clause + Fail-Fast + Early Return** to flatten the structure:
```java
// ❌ Wrong
if (valid) {
    if (age >= 18) {
        // main logic
    }
}

// ✅ Correct
if (!valid) throw new IllegalArgumentException("Invalid");
if (age < 18) throw new IllegalArgumentException("Underage");
// main logic here
```

### Rule 2 – Do not use `else`
If you used `if` with a return/exception, the `else` is redundant. Prefer Early Return.

### Rule 3 – Wrap primitives and Strings in objects (avoid Primitive Obsession)
Types with domain-specific behavior deserve their own class:
```java
// ❌ Raw string scattered around
String email = "user@example.com";

// ✅ Object with encapsulated validation
class Email {
    private final String value;
    public Email(String value) {
        if (!value.contains("@")) throw new IllegalArgumentException("Invalid email");
        this.value = value;
    }
}
```

### Rule 4 – First Class Collections
Every collection deserves its own class with the associated behaviors:
```java
// ❌ Loose list inside the main class
List<Order> orders;

// ✅ Dedicated class
class Orders {
    private final List<Order> values;
    public Orders filterByStatus(Status s) { ... }
    public Money totalRevenue() { ... }
}
```

### Rule 5 – One dot per line (Law of Demeter)
Do not chain accesses that expose internal structure. Create intentional methods:
```java
// ❌ Exposes internal structure
employee.getDepartment().getManager().getName()

// ✅ Clear intent
employee.getManagerName()
```

### Rule 6 – Do not abbreviate
Use complete, descriptive names. `usrNm` → `userName`. `calc()` → `calculateTotalPrice()`. Clarity beats brevity.

### Rule 7 – Keep all entities small
Classes with at most ~150 lines, methods with at most ~20 lines. If it keeps growing, it needs to be split.

### Rule 8 – No more than 2 instance variables per class
Many attributes = many responsibilities. Group cohesive attributes into Value Objects:
```java
// ❌ Class with 4 attributes
class Employee { Name name; Age age; Role role; Department dept; }

// ✅ Cohesive composition
class Employee {
    PersonalInfo personal;  // name + age
    JobInfo job;            // role + department
}
```

### Rule 9 – No generic getters/setters
Expose **behaviors**, not data. Prefer methods with business intent:
```java
// ❌ Generic setter
employee.setRole("manager");

// ✅ Domain action
employee.promoteToManager();
```

---

## 3. Clean Code

Apply these practices to ensure code is readable, maintainable, and honest in its intent:

### Explicit and descriptive naming
- **Functions**: action verb + noun + scope. Ex: `fetchUserOrdersByDateRange`, `validateCreditCardExpiry`
- **Boolean variables**: prefix with `is`, `has`, `can`, `should`. Ex: `isUserAuthenticated`, `hasOpenBalance`
- **Constants**: ALL_CAPS with context. Ex: `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT_SECONDS`

### Intent-oriented comments (not mechanism-oriented)
```python
# ❌ Describes what the code already shows
# increment counter
count += 1

# ✅ Explains the WHY
# Rate limiting: maximum 3 attempts before blocking the IP
count += 1
```

### Functions with single responsibility and honest signatures
A function must do **exactly what its name says**, with no hidden side effects. If it does more than one thing, split it.

### Consistent file structure
Maintain a predictable order within files: imports → constants → types/interfaces → private helper functions → public main functions.

### Avoid magic numbers and strings
Extract literal values into named constants:
```python
# ❌
if status == 3:
    ...

# ✅
ORDER_STATUS_SHIPPED = 3
if status == ORDER_STATUS_SHIPPED:
    ...
```

### Tests as living documentation
Write tests with names that describe the expected behavior:
```
test_should_throw_when_order_total_exceeds_credit_limit()
test_should_return_empty_list_when_no_active_users_exist()
```

---

## 4. Pre-submission Checklist

Before finalizing any block of code, verify:

- [ ] Does each function/method do **one single thing**?
- [ ] Is there no unnecessary `else` (use early return)?
- [ ] Are primitives with domain behavior encapsulated?
- [ ] Is there no dot-chaining that exposes internal structure?
- [ ] Are names self-explanatory, with no abbreviations?
- [ ] Does the class have at most 2 cohesive responsibilities?
- [ ] Are dependencies injected (not instantiated internally)?
- [ ] Do comments explain the **why**, not the **what**?
- [ ] Are there no magic numbers/strings in the code?
- [ ] Do tests describe the **expected behavior**?

---

## 5. When to Report Violations

If the user requests something that violates these principles, do not refuse silently. Deliver the requested code **and** include a warning block:

```
⚠️ Best Practices Warning:
- [Violated principle]: [description of the problem]
- Refactoring suggestion: [recommended approach]
```

---

*Based on: Object Calisthenics (Jeff Bay / ThoughtWorks Anthology), SOLID (Robert C. Martin), and Clean Code (Robert C. Martin)*
