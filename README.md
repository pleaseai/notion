# Notion CLI

A command-line interface for managing Notion pages and databases, optimized for LLM interactions with TOON output format.

## Features

- **Authentication**: Secure token-based authentication
- **Page Management**: Create, read, update, and list pages
- **Database Operations**: Query, create, and manage databases
- **Multiple Output Formats**:
  - `toon`: Token-efficient format (58.9% token reduction) - default
  - `json`: Standard JSON for scripting
  - `plain`: Human-readable text output
- **Built with Bun**: Fast runtime and build system

## Installation

### Homebrew (macOS and Linux)

```bash
# Add the PleaseAI tap
brew tap pleaseai/tap

# Install notion-cli
brew install notion-cli

# Verify installation
notion --version
```

### From Source

```bash
# Clone the repository
git clone <repository-url>
cd notion-cli

# Install dependencies
bun install

# Build standalone executable
bun run build

# The executable will be at dist/notion
```

### Development

```bash
# Run in development mode
bun run dev <command>

# Example
bun run dev page list
```

## Quick Start

### 1. Get a Notion Integration Token

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Give it a name and select capabilities
4. Copy the "Internal Integration Token"
5. Share your pages/databases with the integration

### 2. Authenticate

```bash
notion auth login
# Enter your token when prompted
```

### 3. List Pages

```bash
# Default TOON format (optimized for LLMs)
notion page list

# JSON format (for scripting)
notion page list --format json

# Human-readable format
notion page list --format plain
```

## Commands

### Authentication

```bash
# Login with integration token
notion auth login [token]

# Check authentication status
notion auth status

# Logout (remove credentials)
notion auth logout
```

### Page Management

```bash
# List all pages
notion page list [--limit <number>]

# Get page details
notion page get <page-id> [--content]

# Create a new page
notion page create --title "Page Title" --parent <parent-id> [--content "Initial content"]

# Update page
notion page update <page-id> [--title "New Title"] [--archive] [--unarchive]
```

### Database Management

```bash
# List all databases
notion database list [--limit <number>]

# Get database schema
notion database get <database-id>

# Query database
notion database query <database-id> [--filter <json>] [--sorts <json>] [--limit <number>]

# Create database
notion database create --title "Database Title" --parent <page-id> [--schema <json>]

# Update database
notion database update <database-id> [--title "New Title"] [--schema <json>] [--archive] [--unarchive]
```

## Output Formats

### TOON (Default)

Token-Oriented Object Notation with tab delimiters - optimized for LLM consumption:

```bash
notion page list --format toon
```

**Benefits**:

- 58.9% token reduction vs JSON
- Tab-delimited for optimal tokenization
- Maintains data structure

### JSON

Standard JSON format for scripting and automation:

```bash
notion page list --format json
```

### Plain

Human-readable text output:

```bash
notion page list --format plain
```

## Examples

### Create a Page

```bash
notion page create \
  --title "Meeting Notes" \
  --parent abc123def456 \
  --content "Discussion points from today's meeting"
```

### Query a Database

```bash
# Query with filter
notion database query abc123def456 \
  --filter '{"property":"Status","select":{"equals":"In Progress"}}' \
  --format json

# Query with sorting
notion database query abc123def456 \
  --sorts '[{"property":"Created","direction":"descending"}]' \
  --limit 10
```

### Update Page Title

```bash
notion page update abc123def456 --title "Updated Title"
```

### Archive a Database

```bash
notion database update abc123def456 --archive
```

## Configuration

Configuration is stored in `~/.notion-cli/config.json`:

```json
{
  "notionToken": "secret_...",
  "defaultWorkspace": "optional"
}
```

**Security Note**: The config file contains sensitive tokens. Never commit or share it.

## Error Handling

The CLI provides helpful error messages:

```bash
✗ Authentication failed
  Your token may be invalid or expired.
  Run "notion auth login" to re-authenticate.

  Context:
    operation: login
```

Enable debug mode for detailed error information:

```bash
DEBUG=1 notion page list
```

## Development

### Project Structure

```
notion-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/             # Command implementations
│   │   ├── auth.ts           # Authentication commands
│   │   ├── page.ts           # Page commands
│   │   └── database.ts       # Database commands
│   ├── lib/                  # Core libraries
│   │   ├── config.ts         # Configuration management
│   │   ├── notion-client.ts  # Notion API wrapper
│   │   └── error-handler.ts  # Error handling
│   └── utils/                # Utilities
│       └── formatter.ts      # Output formatting
├── test/                     # Tests
├── package.json
└── tsconfig.json
```

### Scripts

```bash
# Development
bun run dev <command>

# Build
bun run build

# Test
bun test
bun run test:watch
bun run test:coverage

# Type checking
bun run type-check

# Linting
bun run lint
bun run lint:fix
```

### Testing

Tests use Bun's built-in test runner:

```bash
# Run all tests
bun test

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```

### Code Standards

- Files: ≤ 300 lines of code
- Functions: ≤ 50 lines of code
- Parameters: ≤ 5 per function
- Cyclomatic complexity: ≤ 10
- TypeScript strict mode enabled

## Architecture Decisions

### TOON as Default Format

**Decision**: Use TOON with tab delimiters as the default output format.

**Rationale**:

- 58.9% token reduction vs JSON (tab delimiter)
- Better than 49.1% with comma delimiter
- Tab is single-token in most LLM tokenizers
- Optimized for AI/LLM consumption

**Implementation**: `@byjohann/toon` with tab delimiter override

### Configuration Location

**Decision**: Store config in `~/.notion-cli/config.json`

**Rationale**:

- Standard location for CLI tools
- User-specific configuration
- Easy to backup/restore
- Platform-independent

## Troubleshooting

### "Not authenticated" Error

```bash
notion auth login
```

### Invalid Token

1. Go to https://www.notion.so/my-integrations
2. Regenerate your integration token
3. Run `notion auth login` with the new token

### Permission Denied

Make sure you've shared the page/database with your integration:

1. Open the page/database in Notion
2. Click "Share"
3. Add your integration

### Rate Limiting

Notion API has rate limits. If you hit them:

- Wait a moment before retrying
- Reduce the frequency of requests
- Use filters to minimize data transfer

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Author

Minsu Lee (@amondnet)

## Credits

Built using patterns from:

- gh-please - GitHub CLI extension
- asana - Asana CLI
- cli-toolkit - Shared CLI utilities

Powered by:

- [Bun](https://bun.sh) - Fast JavaScript runtime
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [@notionhq/client](https://github.com/makenotion/notion-sdk-js) - Notion API SDK
- [@byjohann/toon](https://github.com/byjohann/toon) - TOON encoder
