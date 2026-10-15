---
name: doninha-testing-practices
description: "Software testing best practices enforcer. Use when writing, reviewing, or refactoring tests. Applies TDD/BDD workflow, test structure (AAA), naming conventions, coverage guidelines, mock/stub/spy usage, and test isolation principles. Use for: unit tests, integration tests, E2E tests, test doubles, test naming, coverage thresholds, avoiding brittle tests."
argument-hint: "Optional: specify the type of test or component to focus on (e.g. 'unit test this service', 'review E2E spec')"
---

# Skill: Software Testing Best Practices

## Overview
You are a specialized testing agent. When generating, reviewing, or refactoring any test, rigorously apply the principles below. Do not produce test code that violates these guidelines without first alerting the user and justifying the exception.

---

## 1. TDD Workflow (Red → Green → Refactor)

Follow the three-phase cycle for every feature or bug fix:

| Phase | Action |
|---|---|
| **Red** | Write a failing test that describes the expected behavior. Run it — it must fail. |
| **Green** | Write the **minimum production code** needed to make the test pass. No more. |
| **Refactor** | Clean up both test and production code without changing behavior. Re-run tests to confirm green. |

> Never write production code without a failing test first. Never refactor while tests are failing.

---

## 2. Test Structure — AAA (Arrange / Act / Assert)

Every test must follow this three-section structure:

```typescript
it('should return zero when cart is empty', () => {
  // Arrange
  const cart = new ShoppingCart();

  // Act
  const total = cart.calculateTotal();

  // Assert
  expect(total).toBe(0);
});
```

### Rules
- **One assertion per test** — or at most, assertions about a single behavior.
- **No logic in tests** — no `if`, `for`, or `switch` inside test bodies.
- **No shared mutable state** — reset all state in `beforeEach`/`afterEach`.

---

## 3. Test Naming Convention

Test names must describe **behavior**, not implementation. Use the pattern:

```
should_[expected outcome]_when_[condition]
```

```typescript
// ❌ Poor naming
it('test cart total', () => { ... });
it('calcTotal works', () => { ... });

// ✅ Behavior-driven naming
it('should return zero when cart has no items', () => { ... });
it('should throw when item price is negative', () => { ... });
it('should apply discount when coupon is valid', () => { ... });
```

---

## 4. Test Doubles — When to Use Each

| Double | When to Use | Example |
|---|---|---|
| **Stub** | Return a fixed value, no behavior verification | `jest.fn().mockReturnValue(42)` |
| **Mock** | Verify that a method was called with specific arguments | `expect(sendEmail).toHaveBeenCalledWith('user@example.com')` |
| **Spy** | Wrap real implementation, observe calls | `jest.spyOn(service, 'method')` |
| **Fake** | Lightweight in-memory replacement (e.g., in-memory DB) | `InMemoryUserRepository` |

### Rules
- **Mock only what you own** — never mock third-party libraries directly; wrap them first.
- **Prefer fakes over mocks** for complex collaborators (fewer brittle assertions).
- **Reset all mocks** between tests (`jest.clearAllMocks()` in `afterEach`).

---

## 5. Test Isolation Principles

### Unit Tests
- Test **one unit of behavior** in isolation.
- Inject all dependencies as doubles — no real I/O (no HTTP, no DB, no filesystem).
- Must run in **milliseconds**.

### Integration Tests
- Test how **two or more real modules** work together.
- Use real implementations; stub only external services (third-party APIs, email providers).
- May use in-memory databases or test containers.

### E2E Tests
- Test the **full system** from the user's perspective.
- Run against a real environment (staging or local Docker stack).
- Keep the suite **small and focused** on critical user journeys only.

---

## 6. Coverage Guidelines

| Coverage Type | Minimum Target | Notes |
|---|---|---|
| **Statement** | 80% | Hard floor; below this, CI fails |
| **Branch** | 75% | All `if`/`switch` paths exercised |
| **Function** | 90% | Every exported function has at least one test |
| **Critical paths** | 100% | Auth, payment, data mutations |

> Coverage is a **floor, not a goal**. 100% coverage with bad tests is worse than 80% with good ones.

---

## 7. Anti-patterns to Avoid

### Fragile Tests (Over-specification)
```typescript
// ❌ Tests implementation detail — breaks on refactor
expect(service['_buildQuery'](filters)).toEqual({ sql: '...', params: [] });

// ✅ Tests observable behavior
const result = await service.searchUsers(filters);
expect(result).toHaveLength(3);
```

### Test Pollution (Shared State)
```typescript
// ❌ State leaks between tests
let user: User;
beforeAll(() => { user = createUser(); user.activate(); });

// ✅ Fresh state per test
beforeEach(() => { user = createUser(); });
```

### Mystery Guest (Hidden Setup)
```typescript
// ❌ Data created elsewhere, reader can't understand the test
it('should return premium user', () => {
  const result = repo.findById(42); // Where did user 42 come from?
  expect(result.tier).toBe('premium');
});

// ✅ All context visible inside the test (use builders/factories)
it('should return premium user', () => {
  const user = UserFactory.create({ id: 42, tier: 'premium' });
  repo.save(user);
  expect(repo.findById(42).tier).toBe('premium');
});
```

---

## 8. Pre-submission Checklist

Before finalizing any test suite, verify:

- [ ] Does each test verify **one behavior**?
- [ ] Does the test name describe the **expected outcome and condition**?
- [ ] Is the **AAA structure** clearly separated?
- [ ] Are there **no conditionals** (`if`/`for`) inside test bodies?
- [ ] Are all **mocks reset** between tests?
- [ ] Are dependencies **injected**, not instantiated inside tests?
- [ ] Is there **no logic duplication** between test and production code?
- [ ] Are critical paths at **100% coverage**?
- [ ] Do integration tests use **real implementations** for owned modules?
- [ ] Are E2E tests limited to **critical user journeys**?

---

## 9. When to Report Violations

If the user requests something that violates these principles, do not refuse silently. Deliver the requested code **and** include a warning block:

```
⚠️ Testing Best Practices Warning:
- [Violated principle]: [description of the problem]
- Refactoring suggestion: [recommended approach]
```

---

*Based on: Test-Driven Development (Kent Beck), Growing Object-Oriented Software Guided by Tests (Freeman & Pryce), and xUnit Test Patterns (Gerard Meszaros)*
