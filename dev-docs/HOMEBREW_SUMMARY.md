# Homebrew Tap Setup Summary

## What Was Created

### 1. Configuration Files
- ✅ `release-please-config.json` - Release-please configuration
- ✅ `.release-please-manifest.json` - Version tracking
- ✅ `.github/workflows/release-please.yml` - Updated with correct formula name

### 2. Documentation
- ✅ `HOMEBREW_SETUP.md` - Comprehensive setup guide
- ✅ `RELEASE_CHECKLIST.md` - Quick reference for releases
- ✅ `README.md` - Updated with Homebrew installation

### 3. Scripts
- ✅ `scripts/init-homebrew-tap.sh` - Initialize homebrew-tap repository

## Workflow Overview

```
Push to main → Release-Please PR → Merge PR → 
→ Build Binaries → Upload to Release → Update Formula
```

## Next Steps

### 1. Create Homebrew Tap Repository
```bash
# On GitHub: https://github.com/organizations/pleaseai/repositories/new
Name: homebrew-tap
Description: Homebrew formulae for PleaseAI tools
Public: Yes
Initialize with README: Yes
```

### 2. Initialize the Repository
```bash
./scripts/init-homebrew-tap.sh
```

### 3. Set Up GitHub App
1. Create at https://github.com/settings/apps/new
2. Install on both repositories:
   - pleaseai/notion
   - pleaseai/homebrew-tap
3. Add secrets to notion repository:
   - `APP_ID`
   - `PRIVATE_KEY`

### 4. Create Test Release
```bash
git commit --allow-empty -m "feat: initial release"
git push origin main
# Wait for release-please PR
# Merge PR to trigger release
```

### 5. Test Installation
```bash
brew tap pleaseai/tap
brew install notion-cli
notion --version
```

## What the Workflow Does

### When you push to main:
1. **Release-Please** analyzes conventional commits
2. Creates/updates a release PR with version bump
3. Generates CHANGELOG.md

### When release PR is merged:
1. **Creates GitHub Release** with new tag
2. **Builds Binaries** for 4 platforms:
   - macOS x64
   - macOS ARM64
   - Linux x64
   - Linux ARM64
3. **Uploads Binaries** to release with checksums
4. **Updates Formula** in homebrew-tap with:
   - New version
   - New download URLs
   - New SHA256 checksums

### Users can then:
```bash
brew tap pleaseai/tap
brew install notion-cli
```

## Files Modified

### Updated
- `.github/workflows/release-please.yml`
  - Fixed formula class name: `AsanaCli` → `NotionCli`
  - Fixed description
  
- `README.md`
  - Added Homebrew installation section

### Created
- `release-please-config.json`
- `.release-please-manifest.json`
- `HOMEBREW_SETUP.md`
- `RELEASE_CHECKLIST.md`
- `scripts/init-homebrew-tap.sh`

## Conventional Commits

For automatic version bumping:

```bash
# Patch version (0.1.0 → 0.1.1)
git commit -m "fix: resolve authentication issue"

# Minor version (0.1.0 → 0.2.0)
git commit -m "feat: add search functionality"

# Major version (0.1.0 → 1.0.0)
git commit -m "feat!: change config format"
# or
git commit -m "feat: breaking change\n\nBREAKING CHANGE: config format changed"
```

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Formula not found | `brew update && brew tap pleaseai/tap` |
| Auth error | Check APP_ID and PRIVATE_KEY secrets |
| Build fails | Test `bun run build` locally |
| Binary 404 | Check release binaries exist |
| Checksum mismatch | Re-run release workflow |

## Important Links

- **Setup Guide**: [HOMEBREW_SETUP.md](./HOMEBREW_SETUP.md)
- **Release Checklist**: [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)
- **GitHub Actions**: https://github.com/pleaseai/notion/actions
- **Releases**: https://github.com/pleaseai/notion/releases

## Testing the Setup

```bash
# 1. Create test commit
git commit --allow-empty -m "feat: test homebrew setup"
git push origin main

# 2. Check Actions
# https://github.com/pleaseai/notion/actions

# 3. Merge release PR when created

# 4. Wait for workflow to complete

# 5. Test installation
brew tap pleaseai/tap
brew install notion-cli
notion --version
```

## Success Criteria

- ✅ release-please PR created automatically
- ✅ Release created when PR merged
- ✅ 4 binaries uploaded (darwin-x64, darwin-arm64, linux-x64, linux-arm64)
- ✅ SHA256 checksums uploaded
- ✅ Formula updated in homebrew-tap
- ✅ Installation works: `brew install notion-cli`
- ✅ Binary runs: `notion --version`

## Support

For issues:
- **Setup questions**: See [HOMEBREW_SETUP.md](./HOMEBREW_SETUP.md)
- **Release issues**: See [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)
- **Bug reports**: https://github.com/pleaseai/notion/issues
