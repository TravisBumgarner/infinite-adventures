#!/bin/bash
set -e

REF="${1:-HEAD}"

git commit --allow-empty -m 'Trigger rebuild'
git push heroku "$REF":main --force
git reset HEAD~1
