#!/bin/bash
set -e

# Script to initialize the pleaseai/homebrew-tap repository
# Usage: ./scripts/init-homebrew-tap.sh

REPO_URL="https://github.com/pleaseai/homebrew-tap.git"
TAP_DIR="$(mktemp -d)/homebrew-tap"

echo "🍺 Initializing Homebrew Tap Repository"
echo "========================================"
echo ""

# Check if repository exists
echo "📋 Checking if repository exists..."
if git ls-remote "$REPO_URL" &>/dev/null; then
  echo "✅ Repository exists at $REPO_URL"
  read -p "⚠️  Repository already exists. Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
  fi
else
  echo "❌ Repository does not exist. Please create it first:"
  echo "   https://github.com/organizations/pleaseai/repositories/new"
  echo "   Name: homebrew-tap"
  echo "   Description: Homebrew formulae for PleaseAI tools"
  echo "   Public: Yes"
  exit 1
fi

# Clone repository
echo ""
echo "📥 Cloning repository..."
git clone "$REPO_URL" "$TAP_DIR"
cd "$TAP_DIR"

# Create README
echo ""
echo "📝 Creating README.md..."
cat > README.md << 'EOF'
# PleaseAI Homebrew Tap

Official Homebrew tap for PleaseAI tools.

## Installation

```bash
# Add the tap
brew tap pleaseai/tap

# Install notion-cli
brew install notion-cli
```

## Available Formulae

- **notion-cli** - Notion CLI for managing Notion from the command line

## Updating

Formulae are automatically updated by the CI/CD pipeline when new releases are created.

To manually update:

```bash
brew update
brew upgrade notion-cli
```

## Development

### Testing Local Changes

```bash
# Clone this repository
git clone https://github.com/pleaseai/homebrew-tap.git
cd homebrew-tap

# Install from local formula
brew install --build-from-source ./notion-cli.rb

# Test the formula
brew test notion-cli

# Audit the formula
brew audit --strict notion-cli
```

### Formula Structure

Each formula follows Homebrew's standard structure:

```ruby
class NotionCli < Formula
  desc "Description of the tool"
  homepage "https://github.com/pleaseai/notion"
  version "X.Y.Z"
  license "MIT"

  # Platform-specific binaries
  on_macos do
    if Hardware::CPU.arm?
      url "..."
      sha256 "..."
    else
      url "..."
      sha256 "..."
    end
  end

  # Installation and test
  def install
    bin.install "binary-name" => "command-name"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/command --version")
  end
end
```

## Troubleshooting

### Installation Issues

If you encounter issues installing:

```bash
# Update Homebrew
brew update

# Try reinstalling
brew uninstall notion-cli
brew install notion-cli

# Check for conflicts
brew doctor
```

### Formula Not Found

If you get "Error: No available formula with the name":

```bash
# Ensure the tap is added
brew tap pleaseai/tap

# Update tap
brew update

# List formulae in tap
brew search pleaseai/tap/
```

## Contributing

Formulae are automatically maintained by CI/CD. For manual updates or issues:

1. Open an issue at https://github.com/pleaseai/homebrew-tap/issues
2. For notion-cli issues, go to https://github.com/pleaseai/notion/issues

## License

MIT License - see individual formula files for details.
EOF

# Create .github directory and workflow
echo ""
echo "🔧 Creating GitHub workflows..."
mkdir -p .github/workflows

cat > .github/workflows/test.yml << 'EOF'
name: Test Formulae

on:
  pull_request:
    paths:
      - '*.rb'
  push:
    branches:
      - main
    paths:
      - '*.rb'

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Homebrew
        uses: Homebrew/actions/setup-homebrew@master

      - name: Test formulae
        run: |
          for formula in *.rb; do
            if [ -f "$formula" ]; then
              echo "Testing $formula..."
              brew audit --strict "$formula"
              brew install --build-from-source "$formula"
              brew test "$formula" || true
            fi
          done
EOF

# Create .gitignore
echo ""
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# macOS
.DS_Store

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# Homebrew
*.bottle.*
EOF

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then
  echo ""
  echo "✅ Repository is already initialized"
else
  # Commit and push
  echo ""
  echo "💾 Committing changes..."
  git config user.name "github-actions[bot]"
  git config user.email "github-actions[bot]@users.noreply.github.com"
  git add README.md .github/workflows/test.yml .gitignore
  git commit -m "chore: initialize homebrew tap"

  echo ""
  echo "🚀 Pushing to GitHub..."
  git push origin main
fi

# Cleanup
cd - > /dev/null
rm -rf "$TAP_DIR"

echo ""
echo "✅ Homebrew tap initialized successfully!"
echo ""
echo "Next steps:"
echo "1. Set up GitHub App authentication (see HOMEBREW_SETUP.md)"
echo "2. Add APP_ID and PRIVATE_KEY secrets to notion repository"
echo "3. Create a release to test the workflow"
echo ""
echo "To test locally:"
echo "  brew tap pleaseai/tap"
echo "  # Wait for first release, then:"
echo "  brew install notion-cli"
