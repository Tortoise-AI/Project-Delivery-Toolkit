# Contributing to White Paper Toolkit

## Branching Strategy

We use a two-branch workflow:

- **`main`** - Production branch, always deployable
- **`dev`** - Development branch for integrating features

### Branch Protection Rules

**⚠️ IMPORTANT:** While GitHub doesn't enforce these rules automatically on our current plan, all team members must follow these guidelines:

#### Main Branch (`main`)
- **No direct commits** - All changes must come through pull requests
- **Require 1 approving review** - PRs need at least one approval before merging
- **Dismiss stale reviews** - Re-request review when pushing new commits
- **Status checks** - Ensure tests pass before merging
- **Includes administrators** - Admins must also follow these rules

## Development Workflow

### 1. Create a Feature Branch
```bash
# Start from dev branch
git checkout dev
git pull origin dev

# Create your feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes
- Follow existing code patterns and style
- Use React best practices and hooks
- Write tests for new features
- Maintain accessibility standards

### 3. Test Your Changes
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Build the project
npm run build

# Start development server
npm run dev
```

### 4. Commit Your Changes
```bash
git add <files>
git commit -m "Brief description of changes"
```

For commits on feature branches, use:
```bash
git config user.name "antnewman"
git config user.email "ant@tortoiseai.com"
```

### 5. Push and Create Pull Request
```bash
# Push your branch
git push origin feature/your-feature-name

# Create PR via GitHub UI targeting 'dev' branch
```

### 6. Code Review Process
- At least **one approving review** required
- Address all review comments
- Re-request review after making changes
- Ensure all tests and checks pass

### 7. Merging
- Merge feature branches into `dev` after approval
- Merge `dev` into `main` only for production releases

## Pull Request Guidelines

- Provide clear description of changes
- Link related issues if applicable
- Keep PRs focused and reasonably sized
- Ensure all tests pass
- Target `dev` branch (not `main`) for feature PRs

## Code Style

- **React** - Functional components with hooks
- **JavaScript/JSX** - Follow ESLint configuration
- **Styling** - Follow existing patterns
- **Components** - Reusable, single responsibility
- **Accessibility** - Maintain WCAG 2.1 standards
- **Testing** - Write Vitest tests for components

## Feature Branch Naming Convention

Use consistent `feature/` prefix for all feature branches:

✅ **Good:**
- `feature/diagram-generator`
- `feature/accessibility-improvements`
- `feature/performance-optimization`

❌ **Avoid:**
- `testing` (too generic)
- `my-changes` (unclear purpose)
- `fix` (not descriptive)

## Project Structure

```
/src
  /components  - React components
  /data        - Data files (barriers, themes, resources)
  /__tests__   - Test suites
/public        - Static assets
/e2e           - End-to-end tests
```

## Testing

- **Unit Tests**: Vitest for component testing
- **E2E Tests**: Playwright for end-to-end testing
- **Performance Tests**: Performance benchmarks
- **Coverage**: Aim for good test coverage on critical paths

## Getting Help

- Check existing documentation
- Review similar code in the codebase
- Ask team members for clarification
- Create an issue for bugs or feature requests

## Important Notes

- **Accessibility**: This is a key priority - maintain WCAG standards
- **Performance**: Monitor bundle size and rendering performance
- **Data Management**: Resource and barrier data in JSON format
- **QR Code Generation**: Python script for generating QR variants

---

**Remember:** Even though GitHub doesn't automatically enforce branch protection, maintaining this workflow ensures code quality and prevents deployment issues.
