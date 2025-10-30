# Engineering Standards

This document outlines the engineering standards for the Notion CLI project.

## Core Principles

### 1. Read Before Change

Always read the entire file before making any modifications. Never make changes without understanding the full context.

### 2. Small Changes

- Keep commits small and focused
- Keep PRs small and reviewable
- Break large tasks into smaller, independent pieces
- Each change should have a single, clear purpose

### 3. Document Assumptions

Record all assumptions in:

- Issue descriptions
- PR descriptions
- Architecture Decision Records (ADRs)
- Code comments (when necessary)

### 4. No Secrets

- Never commit API keys, tokens, or secrets
- Never log sensitive information
- Use environment variables for configuration
- Add sensitive patterns to .gitignore

### 5. Intention-Revealing Names

- Use clear, descriptive names for variables, functions, and files
- Names should reveal intent without needing comments
- Prefer longer, clear names over short, cryptic ones
- Follow consistent naming conventions

### 6. Compare Options

Before implementing:

- Identify at least 2 different approaches
- Document trade-offs of each approach
- Choose the simplest solution that works
- Record the decision and rationale

## Code Quality Standards

### File Size Limits

- **Maximum**: 300 lines of code per file
- Split large files into smaller, focused modules
- Each file should have a single, clear responsibility

### Function Size Limits

- **Maximum**: 50 lines of code per function
- Extract complex logic into helper functions
- Each function should do one thing well

### Parameter Limits

- **Maximum**: 5 parameters per function
- Use objects for functions with many parameters
- Consider builder patterns for complex construction

### Cyclomatic Complexity

- **Maximum**: 10
- Reduce complexity through:
  - Early returns
  - Guard clauses
  - Extracting helper functions
  - Replacing conditionals with polymorphism

## TypeScript Standards

### Type Safety

```typescript
// ✅ Good: Explicit types
function processData(data: UserData): ProcessedResult {
  // ...
}

// ❌ Bad: Any types
function processData(data: any): any {
  // ...
}
```

### Strict Mode

- Enable all strict type checking options
- No implicit any
- Strict null checks
- No unchecked indexed access

### Type Definitions

```typescript
// ✅ Good: Well-defined interfaces
interface Config {
  notionToken?: string
  defaultWorkspace?: string
}

// ❌ Bad: Loose types
type Config = Record<string, any>
```

## Testing Standards

### Test Coverage

- New code requires new tests
- Bug fixes need regression tests
- Minimum coverage per test type:
  - E2E: ≥1 happy path, ≥1 failure path
  - Unit: All public functions
  - Integration: All API interactions

### Test Structure (AAA Pattern)

```typescript
test('should create page with valid data', async () => {
  // Arrange
  const client = createNotionClient()
  const pageData = { title: 'Test', parent: 'abc123' }

  // Act
  const result = await client.pages.create(pageData)

  // Assert
  expect(result.id).toBeDefined()
  expect(result.title).toBe('Test')
})
```

### Test Doubles

- **Fakes**: Working implementations with shortcuts
- **Stubs**: Provide predetermined answers
- **Spies**: Record information about calls
- **Mocks**: Pre-programmed with expectations

## Error Handling

### Centralized Errors

```typescript
// ✅ Good: Centralized error handler
try {
  await notion.pages.create(data)
}
catch (error) {
  handleNotionError(error, 'Create page', { title: data.title })
}

// ❌ Bad: Inline error handling
try {
  await notion.pages.create(data)
}
catch (error) {
  console.error('Error:', error.message)
  process.exit(1)
}
```

### Helpful Error Messages

- Include context information
- Suggest recovery actions
- Never expose sensitive data
- Use consistent formatting

## Git Workflow

### Commit Messages

Follow Conventional Commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Branch Naming

```
feature/short-description
fix/issue-123
refactor/component-name
```

## Code Review Guidelines

### Before Requesting Review

- [ ] All tests pass
- [ ] Code follows standards
- [ ] Documentation updated
- [ ] No console.log or debug code
- [ ] No commented-out code

### As a Reviewer

- Focus on:
  - Logic errors
  - Security issues
  - Performance problems
  - Standard violations
- Be constructive and specific
- Ask questions, don't demand changes
- Approve when standards are met

## Performance Guidelines

### Efficiency

- Minimize API calls
- Cache when appropriate
- Use pagination for large datasets
- Avoid unnecessary computation

### Memory

- Clean up resources
- Avoid memory leaks
- Use streams for large data
- Monitor memory usage in tests

## Security Guidelines

### Authentication

- Store tokens securely
- Never log tokens
- Validate all inputs
- Use principle of least privilege

### Data Handling

- Sanitize user input
- Validate API responses
- Handle errors gracefully
- Never expose internal errors to users

## Documentation Standards

### Code Comments

Only when necessary:

- Why, not what
- Complex algorithms
- Non-obvious behavior
- Temporary workarounds (with TODO)

### README

- Clear installation instructions
- Usage examples
- Troubleshooting section
- Contributing guidelines

### API Documentation

- All public functions documented
- Parameters described
- Return values explained
- Examples provided

## YAGNI (You Aren't Gonna Need It)

- Build what's needed now
- Don't over-engineer
- Add complexity only when required
- Refactor when patterns emerge

## DRY (Don't Repeat Yourself)

- Extract common logic
- Create reusable utilities
- Share code across projects (cli-toolkit)
- But: Don't abstract too early

## Summary

Follow these standards to maintain:

- **Quality**: High code quality
- **Consistency**: Predictable codebase
- **Maintainability**: Easy to modify
- **Collaboration**: Smooth team work
- **Security**: Secure by default
