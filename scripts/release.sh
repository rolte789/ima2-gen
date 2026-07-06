#!/usr/bin/env bash
# release.sh — build + version bump + GitHub Release (OIDC trusted publishing)
# The npm publish itself happens in GitHub Actions (.github/workflows/publish.yml)
# via npm trusted publishing when the GitHub Release is created. This script
# never runs `npm publish` and needs no npm credentials.
# Auto-detects npm latest and bumps patch only (minor/major via explicit arg).
# Usage:
#   ./scripts/release.sh          → patch bump (1.0.2 → 1.0.3)
#   ./scripts/release.sh minor    → minor bump (1.0.2 → 1.1.0)
#   ./scripts/release.sh major    → major bump (1.0.2 → 2.0.0)
#   ./scripts/release.sh 1.2.0    → explicit version
set -e

PKG_NAME="ima2-gen"

echo "🎨 $PKG_NAME release script"
echo "========================="

cd "$(dirname "$0")/.."

# ─── Preflight: gh CLI auth (required — the GitHub Release triggers the
#     OIDC publish workflow; without it nothing reaches npm) ─────────────
if ! command -v gh &>/dev/null; then
  echo "❌ gh CLI not found. Install it: https://cli.github.com"
  exit 1
fi
if ! gh auth status &>/dev/null; then
  echo "❌ gh CLI not authenticated. Run: gh auth login"
  exit 1
fi
echo "🔐 gh CLI authenticated"

if ! git diff --cached --quiet; then
  echo "❌ Refusing release: staged changes exist"
  exit 1
fi
if ! git diff --quiet; then
  echo "❌ Refusing release: worktree has uncommitted changes"
  exit 1
fi

# ─── Version detection ─────────────────────────────────
NPM_LATEST=$(npm view "$PKG_NAME" dist-tags.latest 2>/dev/null || echo "0.0.0")
PKG_VERSION=$(node -p "require('./package.json').version")
echo "📡 npm latest:   $NPM_LATEST"
echo "📦 package.json: $PKG_VERSION"

# Sync package.json to npm latest if behind (strip prerelease)
CLEAN_NPM=$(echo "$NPM_LATEST" | sed 's/-.*//')
CLEAN_PKG=$(echo "$PKG_VERSION" | sed 's/-.*//')
if [ "$CLEAN_PKG" != "$CLEAN_NPM" ] && [ "$CLEAN_NPM" != "0.0.0" ]; then
  echo "⚠️  package.json ($CLEAN_PKG) differs from npm ($CLEAN_NPM). Syncing..."
  npm version "$CLEAN_NPM" --no-git-tag-version --allow-same-version
fi

# ─── Build ─────────────────────────────────────────────
echo "📦 Building UI (vite)..."
npm run build

# ─── Version bump ──────────────────────────────────────
BUMP_ARG="${1:-patch}"
EXPLICIT_VERSION=0
if [[ "$BUMP_ARG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  EXPLICIT_VERSION=1
fi
npm version "$BUMP_ARG" --no-git-tag-version --allow-same-version

VERSION=$(node -p "require('./package.json').version")

# Auto-resolve tag collisions left by previous failed releases.
# If user passed an explicit version, fail loudly instead of silently shifting.
collision_check() {
  local local_tag remote_tag npm_pub
  local_tag=$(git rev-parse --verify "v$1" 2>/dev/null || true)
  remote_tag=$(git ls-remote --tags origin "v$1" 2>/dev/null | awk '{print $1}')
  npm_pub=$(npm view "$PKG_NAME@$1" version 2>/dev/null || true)
  if [ -n "$npm_pub" ] || [ -n "$local_tag" ] || [ -n "$remote_tag" ]; then
    return 0
  fi
  return 1
}

while collision_check "$VERSION"; do
  if [ "$EXPLICIT_VERSION" = "1" ]; then
    echo "❌ Version $VERSION already exists (tag or npm). Choose a different version."
    exit 1
  fi
  echo "⚠️  v$VERSION already taken (tag or npm). Bumping patch and retrying..."
  npm version patch --no-git-tag-version
  VERSION=$(node -p "require('./package.json').version")
done

echo "📌 New version: $VERSION"

# ─── Collect changelog ─────────────────────────────────
PREV_TAG=$(git tag --sort=-v:refname | grep -E '^v[0-9]' | head -1)
if [ -n "$PREV_TAG" ]; then
  COMMIT_COUNT=$(git rev-list "$PREV_TAG"..HEAD --count)
else
  COMMIT_COUNT="?"
fi

RELEASE_NOTES=$(node scripts/generate-release-notes.mjs "${PREV_TAG:+$PREV_TAG..HEAD}" 2>/dev/null || git log "${PREV_TAG:---oneline -20}"..HEAD --pretty=format:"- %s" --no-merges | head -50)

echo ""
echo "📝 Changes since ${PREV_TAG:-'(none)'} ($COMMIT_COUNT commits):"
echo "$RELEASE_NOTES" | head -20
echo ""

# ─── Commit + Tag ──────────────────────────────────────
echo "🏷️  Preparing commit + tag v$VERSION..."
HEAD_MSG=$(git log -1 --pretty=%s 2>/dev/null || echo "")
if [ "$HEAD_MSG" = "chore: release v$VERSION" ] && git diff --quiet HEAD -- package.json package-lock.json; then
  echo "ℹ️  HEAD already matches release commit, skipping commit"
else
  git add package.json package-lock.json
  git commit -m "chore: release v$VERSION" --allow-empty
fi

if git rev-parse --verify "v$VERSION" >/dev/null 2>&1; then
  echo "ℹ️  Local tag v$VERSION already exists, skipping"
else
  git tag "v$VERSION"
fi

# ─── Push commit + tag (OIDC order: commit → tag → push → gh release create;
#     the Release event triggers the trusted-publishing workflow) ─────────
git push origin main
if [ -z "$(git ls-remote --tags origin "v$VERSION" 2>/dev/null)" ]; then
  git push origin "v$VERSION"
else
  echo "ℹ️  Remote tag v$VERSION already exists, skipping push"
fi

# ─── GitHub Release with changelog (REQUIRED — this is the publish trigger) ──
echo "📋 Creating GitHub Release (triggers OIDC npm publish)..."
gh release create "v$VERSION" \
    --title "v$VERSION" \
    --notes "${RELEASE_NOTES:-Release v$VERSION}" \
    --latest
echo "✅ GitHub Release v$VERSION created!"

echo ""
echo "✅ $PKG_NAME@$VERSION release triggered!"
echo "   npm publish runs in GitHub Actions (publish.yml, OIDC trusted publishing)."
echo "   Watch it:  gh run list --workflow=publish.yml --limit 1"
echo "              gh run watch"
echo "   Install: npm install -g $PKG_NAME"
echo "   Release: https://github.com/lidge-jun/ima2-gen/releases/tag/v$VERSION"
