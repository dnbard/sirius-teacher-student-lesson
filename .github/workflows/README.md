# GitHub Actions Workflows

This directory contains CI/CD workflows for the Sirius Teacher Student Lesson project.

## Workflows

### 🔧 CI - Backend Tests (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches (when backend files change)
- Pull requests to `main` or `develop` branches (when backend files change)

**What it does:**
1. ✅ Runs tests on multiple Node.js versions (18.x, 20.x)
2. 🔍 Runs ESLint for code quality checks
3. 🧪 Executes all Jest unit tests
4. 📊 Generates code coverage reports
5. ☁️ Uploads coverage to Codecov (optional)
6. 📦 Archives coverage artifacts for 30 days

**Node.js versions tested:**
- Node.js 18.x (LTS)
- Node.js 20.x (LTS)

**Performance:**
- Average run time: ~2-3 minutes
- Parallel execution across Node versions

## Badges

Add these badges to your main README.md:

```markdown
![CI Status](https://github.com/YOUR_USERNAME/sirius-teacher-student-lesson/workflows/CI%20-%20Backend%20Tests/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/sirius-teacher-student-lesson/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/sirius-teacher-student-lesson)
```

## Setup

### Required Secrets (Optional)

For Codecov integration, add this secret to your repository:
- `CODECOV_TOKEN` - Get this from https://codecov.io after signing up

To add secrets:
1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add the secret name and value

### Local Testing

Before pushing, you can run the same checks locally:

```bash
# Backend tests
cd backend
npm run lint
npm test
npm run test:cov
```

## Workflow Status

You can view the status of workflows:
- In the "Actions" tab of your GitHub repository
- On pull request pages
- As badges in your README

## Troubleshooting

### Workflow doesn't trigger
- Check that you've pushed changes to `backend/` directory
- Verify branch name matches `main` or `develop`
- Check workflow file syntax is valid YAML

### Tests fail in CI but pass locally
- Check Node.js version matches (use `node --version`)
- Ensure all dependencies are in `package.json`
- Check for environment-specific code

### Coverage upload fails
- This is non-blocking (won't fail the build)
- Add `CODECOV_TOKEN` secret if you want coverage tracking
- Remove the Codecov step if not needed

