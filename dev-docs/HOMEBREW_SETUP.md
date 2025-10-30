# Homebrew Tap Setup Guide

This document explains how to set up the Homebrew tap for the Notion CLI at https://github.com/pleaseai/homebrew-tap.

## Overview

The release workflow automatically:
1. Builds binaries for macOS (x64, ARM64) and Linux (x64, ARM64)
2. Creates a GitHub release with these binaries
3. Updates the Homebrew formula in the `pleaseai/homebrew-tap` repository

## Prerequisites

### 1. Create the Homebrew Tap Repository

Create a new repository at https://github.com/pleaseai/homebrew-tap:

```bash
# On GitHub, create new repository: pleaseai/homebrew-tap
# Description: Homebrew formulae for PleaseAI tools
# Public repository
# Initialize with README
```

### 2. Initialize the Repository

```bash
# Clone the homebrew-tap repository
git clone https://github.com/pleaseai/homebrew-tap.git
cd homebrew-tap

# Create initial README
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

- `notion-cli` - Notion CLI for managing Notion from the command line

## Development

Formulae are automatically updated by the CI/CD pipeline when new releases are created.
EOF

git add README.md
git commit -m "docs: initial README"
git push origin main
```

### 3. Set Up GitHub App Token

The workflow uses a GitHub App for authentication to push to the homebrew-tap repository.

**Option A: Use GitHub App (Recommended)**

1. Create a GitHub App at https://github.com/settings/apps/new with:
   - **Name**: `PleaseAI Release Bot` (or similar)
   - **Homepage URL**: `https://github.com/pleaseai`
   - **Webhook**: Uncheck "Active"
   - **Repository permissions**:
     - Contents: Read & Write
     - Pull Requests: Read & Write
   - **Where can this GitHub App be installed?**: Only on this account

2. Install the app on both repositories:
   - pleaseai/notion
   - pleaseai/homebrew-tap

3. Generate a private key (download the .pem file)

4. Add secrets to the notion repository:
   - Go to: https://github.com/pleaseai/notion/settings/secrets/actions
   - Add `APP_ID`: Your GitHub App ID (found in app settings)
   - Add `PRIVATE_KEY`: Contents of the .pem file

**Option B: Use Personal Access Token (Alternative)**

If you prefer not to use a GitHub App, modify the workflow to use a PAT:

```yaml
# In .github/workflows/release-please.yml, replace app-token step with:
- name: Generate token
  id: app-token
  run: echo "token=${{ secrets.GITHUB_TOKEN }}" >> $GITHUB_OUTPUT
```

Note: The PAT needs `repo` and `workflow` scopes for both repositories.

### 4. Verify Workflow Configuration

Check that the workflow file has the correct repository references:

```yaml
# In .github/workflows/release-please.yml
- name: Checkout homebrew-tap repository
  uses: actions/checkout@v4
  with:
    repository: pleaseai/homebrew-tap  # ✅ Correct
    token: ${{ steps.app-token.outputs.token }}
    path: homebrew-tap
```

## How It Works

### Release Process

1. **Developer pushes to main branch**
   - Triggers release-please workflow
   - Release-please analyzes conventional commits
   - Creates/updates a release PR

2. **Release PR is merged**
   - Release-please creates a GitHub release
   - Triggers the build-binaries job

3. **Build Binaries Job**
   - Runs on matrix: macOS (x64, ARM64), Linux (x64, ARM64)
   - Uses Bun to compile standalone executables
   - Generates SHA256 checksums
   - Uploads artifacts

4. **Upload Release Assets Job**
   - Downloads all binary artifacts
   - Uploads to GitHub release

5. **Update Homebrew Formula Job**
   - Clones homebrew-tap repository
   - Downloads checksums from the release
   - Generates/updates `notion-cli.rb` formula
   - Commits and pushes to homebrew-tap

### Formula Structure

The generated formula (`notion-cli.rb`) includes:

```ruby
class NotionCli < Formula
  desc "Notion CLI - Manage Notion from the command line"
  homepage "https://github.com/pleaseai/notion"
  version "1.0.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/pleaseai/notion/releases/download/v1.0.0/notion-darwin-arm64"
      sha256 "abc123..."
    else
      url "https://github.com/pleaseai/notion/releases/download/v1.0.0/notion-darwin-x64"
      sha256 "def456..."
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/pleaseai/notion/releases/download/v1.0.0/notion-linux-arm64"
      sha256 "ghi789..."
    else
      url "https://github.com/pleaseai/notion/releases/download/v1.0.0/notion-linux-x64"
      sha256 "jkl012..."
    end
  end

  def install
    # Platform-specific installation
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/notion --version")
  end
end
```

## Testing the Setup

### 1. Create a Test Release

```bash
# In the notion repository
git commit --allow-empty -m "feat: test release"
git push origin main

# Wait for release-please to create a PR
# Merge the PR to trigger the release
```

### 2. Verify the Release

1. Check GitHub Actions: https://github.com/pleaseai/notion/actions
2. Check the release: https://github.com/pleaseai/notion/releases
3. Verify binaries are attached
4. Check homebrew-tap: https://github.com/pleaseai/homebrew-tap
5. Verify `notion-cli.rb` was updated

### 3. Test Installation

```bash
# Add the tap
brew tap pleaseai/tap

# Install (should fail if first release hasn't happened yet)
brew install notion-cli

# Verify installation
notion --version

# Test functionality
notion --help
```

## Troubleshooting

### Formula Not Found

**Problem**: `Error: No available formula with the name "notion-cli"`

**Solution**:
1. Check if the formula exists: https://github.com/pleaseai/homebrew-tap/blob/main/notion-cli.rb
2. Update your tap: `brew update`
3. Try again: `brew install notion-cli`

### Authentication Errors

**Problem**: Workflow fails with "Resource not accessible by integration"

**Solution**:
1. Verify GitHub App is installed on both repositories
2. Check that App has Contents: Write permission
3. Verify APP_ID and PRIVATE_KEY secrets are correct
4. Re-generate and update the private key if needed

### Binary Download Fails

**Problem**: Formula downloads fail with 404

**Solution**:
1. Check release exists: https://github.com/pleaseai/notion/releases
2. Verify binaries are attached (notion-darwin-x64, etc.)
3. Check URLs in formula match release tag
4. Ensure build-binaries job completed successfully

### Checksum Mismatch

**Problem**: Homebrew reports SHA256 mismatch

**Solution**:
1. Re-run the release workflow to regenerate checksums
2. Verify checksums in formula match downloaded binaries
3. Check no one manually edited the binaries

### Version Mismatch

**Problem**: `notion --version` shows different version than formula

**Solution**:
1. Verify package.json version matches release tag
2. Check .release-please-manifest.json is up to date
3. Ensure Bun build includes version from package.json

## Manual Formula Update

If you need to manually update the formula:

```bash
# Clone homebrew-tap
git clone https://github.com/pleaseai/homebrew-tap.git
cd homebrew-tap

# Edit notion-cli.rb
# Update version, URLs, and SHA256s

# Test locally
brew install --build-from-source ./notion-cli.rb
notion --version

# Commit and push
git add notion-cli.rb
git commit -m "chore: update notion-cli to vX.Y.Z"
git push origin main

# Update your local tap
brew update
brew upgrade notion-cli
```

## CI/CD Pipeline Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Developer commits to main with conventional commit          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Release-Please creates/updates Release PR                   │
│ - Bumps version in package.json                            │
│ - Generates CHANGELOG.md                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ PR merged
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Release-Please creates GitHub Release                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Build Binaries (Matrix Job)                                │
│ ┌─────────────────┬─────────────────┐                      │
│ │ macOS x64       │ macOS ARM64     │                      │
│ │ Linux x64       │ Linux ARM64     │                      │
│ └─────────────────┴─────────────────┘                      │
│ - Compile with Bun                                          │
│ - Generate SHA256                                           │
│ - Upload artifacts                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Upload Release Assets                                       │
│ - Download artifacts                                        │
│ - Upload to GitHub Release                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Update Homebrew Formula                                     │
│ - Clone homebrew-tap repo                                   │
│ - Download checksums                                        │
│ - Generate notion-cli.rb                                    │
│ - Commit & push to homebrew-tap                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Users can install                                           │
│ $ brew tap pleaseai/tap                                     │
│ $ brew install notion-cli                                   │
└─────────────────────────────────────────────────────────────┘
```

## Release Checklist

Before creating your first release:

- [ ] homebrew-tap repository created
- [ ] GitHub App created and installed (or PAT configured)
- [ ] APP_ID and PRIVATE_KEY secrets added
- [ ] release-please-config.json exists
- [ ] .release-please-manifest.json exists
- [ ] Workflow has correct repository references
- [ ] package.json version is correct
- [ ] All tests pass: `bun test`
- [ ] Type check passes: `bun run type-check`
- [ ] Build succeeds: `bun run build`

## Useful Commands

```bash
# Check current tap formulae
brew tap-info pleaseai/tap

# List installed formulae from tap
brew list --tap pleaseai/tap

# Get formula info
brew info notion-cli

# Audit formula (for maintainers)
brew audit --strict notion-cli

# Test formula (for maintainers)
brew test notion-cli

# Uninstall
brew uninstall notion-cli

# Remove tap
brew untap pleaseai/tap
```

## References

- [Homebrew Formula Cookbook](https://docs.brew.sh/Formula-Cookbook)
- [Homebrew Tap Documentation](https://docs.brew.sh/Taps)
- [Release Please Documentation](https://github.com/googleapis/release-please)
- [GitHub Actions - Create GitHub App Token](https://github.com/actions/create-github-app-token)
- [Bun Build Documentation](https://bun.sh/docs/bundler)

## Support

For issues with:
- **Notion CLI**: https://github.com/pleaseai/notion/issues
- **Homebrew formula**: https://github.com/pleaseai/homebrew-tap/issues
- **Installation**: Check troubleshooting section above
