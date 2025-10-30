# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Notion CLI built with Bun, TypeScript, and Commander.js. It's designed for both human users and LLM consumption with TOON (Token-Oriented Object Notation) as the default output format for 58.9% token efficiency vs JSON.

The CLI follows patterns from reference projects: gh-please, asana, and cli-toolkit.

## Development Commands

### Core Workflow

```bash
# Install dependencies
bun install

# Development mode (hot reload)
bun run dev <command>
# Example: bun run dev page list --format json

# Build standalone executable
bun run build
# Output: dist/notion

# Run tests
bun test                 # All tests
bun test --watch         # Watch mode
bun test --coverage      # With coverage
bun test test/lib/config.test.ts  # Single file

# Type checking
bun run type-check       # Must pass before commit

# Linting
bun run lint
bun run lint:fix
```

### Testing Strategy

Tests follow AAA pattern (Arrange-Act-Assert). Config tests backup/restore real `~/.notion-cli/config.json` to avoid interfering with actual user config.

## Architecture

### Command Registration Pattern

Commands are hierarchical using Commander.js factory functions:

```typescript
// src/index.ts - Main entry point
program
  .option('-f, --format <type>', 'Output format', 'toon')
  .addCommand(createAuthCommand())
  .addCommand(createPageCommand())
  .addCommand(createDatabaseCommand())

// Each command file exports a factory function
export function createPageCommand(): Command {
  const page = new Command('page')
  page.command('list').action(async (options, command) => {
    const format = getFormat(command) // Get from parent
    // ... implementation
  })
  return page
}
```

**Key Pattern**: Output format is passed as global flag on root `program` and extracted in commands via `command.parent?.parent?.opts()?.format`.

### Output Formatting System

Three output formats are supported via `src/utils/formatter.ts`:

1. **TOON (default)**: Uses `@byjohann/toon` with **tab delimiters** (not comma)
   - 58.9% token reduction vs JSON
   - Tab is configured via `delimiter: '\t'` option
   - Critical for LLM efficiency

2. **JSON**: Standard JSON with pretty printing
   - For scripting and automation
   - 2-space indentation

3. **Plain**: Human-readable text
   - Recursive formatting for nested objects
   - Colon-separated key-value pairs

**Usage in commands:**

```typescript
const format = getFormat(command) // 'toon' | 'json' | 'plain'
output(resultData, format)
```

### Configuration Management

Config stored in `~/.notion-cli/config.json`:

- **Never** log or expose `notionToken`
- Use `requireAuth()` to get token (throws if missing)
- Use `loadConfig()` for optional access
- Use `saveConfig()` and `deleteConfig()` for mutations

### Error Handling

Centralized via `src/lib/error-handler.ts`:

```typescript
try {
  const result = await notion.pages.create(data)
}
catch (error) {
  handleNotionError(error, 'Create page', {
    title: data.title,
    parent: data.parent
  })
}
```

**Never** inline error handling - always use `handleNotionError()` with:

1. Operation name (e.g., "Create page")
2. Context object (non-sensitive data only)

Error messages provide recovery suggestions and never expose tokens.

### Notion API Client

Created via `src/lib/notion-client.ts`:

```typescript
const notion = createNotionClient() // Gets token from config
```

All Notion operations should:

1. Use `createNotionClient()` to get authenticated client
2. Wrap calls in try/catch with `handleNotionError()`
3. Format results appropriately for output

## Code Standards (Enforced)

### Size Limits

- **Files**: ≤ 300 LOC (longest: database.ts at ~230 LOC)
- **Functions**: ≤ 50 LOC
- **Parameters**: ≤ 5 per function
- **Cyclomatic Complexity**: ≤ 10

### TypeScript

- Strict mode enabled (tsconfig.json)
- No `any` types
- Explicit return types for functions
- No unchecked indexed access

### Testing

- **Required**: New code needs tests, bug fixes need regression tests
- **Pattern**: AAA (Arrange-Act-Assert)
- **E2E minimum**: ≥1 happy path, ≥1 failure path

### Git Commits

Follow Conventional Commits:

```
feat(page): add content flag to get command
fix(auth): handle token validation timeout
docs: update README with database examples
refactor(formatter): simplify plain text encoding
test(config): add backup/restore tests
```

## Key Design Decisions

### 1. TOON with Tab Delimiters (ADR 001)

**Why**: 58.9% token reduction for LLM consumption vs JSON
**Implementation**: `encode(data, { delimiter: '\t', indent: 2 })`
**Trade-off**: Less universal than JSON, but massive LLM cost savings

Users can override with `--format json` or `--format plain`.

### 2. Global Format Flag

Format is set at root command level, not per subcommand:

```bash
notion --format json page list  # ✅ Correct
notion page list --format json  # ❌ Wrong (won't work)
```

### 3. Config Location

`~/.notion-cli/config.json` for user-specific, cross-platform storage. Never in project directory.

### 4. Factory Functions for Commands

Each command group (auth, page, database) exports a `create*Command()` factory that returns a configured `Command` object. This allows hierarchical command registration in main entry point.

## Adding New Commands

1. Create command file in `src/commands/`
2. Export factory function: `export function createXCommand(): Command`
3. Register in `src/index.ts`: `program.addCommand(createXCommand())`
4. Use `getFormat(command)` to get output format from parent
5. Wrap Notion API calls with `handleNotionError()`
6. Use `output(data, format)` for results

Example skeleton:

```typescript
export function createBlockCommand(): Command {
  const block = new Command('block')

  block
    .command('list')
    .argument('<page-id>')
    .action(async (pageId: string, _options, command: Command) => {
      try {
        const format = getFormat(command)
        const notion = createNotionClient()
        const result = await notion.blocks.children.list({ block_id: pageId })
        output({ blocks: result.results }, format)
      }
      catch (error) {
        handleNotionError(error, 'List blocks', { pageId })
      }
    })

  return block
}

function getFormat(command: Command): OutputFormat {
  return (command.parent?.parent?.opts()?.format || 'toon') as OutputFormat
}
```

## Important Files

- `src/index.ts`: Main entry, command registration
- `src/utils/formatter.ts`: TOON/JSON/Plain formatting (note tab delimiter!)
- `src/lib/config.ts`: Config management (~/.notion-cli/)
- `src/lib/error-handler.ts`: Centralized error handling
- `src/lib/notion-client.ts`: Notion API wrapper
- `dev-docs/STANDARDS.md`: Full engineering standards
- `dev-docs/adr/001-toon-output-format.md`: TOON decision rationale

## Common Pitfalls

1. **Wrong format flag location**: Format must be global flag, not per command
2. **Logging tokens**: Never log `notionToken` - use context object filtering
3. **Inline error handling**: Always use `handleNotionError()`, never inline try/catch with process.exit()
4. **TOON delimiter**: Must use tab (`'\t'`), not comma (default)
5. **Config tests**: Must backup/restore real config to avoid side effects
6. **Format extraction**: Use `command.parent?.parent?.opts()?.format` for nested commands

## Runtime

This project uses **Bun**, not Node.js:

- Shebang: `#!/usr/bin/env bun`
- Package manager: `bun install` (not npm/yarn)
- Test runner: `bun test` (not jest/vitest)
- Module system: ESM with `type: "module"` in package.json
- Build: `bun build --compile` for standalone executable

## Dependencies

Core:

- `@byjohann/toon`: TOON encoder (with tab override)
- `@notionhq/client`: Official Notion SDK
- `commander`: CLI framework
- `@pleaseai/cli-toolkit`: Shared utilities (validation, i18n)

No other CLI frameworks, no yargs, no oclif - stick with Commander.js patterns.
