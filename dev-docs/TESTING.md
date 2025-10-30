# Testing Guide

This document describes the testing approach for the Notion CLI project.

## Testing Philosophy

### Test-Driven Development (TDD)

We follow the Red-Green-Refactor cycle:

1. **Red**: Write a failing test
2. **Green**: Make the test pass with minimal code
3. **Refactor**: Improve code while keeping tests green

### Testing Pyramid

```
        /\
       /  \
      / E2E \      Few - Slow - Expensive
     /______\
    /        \
   / Integration\   Some - Medium - Moderate
  /____________\
 /              \
/     Unit       \  Many - Fast - Cheap
/________________\
```

## Test Types

### Unit Tests

Test individual functions and modules in isolation.

**Location**: `test/lib/`, `test/utils/`

**Example**:

```typescript
test('encodeToon should format data in TOON format', () => {
  // Arrange
  const data = { name: 'Test', count: 42 }

  // Act
  const result = encodeToon(data)

  // Assert
  expect(result).toContain('name')
  expect(result).toContain('Test')
  expect(result).toContain('42')
})
```

### Integration Tests

Test interactions between components.

**Location**: `test/commands/`

**Example**:

```typescript
test('auth login should save valid token', async () => {
  // Arrange
  const mockClient = createMockNotionClient()
  const token = 'secret_test_token'

  // Act
  await loginCommand(token, mockClient)

  // Assert
  const config = loadConfig()
  expect(config?.notionToken).toBe(token)
})
```

### End-to-End Tests

Test complete user workflows.

**Location**: `test/e2e/`

**Example**:

```typescript
test('should create and retrieve page', async () => {
  // Arrange
  const title = 'Test Page'
  const parentId = 'parent123'

  // Act - Create page
  const created = await createPage({ title, parent: parentId })

  // Act - Retrieve page
  const retrieved = await getPage(created.id)

  // Assert
  expect(retrieved.title).toBe(title)
  expect(retrieved.id).toBe(created.id)
})
```

## Test Structure (AAA Pattern)

### Arrange-Act-Assert

```typescript
test('description of what we are testing', () => {
  // Arrange: Set up test data and conditions
  const input = prepareTestData()

  // Act: Execute the code being tested
  const result = functionUnderTest(input)

  // Assert: Verify the result
  expect(result).toBe(expectedValue)
})
```

## Test Doubles

### When to Use Each Type

#### Fakes

Real implementation with shortcuts (e.g., in-memory database).

```typescript
class FakeNotionClient {
  private pages = new Map()

  async create(data: any) {
    const id = generateId()
    this.pages.set(id, data)
    return { id, ...data }
  }

  async retrieve(id: string) {
    return this.pages.get(id)
  }
}
```

#### Stubs

Provide predetermined answers.

```typescript
class StubNotionClient {
  async retrieve(id: string) {
    return {
      id,
      title: 'Test Page',
      created_time: '2024-01-01',
    }
  }
}
```

#### Spies

Record information about calls.

```typescript
class SpyNotionClient {
  calls: any[] = []

  async create(data: any) {
    this.calls.push({ method: 'create', data })
    return { id: 'test123', ...data }
  }
}
```

#### Mocks

Pre-programmed with expectations.

```typescript
const mockClient = {
  pages: {
    create: jest.fn().mockResolvedValue({ id: 'test123' }),
  },
}
```

## Running Tests

### All Tests

```bash
bun test
```

### Watch Mode

```bash
bun test --watch
```

### Coverage

```bash
bun test --coverage
```

### Specific File

```bash
bun test test/lib/config.test.ts
```

## Test Organization

### File Structure

```
test/
├── commands/           # Command tests
│   ├── auth.test.ts
│   ├── page.test.ts
│   └── database.test.ts
├── lib/                # Library tests
│   ├── config.test.ts
│   ├── notion-client.test.ts
│   └── error-handler.test.ts
├── utils/              # Utility tests
│   └── formatter.test.ts
├── helpers/            # Test helpers
│   └── mocks.ts
├── fixtures/           # Test data
│   └── sample-page.json
└── e2e/                # End-to-end tests
    └── workflows.test.ts
```

### Naming Conventions

- Test files: `*.test.ts`
- Test suites: `describe('Component name', ...)`
- Test cases: `test('should do something', ...)`

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ✅ Good: Tests behavior
test('should return formatted page title', () => {
  const page = { properties: { title: { title: [{ plain_text: 'Test' }] } } }
  expect(extractTitle(page)).toBe('Test')
})

// ❌ Bad: Tests implementation details
test('should access properties.title.title[0].plain_text', () => {
  const page = { properties: { title: { title: [{ plain_text: 'Test' }] } } }
  expect(page.properties.title.title[0].plain_text).toBeDefined()
})
```

### 2. One Assertion Per Test (When Possible)

```typescript
// ✅ Good: Single assertion
test('should return token when authenticated', () => {
  saveConfig({ notionToken: 'test_token' })
  expect(requireAuth()).toBe('test_token')
})

// ⚠️ Acceptable: Related assertions
test('should format output correctly', () => {
  const result = formatOutput(data, { format: 'json' })
  expect(result).toContain('"test"')
  expect(result).toContain('"value"')
})
```

### 3. Use Descriptive Test Names

```typescript
// ✅ Good: Clear description
test('should throw error when token is missing', () => {
  // test implementation
})

// ❌ Bad: Vague description
test('handles error', () => {
  // test implementation
})
```

### 4. Clean Up After Tests

```typescript
import { afterEach } from 'bun:test'

afterEach(() => {
  // Clean up test data
  deleteConfig()
  clearCache()
})
```

### 5. Avoid Test Dependencies

```typescript
// ✅ Good: Independent tests
test('test 1', () => {
  const data = setupTestData()
  // ...
})

test('test 2', () => {
  const data = setupTestData()
  // ...
})

// ❌ Bad: Dependent tests
let sharedData: any

test('test 1', () => {
  sharedData = createData()
  // ...
})

test('test 2', () => {
  // Depends on test 1
  expect(sharedData).toBeDefined()
})
```

## Testing Async Code

### Promises

```typescript
test('should resolve with data', async () => {
  const result = await fetchData()
  expect(result).toBeDefined()
})
```

### Error Cases

```typescript
test('should reject with error', async () => {
  await expect(invalidOperation()).rejects.toThrow('Error message')
})
```

## Testing Error Handling

### Expected Errors

```typescript
test('should throw when not authenticated', () => {
  expect(() => requireAuth()).toThrow('Not authenticated')
})
```

### Error Messages

```typescript
test('should provide helpful error message', () => {
  try {
    requireAuth()
  }
  catch (error: any) {
    expect(error.message).toContain('Run "notion auth login"')
  }
})
```

## Mocking External Dependencies

### Notion API

```typescript
const mockNotionClient = {
  pages: {
    create: async (data: any) => ({ id: 'test123', ...data }),
    retrieve: async (id: string) => ({ id, title: 'Test' }),
  },
}
```

### File System

```typescript
import * as fs from 'node:fs'

// Use real fs for config tests (with cleanup)
afterEach(() => {
  if (fs.existsSync(testConfigPath)) {
    fs.unlinkSync(testConfigPath)
  }
})
```

## Coverage Goals

### Minimum Coverage

- **Unit Tests**: 80% coverage
- **Integration Tests**: Key workflows covered
- **E2E Tests**: ≥1 happy path, ≥1 failure path

### Focus Areas

1. Business logic
2. Error handling
3. Edge cases
4. Security-critical code

### Acceptable Exclusions

- Type definitions
- Simple getters/setters
- Framework boilerplate

## Continuous Integration

### Pre-commit

```bash
# Run tests before commit
bun test
```

### CI Pipeline

```yaml
- name: Test
  run: |
    bun install
    bun test --coverage
    bun run type-check
    bun run lint
```

## Debugging Tests

### Print Output

```typescript
test('debug test', () => {
  const result = someFunction()
  console.log('Result:', result) // Visible in test output
  expect(result).toBeDefined()
})
```

### Run Single Test

```bash
bun test -t "specific test name"
```

### Debug Mode

```bash
DEBUG=1 bun test
```

## Test Maintenance

### Keep Tests Updated

- Update tests when code changes
- Remove obsolete tests
- Refactor tests like production code

### Review Test Failures

- Don't ignore failing tests
- Fix or remove broken tests
- Investigate flaky tests

## Summary

Good tests are:

- **Fast**: Run quickly
- **Independent**: Don't depend on other tests
- **Repeatable**: Same result every time
- **Self-validating**: Pass or fail clearly
- **Timely**: Written with or before code

Follow these guidelines to maintain a reliable test suite.
