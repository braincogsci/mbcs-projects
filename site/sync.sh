#!/usr/bin/env bash
# Publishes local edits: pulls remote changes, commits whatever changed here, pushes to GitHub.
# GitHub then rebuilds the website by itself. Meant to be run by hand or from cron / Task Scheduler.
#
#   bash site/sync.sh            (run from anywhere; it finds the repo itself)
set -euo pipefail

cd "$(dirname "$0")/.."

# 1. Bring in changes made elsewhere (e.g. via github.com), keeping our uncommitted edits.
git pull --rebase --autostash origin main

# 2. Commit local changes, if any.
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "Update notes ($(date '+%Y-%m-%d %H:%M'))"
fi

# 3. Push, if there is anything to push.
if [ -n "$(git log origin/main..HEAD --oneline)" ]; then
  git push origin main
  echo "Pushed. The website updates in about a minute."
else
  echo "Nothing to publish."
fi
