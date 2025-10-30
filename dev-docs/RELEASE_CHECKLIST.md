# Release Checklist

Quick reference for setting up and managing releases with Homebrew tap integration.

## Initial Setup (One-time)

### 1. Create Homebrew Tap Repository

- [ ] Create repository at https://github.com/pleaseai/homebrew-tap
  - Name: `homebrew-tap`
  - Description: `Homebrew formulae for PleaseAI tools`
  - Visibility: Public
  - Initialize with README: Yes

- [ ] Run initialization script:
  ```bash
  ./scripts/init-homebrew-tap.sh
  ```

### 2. Set Up GitHub App Authentication

- [ ] Create GitHub App at https://github.com/settings/apps/new
  - Name: `PleaseAI Release Bot`
  - Homepage: `https://github.com/pleaseai`
  - Webhook: Disabled
  - Permissions:
    - Repository → Contents: Read & Write
    - Repository → Pull Requests: Read & Write
  - Installation: Only on this account

- [ ] Install app on repositories:
  - `pleaseai/notion`
  - `pleaseai/homebrew-tap`

- [ ] Generate private key (download .pem file)

- [ ] Add secrets to notion repository:

  ```
  Settings → Secrets and variables → Actions → New repository secret
  ```

  - `APP_ID`: Your GitHub App ID
  - `PRIVATE_KEY`: Contents of .pem file

### 3. Verify Configuration Files

- [ ] `release-please-config.json` exists
- [ ] `.release-please-manifest.json` exists
- [ ] `.github/workflows/release-please.yml` exists
- [ ] Workflow has correct formula class name: `NotionCli`
- [ ] Workflow references correct repository: `pleaseai/homebrew-tap`

### 4. Pre-Release Checks

- [ ] All tests pass: `bun test`
- [ ] Type check passes: `bun run type-check`
- [ ] Build succeeds: `bun run build`
- [ ] Version in package.json is correct

## Creating a Release

### Automated Release (Recommended)

1. **Commit with conventional commit message:**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve bug"
   git push origin main
   ```

2. **Wait for release-please to create PR**
   - Check: https://github.com/pleaseai/notion/pulls
   - PR will be auto-created with version bump and CHANGELOG

3. **Review and merge the release PR**
   - Check CHANGELOG.md changes
   - Verify version bump is correct
   - Merge the PR

4. **Release workflow runs automatically:**
   - ✅ Creates GitHub release
   - ✅ Builds binaries (macOS x64, ARM64, Linux x64, ARM64)
   - ✅ Uploads binaries to release
   - ✅ Updates Homebrew formula

5. **Verify the release:**
   - [ ] Release created: https://github.com/pleaseai/notion/releases
   - [ ] All 4 binaries attached
   - [ ] SHA256 checksums attached
   - [ ] Formula updated: https://github.com/pleaseai/homebrew-tap/blob/main/notion-cli.rb

### Manual Release (Emergency)

If automated release fails, you can manually update the formula:

```bash
# Clone homebrew-tap
git clone https://github.com/pleaseai/homebrew-tap.git
cd homebrew-tap

# Edit notion-cli.rb with new version and checksums
# Get checksums from: https://github.com/pleaseai/notion/releases

# Commit and push
git add notion-cli.rb
git commit -m "chore: update notion-cli to vX.Y.Z"
git push origin main
```

## Testing Installation

### Local Testing

```bash
# Add tap
brew tap pleaseai/tap

# Install
brew install notion-cli

# Verify
notion --version
notion --help

# Test commands
notion auth status
```

### Testing Different Platforms

```bash
# macOS Intel
arch -x86_64 notion --version

# macOS ARM
arch -arm64 notion --version

# Linux (via Docker)
docker run --rm -it ubuntu:latest bash
apt update && apt install -y curl
curl -fsSL https://github.com/pleaseai/notion/releases/download/vX.Y.Z/notion-linux-x64 -o /usr/local/bin/notion
chmod +x /usr/local/bin/notion
notion --version
```

## Conventional Commit Types

Use these prefixes for automatic version bumping:

- `feat:` - New feature (minor version bump)
- `fix:` - Bug fix (patch version bump)
- `feat!:` or `BREAKING CHANGE:` - Breaking change (major version bump)
- `docs:` - Documentation only
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Maintenance tasks
- `ci:` - CI/CD changes

Examples:

```bash
git commit -m "feat: add database search functionality"
git commit -m "fix: handle empty page titles correctly"
git commit -m "feat!: change auth config location"
```

## Troubleshooting

### Release PR Not Created

**Check:**

- [ ] Commits use conventional commit format
- [ ] GitHub Actions are enabled
- [ ] Workflow file is correct

**Fix:**

```bash
# Manually trigger workflow
gh workflow run release-please.yml
```

### Binary Build Fails

**Check:**

- [ ] `bun install` succeeds
- [ ] `bun run build` succeeds locally
- [ ] All dependencies are in package.json

**Fix:**

```bash
# Test build locally
bun run build
./dist/notion --version
```

### Homebrew Formula Update Fails

**Check:**

- [ ] GitHub App has access to both repositories
- [ ] APP_ID and PRIVATE_KEY secrets are correct
- [ ] homebrew-tap repository exists

**Debug:**

```bash
# Check workflow logs
# Actions → update-homebrew-formula job
# Look for authentication or clone errors
```

### Installation Fails

**Check:**

- [ ] Formula exists in homebrew-tap
- [ ] URLs in formula are accessible
- [ ] Checksums match

**Test:**

```bash
# Verify binary downloads
curl -L https://github.com/pleaseai/notion/releases/download/vX.Y.Z/notion-darwin-x64 -o test-binary
shasum -a 256 test-binary
# Compare with formula SHA256

# Test formula locally
brew install --build-from-source homebrew-tap/notion-cli.rb
```

## Rollback Process

If a release has issues:

1. **Revert the release commit:**

   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Delete the bad release:**

   ```bash
   gh release delete vX.Y.Z
   git push --delete origin vX.Y.Z
   ```

3. **Update Homebrew formula to previous version:**

   ```bash
   cd homebrew-tap
   git revert HEAD
   git push origin main
   ```

4. **Users can downgrade:**
   ```bash
   brew uninstall notion-cli
   brew install notion-cli@<previous-version>
   ```

## Monitoring

### Watch Release Progress

```bash
# GitHub Actions
https://github.com/pleaseai/notion/actions

# Release page
https://github.com/pleaseai/notion/releases

# Homebrew tap commits
https://github.com/pleaseai/homebrew-tap/commits/main
```

### Homebrew Analytics

```bash
# Check formula info
brew info notion-cli

# Audit formula
brew audit --strict notion-cli

# Test formula
brew test notion-cli
```

## Useful Commands

```bash
# Check current version
notion --version

# Check latest release
gh release view --repo pleaseai/notion

# List all releases
gh release list --repo pleaseai/notion

# Download specific binary
gh release download v1.0.0 --pattern "notion-darwin-arm64" --repo pleaseai/notion

# View workflow runs
gh run list --workflow=release-please.yml --repo pleaseai/notion

# View specific run
gh run view <run-id> --repo pleaseai/notion
```

## Resources

- **Homebrew Setup Guide**: [HOMEBREW_SETUP.md](./HOMEBREW_SETUP.md)
- **GitHub Actions**: https://github.com/pleaseai/notion/actions
- **Releases**: https://github.com/pleaseai/notion/releases
- **Homebrew Tap**: https://github.com/pleaseai/homebrew-tap
- **Release Please Docs**: https://github.com/googleapis/release-please
