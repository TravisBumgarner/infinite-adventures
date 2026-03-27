#!/bin/bash
set -e

REF="${1:-HEAD}"

if ! git remote get-url heroku &>/dev/null; then
  echo "Adding heroku remote..."
  heroku git:remote -a infinite-adventures
fi

git commit --allow-empty -m 'Trigger rebuild'
git push heroku "$REF":main --force
git reset HEAD~1
