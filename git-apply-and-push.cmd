@echo off
REM Apply the prepared patch and push changes to remote. Run this in CMD or Git Bash.
REM Usage: open Git Bash or CMD at the repo root and run: git-apply-and-push.cmd

echo Applying patch changes-lesson-selector.patch
git apply "%~dp0changes-lesson-selector.patch"
if %ERRORLEVEL% neq 0 (
  echo Failed to apply patch. Inspect changes-lesson-selector.patch manually.
  pause
  exit /b 1
)

echo Staging changed file
git add client/src/pages/lesson.tsx

echo Committing
git commit -m "chore: make lesson language selector display-only" || echo "No changes to commit"

echo Pushing to origin (current branch)
git push origin HEAD || echo "Push failed; check your remote/auth"

echo Done.
pause
