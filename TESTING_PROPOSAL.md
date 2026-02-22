# Comprehensive Testing Proposal: Project Delivery Toolkit

## 1. Current State Assessment

### Project Overview
**Name:** Project Delivery Toolkit (project-delivery-toolkit)
**Type:** Single-Page Application (SPA)
**Purpose:** Interactive data visualization tool for exploring barrier themes and resources in the Project Delivery Toolkit

### Technologies & Frameworks Identified

**Core Stack:**
- React 19.1.1 + React DOM 19.1.1
- JavaScript (JSX) - No TypeScript
- Vite 7.1.7 (build tool & dev server)

**UI & Visualization:**
- TailwindCSS 3.4.17 (styling)
- Recharts 3.2.1 (donut chart visualization)

**Data Processing:**
- PapaParse 5.5.3 (client-side CSV parsing)
- csv-parse 6.1.0 (build-time CSV processing)
- node-fetch 3.3.2 (data fetching)

**Code Quality:**
- ESLint 9.36.0 with React plugins configured

### Existing Test Coverage Status

**❌ CRITICAL: ZERO TEST COVERAGE**

- No test files exist
- No test framework installed
- No test scripts in package.json
- No test directories
- No coverage reporting tools
- No CI/CD testing pipeline

### Architecture Analysis

**Source Files:**
- **Main Application:** `src/App.jsx` (694 lines) - **MONOLITHIC COMPONENT**
- **Entry Point:** `src/main.jsx`
- **Build Script:** `scripts/build-data.mjs` (53 lines)
- **Data Files:** `src/data/*.json` (generated at build time)

**Key Concerns:**
1. All business logic concentrated in single 694-line component
2. Mixed concerns: UI, state management, data transformation, URL handling
3. Build-time data fetching from external Google Sheets
4. No separation between pure functions and stateful logic

---

## 2. Testing Strategy

### Recommended Testing Pyramid

```
         /\
        /E2E\          10% - End-to-End (Critical user flows)
       /------\
      /Integr-\        20% - Integration (Component interactions)
     /----------\
    /----Unit----\     70% - Unit (Pure functions, utilities)
   /--------------\
```

### Testing Approach by Layer

#### **A. Unit Testing (Priority: HIGH)**
Test pure functions and isolated utilities:
- Color manipulation (`lighten` function in App.jsx:21-31)
- Data normalization (`toArray`, `normalizeResource` in App.jsx:35-42)
- CSV parsing and transformation (build-data.mjs)
- Data filtering logic
- URL parameter parsing/serialization

#### **B. Component Testing (Priority: HIGH)**
Test React components in isolation:
- App component rendering
- Interactive donut chart segments
- Search input behavior
- Filter checkboxes (personas)
- Theme/barrier selection logic
- Responsive header behavior

#### **C. Integration Testing (Priority: MEDIUM)**
Test component interactions and data flow:
- Search filtering + persona filtering combined
- Theme selection → barrier clearing behavior
- URL state synchronization
- Data loading and parsing
- Chart visualization with real data structures

#### **D. End-to-End Testing (Priority: MEDIUM)**
Test critical user workflows:
- Landing page → select theme → view filtered resources
- Search for resource → apply persona filter
- Share URL with filters → page loads with correct state
- Mobile responsive navigation
- Build process and data fetching

---

## 3. Recommended Testing Frameworks & Tools

### Core Testing Framework: **Vitest** ⭐ RECOMMENDED

**Why Vitest?**
- Native Vite integration (already using Vite)
- Jest-compatible API (familiar syntax)
- Fast, modern, ESM-first
- Built-in coverage with c8
- Excellent React testing support

**Alternative:** Jest (more mature, larger ecosystem)

### React Component Testing: **React Testing Library** ⭐ RECOMMENDED

**Why RTL?**
- Tests components from user perspective
- Encouraged by React team
- Prevents implementation detail testing
- Excellent accessibility testing features
- Works seamlessly with Vitest

**Alternative:** Enzyme (older, less maintained)

### E2E Testing: **Playwright** ⭐ RECOMMENDED

**Why Playwright?**
- Modern, fast, reliable
- Cross-browser testing (Chromium, Firefox, WebKit)
- Auto-waiting and retry mechanisms
- Built-in screenshot/video recording
- Excellent debugging tools

**Alternatives:** Cypress, Puppeteer

### Code Coverage: **c8** (built into Vitest)

### Visual Regression Testing: **Playwright Screenshots** (Optional)

---

## 4. Testing Roadmap

### Phase 1: Foundation (Week 1-2)

**Priority: CRITICAL**

1. **Setup Testing Infrastructure**
   - Install Vitest + React Testing Library
   - Configure test environment
   - Add test scripts to package.json
   - Setup coverage reporting

2. **Extract & Test Pure Functions**
   - Extract `lighten` color function → test
   - Extract `toArray`, `normalizeResource` → test
   - Extract URL parsing logic → test
   - Target: 20+ unit tests, 90%+ coverage on utilities

3. **Test Build Script**
   - Test CSV parsing in build-data.mjs
   - Mock fetch calls
   - Test data normalization
   - Test error handling (missing env vars)

### Phase 2: Component Testing (Week 3-4)

**Priority: HIGH**

1. **Test Core UI Components**
   - Render App with default state
   - Test search input updates
   - Test persona checkbox toggling
   - Test clear filters button

2. **Test Interactive Chart**
   - Test donut chart rendering
   - Test theme segment clicks
   - Test barrier segment clicks
   - Test single-selection behavior

3. **Test Resource Display**
   - Test resource filtering by search
   - Test filtering by personas
   - Test filtering by theme/barrier
   - Test combined filters

**Target:** 40+ component tests, 70%+ coverage on App.jsx

### Phase 3: Integration Testing (Week 5-6)

**Priority: MEDIUM**

1. **Test Data Flow**
   - Load real JSON data fixtures
   - Test end-to-end filtering pipeline
   - Test URL state persistence
   - Test dynamic header height calculations

2. **Test Edge Cases**
   - Empty search results
   - No matching filters
   - Malformed URL parameters
   - Missing data fields
   - Pipe-delimited parsing variations

**Target:** 20+ integration tests

### Phase 4: E2E Testing (Week 7)

**Priority: MEDIUM**

1. **Setup Playwright**
   - Install and configure
   - Create test fixtures

2. **Test Critical User Flows**
   - Load page → verify chart renders
   - Click theme → verify resources filtered
   - Search + filter → verify combined results
   - Copy URL → open in new tab → verify state restored
   - Mobile viewport testing

**Target:** 8-12 E2E tests covering happy paths

### Phase 5: Refactoring Support (Week 8+)

**Priority: ENHANCEMENT**

1. **Enable Safe Refactoring**
   - Use tests to split App.jsx into smaller components
   - Extract custom hooks (useURLState, useResourceFilter)
   - Extract chart logic into separate module
   - Maintain 100% passing tests during refactor

---

## 5. Priority Areas to Test First

### 🔴 Critical (Must Test Immediately)

1. **Data Normalization** (App.jsx:35-42, build-data.mjs:32-44)
   - Pipe-delimited field parsing
   - CSV → JSON transformation
   - Fallback handling for missing fields

2. **Single-Selection Logic** (App.jsx:86-95)
   - Theme selection clears barrier
   - Barrier selection clears theme
   - Toggle deselection behavior

3. **Resource Filtering** (App.jsx:101-150)
   - Search text matching
   - Persona filtering
   - Theme/barrier filtering
   - Combined filter logic

4. **URL State Management** (App.jsx:64-83)
   - Reading URL params on load
   - Writing state to URL
   - Handling malformed params

### 🟡 High Priority

5. **Color Utilities** (App.jsx:20-31)
   - Lighten function correctness
   - Hex parsing variations (3-char vs 6-char)

6. **Chart Rendering**
   - Correct data structure for Recharts
   - Segment click handlers
   - Hover states

7. **Build Process**
   - Environment variable validation
   - Network error handling
   - File write operations

### 🟢 Medium Priority

8. **Responsive Behavior**
   - Dynamic header height
   - Mobile layout
   - Font size adjustments

9. **Accessibility**
   - Keyboard navigation
   - ARIA labels
   - Focus management

---

## 6. Implementation Plan

### Step 1: Install Testing Dependencies

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Step 2: Create Vitest Configuration

**File:** `vitest.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '*.config.js',
        'scripts/',
        'dist/'
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75
      }
    }
  }
});
```

### Step 3: Create Test Setup File

**File:** `src/test/setup.js`

```javascript
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Step 4: Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "lint": "eslint .",
    "preview": "vite preview",
    "prebuild": "node scripts/build-data.mjs",
    "build": "node scripts/build-data.mjs && vite build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

### Step 5: Suggested Test Directory Structure

```
src/
├── test/
│   ├── setup.js                     # Global test setup
│   ├── fixtures/
│   │   ├── mockResources.json      # Test data fixtures
│   │   ├── mockBarriers.json
│   │   └── mockThemes.json
│   ├── utils/
│   │   └── testHelpers.js          # Custom render functions
│   └── __tests__/
│       ├── unit/
│       │   ├── utils.test.js       # Pure function tests
│       │   └── dataTransform.test.js
│       ├── component/
│       │   ├── App.test.jsx        # Component tests
│       │   └── Chart.test.jsx
│       └── integration/
│           ├── filtering.test.jsx   # Integration tests
│           └── urlState.test.jsx
scripts/
└── __tests__/
    └── build-data.test.mjs         # Build script tests
e2e/
├── playwright.config.js
└── tests/
    ├── userFlows.spec.js
    └── responsive.spec.js
```

### Step 6: Example Test Files

**File:** `src/test/__tests__/unit/utils.test.js`

```javascript
import { describe, it, expect } from 'vitest';

// Extract these functions from App.jsx first
function lighten(hex, amt = 0.3) {
  let c = hex?.replace("#", "") || "64748b";
  if (c.length === 3) c = c.split("").map(ch => ch + ch).join("");
  const n = parseInt(c, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.min(255, Math.round(r + (255 - r) * amt));
  g = Math.min(255, Math.round(g + (255 - g) * amt));
  b = Math.min(255, Math.round(b + (255 - b) * amt));
  const h = (v) => v.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

const toArray = (v) =>
  Array.isArray(v)
    ? v
    : (typeof v === "string" ? v.split("|").map(s => s.trim()).filter(Boolean) : []);

describe('lighten', () => {
  it('should lighten a 6-character hex color', () => {
    const result = lighten('#2563eb', 0.3);
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    expect(result).not.toBe('#2563eb');
  });

  it('should handle 3-character hex colors', () => {
    const result = lighten('#abc', 0.3);
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('should handle missing # prefix', () => {
    const result = lighten('2563eb', 0.3);
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('should return default color for null input', () => {
    const result = lighten(null, 0.3);
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('toArray', () => {
  it('should split pipe-delimited string', () => {
    expect(toArray('Project|Programme|Business')).toEqual(['Project', 'Programme', 'Business']);
  });

  it('should trim whitespace', () => {
    expect(toArray(' Project | Programme ')).toEqual(['Project', 'Programme']);
  });

  it('should return array unchanged', () => {
    expect(toArray(['Project', 'Programme'])).toEqual(['Project', 'Programme']);
  });

  it('should return empty array for empty string', () => {
    expect(toArray('')).toEqual([]);
  });

  it('should filter empty values', () => {
    expect(toArray('Project||Business')).toEqual(['Project', 'Business']);
  });
});
```

**File:** `src/test/__tests__/component/App.test.jsx`

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Project Delivery Toolkit/i)).toBeInTheDocument();
  });

  it('should update search input', async () => {
    const user = userEvent.setup();
    render(<App />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'test query');

    expect(searchInput).toHaveValue('test query');
  });

  it('should toggle persona filter', async () => {
    const user = userEvent.setup();
    render(<App />);

    const projectCheckbox = screen.getByLabelText(/project/i);
    await user.click(projectCheckbox);

    expect(projectCheckbox).toBeChecked();
  });

  it('should clear all filters', async () => {
    const user = userEvent.setup();
    render(<App />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'test');

    const clearButton = screen.getByText(/clear/i);
    await user.click(clearButton);

    expect(searchInput).toHaveValue('');
  });
});
```

**File:** `scripts/__tests__/build-data.test.mjs`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fetch from 'node-fetch';

vi.mock('node-fetch');

describe('build-data script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse CSV correctly', async () => {
    const mockCsv = 'id,title,url\n1,Test,http://test.com';
    fetch.mockResolvedValueOnce({
      text: async () => mockCsv
    });

    // Test CSV parsing logic
    const { parse } = await import('csv-parse/sync');
    const result = parse(mockCsv, { columns: true, skip_empty_lines: true });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: '1', title: 'Test', url: 'http://test.com' });
  });

  it('should split pipe-delimited values', () => {
    const splitPipes = (s) =>
      s ? s.split('|').map(v => v.trim()).filter(Boolean) : [];

    expect(splitPipes('Project|Programme')).toEqual(['Project', 'Programme']);
    expect(splitPipes('')).toEqual([]);
    expect(splitPipes(null)).toEqual([]);
  });
});
```

### Step 7: E2E Testing Setup (Playwright)

```bash
npm install -D @playwright/test
npx playwright install
```

**File:** `playwright.config.js`

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**File:** `e2e/tests/userFlows.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test('should load and display donut chart', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('svg')).toBeVisible();
});

test('should filter resources by search', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[type="search"]', 'data');
  await expect(page.locator('.resource-item')).toHaveCount(expect.any(Number));
});

test('should persist filters in URL', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[type="search"]', 'test');

  const url = page.url();
  expect(url).toContain('q=test');
});

test('should select theme and update resources', async ({ page }) => {
  await page.goto('/');

  // Click on a theme segment
  await page.locator('svg path').first().click();

  // Verify URL updated
  await expect(page).toHaveURL(/theme=/);
});
```

---

## 7. Coverage Goals

### Target Coverage Levels

**Overall Project: 75%+ coverage**

Breakdown by module:

| Module | Target Coverage | Priority | Rationale |
|--------|----------------|----------|-----------|
| Pure utility functions | 95%+ | Critical | Easy to test, zero dependencies |
| Data transformation | 90%+ | Critical | Core business logic |
| Build script | 80%+ | High | Affects all builds |
| App.jsx business logic | 75%+ | High | Core application |
| React rendering | 60%+ | Medium | Some boilerplate OK to skip |
| Chart visualization | 60%+ | Medium | Library handles much |
| CSS/Styles | 0% | N/A | Not measured |

### Measuring Coverage

```bash
# Run tests with coverage
npm run test:coverage

# Generate HTML report
npm run test:coverage -- --reporter=html

# Open coverage report
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

### Coverage Enforcement

Coverage thresholds are configured in `vitest.config.js`:

```javascript
coverage: {
  thresholds: {
    lines: 75,
    functions: 75,
    branches: 70,
    statements: 75
  }
}
```

Tests will fail if coverage drops below these thresholds.

### Tracking Coverage Over Time

1. **Baseline Measurement**
   - Run initial coverage after Phase 1
   - Document starting point (likely 0%)
   - Set incremental goals (20%, 40%, 60%, 75%)

2. **CI/CD Integration**
   - Coverage reports generated on every PR
   - Block PRs that decrease coverage
   - Track trends over time

3. **Coverage Badges**
   - Add coverage badge to README
   - Update automatically via CI/CD
   - Visible indicator of project health

### CI/CD Integration

Add to GitHub Actions workflow (`.github/workflows/test.yml`):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
      - name: Coverage Comment
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## 8. Best Practices & Guidelines

### Testing Philosophy

1. **Test Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal state directly
   - Use accessible queries (getByRole, getByLabelText)

2. **Arrange-Act-Assert Pattern**
   ```javascript
   it('should filter resources by persona', () => {
     // Arrange: Setup test data
     const resources = [/* ... */];

     // Act: Perform action
     render(<App />);
     userEvent.click(screen.getByLabelText('Project'));

     // Assert: Verify outcome
     expect(screen.getAllByRole('article')).toHaveLength(5);
   });
   ```

3. **Test One Thing Per Test**
   - Each test should verify single behavior
   - Makes failures easier to diagnose
   - Improves test maintainability

### Naming Conventions

```javascript
// Good test names
describe('Resource filtering', () => {
  it('should show only resources matching search term', () => {});
  it('should show all resources when search is empty', () => {});
  it('should be case-insensitive', () => {});
});

// Bad test names
describe('Tests', () => {
  it('works', () => {});
  it('test 2', () => {});
});
```

### Mock Data Management

1. **Create Realistic Fixtures**
   - Use subset of real data structure
   - Include edge cases (null, empty arrays, special chars)

2. **Centralize Test Data**
   - Store in `src/test/fixtures/`
   - Reuse across multiple tests
   - Keep DRY

3. **Mock External Dependencies**
   ```javascript
   vi.mock('./data/resources.json', () => ({
     default: mockResources
   }));
   ```

### Debugging Tests

```javascript
// Use debug utilities
import { render, screen, debug } from '@testing-library/react';

test('example', () => {
  render(<App />);
  screen.debug(); // Prints DOM
  screen.logTestingPlaygroundURL(); // Opens playground
});
```

### Performance Considerations

1. **Parallelize Tests**
   - Vitest runs tests in parallel by default
   - Keep tests isolated and independent

2. **Use beforeEach Wisely**
   - Reset state between tests
   - Don't overuse expensive setup

3. **Lazy Load Heavy Dependencies**
   ```javascript
   const { someHeavyFunction } = await import('./heavy');
   ```

### Common Pitfalls to Avoid

#### ❌ **Pitfall 1: Testing Implementation Details**

```javascript
// BAD - Testing internal state
expect(wrapper.state('selectedTheme')).toBe('leadership');

// GOOD - Testing user-visible behavior
expect(screen.getByText('Leadership & Alignment')).toHaveClass('selected');
```

#### ❌ **Pitfall 2: Not Cleaning Up After Tests**

```javascript
// BAD - Side effects leak between tests
it('test 1', () => {
  localStorage.setItem('theme', 'dark');
  // ... test code
});

// GOOD - Clean up after each test
afterEach(() => {
  localStorage.clear();
  cleanup();
});
```

#### ❌ **Pitfall 3: Using Wrong Queries**

```javascript
// BAD - Brittle, breaks on refactoring
screen.getByTestId('submit-button');

// GOOD - User-centric, accessible
screen.getByRole('button', { name: /submit/i });
```

#### ❌ **Pitfall 4: Not Waiting for Async Updates**

```javascript
// BAD - Race condition
userEvent.click(button);
expect(screen.getByText('Success')).toBeInTheDocument();

// GOOD - Wait for async update
await userEvent.click(button);
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

#### ❌ **Pitfall 5: Over-Mocking**

```javascript
// BAD - Mocking everything defeats the purpose
vi.mock('recharts', () => ({ Pie: () => null }));
vi.mock('./data/resources.json', () => ({ default: [] }));

// GOOD - Only mock external dependencies (network, timers)
vi.mock('node-fetch');
```

#### ❌ **Pitfall 6: Snapshot Testing UI**

```javascript
// BAD - Brittle, hard to review changes
expect(wrapper).toMatchSnapshot();

// GOOD - Test specific behavior
expect(screen.getByRole('heading')).toHaveTextContent('Project Delivery Toolkit');
```

### Tech Stack-Specific Recommendations

#### **React 19 Specific**

1. **Use React Testing Library's `user-event` over `fireEvent`**
   ```javascript
   // Simulates real user interactions better
   await userEvent.click(button);
   ```

2. **Test Concurrent Features Carefully**
   - React 19 has concurrent rendering
   - Use `waitFor` for state updates
   - Avoid `act()` warnings

3. **Test Hooks with `renderHook`**
   ```javascript
   import { renderHook } from '@testing-library/react';

   const { result } = renderHook(() => useCustomHook());
   ```

#### **Vite Specific**

1. **ESM Module Mocking**
   ```javascript
   // Use vi.mock with factory function
   vi.mock('./module', () => ({
     default: mockImplementation
   }));
   ```

2. **Environment Variables**
   ```javascript
   // Mock in test setup
   vi.stubEnv('RESOURCES_CSV_URL', 'http://mock.com');
   ```

3. **Fast Refresh Compatible**
   - Vitest supports HMR during development
   - Run `npm run test` in watch mode

#### **TailwindCSS Testing**

1. **Don't Test Tailwind Classes**
   ```javascript
   // BAD
   expect(element).toHaveClass('bg-blue-500 text-white');

   // GOOD - Test computed styles if needed
   expect(element).toHaveStyle({ backgroundColor: 'rgb(59, 130, 246)' });
   ```

2. **Use Semantic Queries**
   - Test accessibility, not styling
   - Use `getByRole`, `getByLabelText`

#### **Recharts Testing**

1. **Mock Recharts for Unit Tests**
   ```javascript
   vi.mock('recharts', () => ({
     PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
     Pie: ({ data }) => <div data-testid="pie">{data.length} segments</div>,
     Cell: ({ fill }) => <div style={{ fill }} />,
   }));
   ```

2. **Test Data Passed to Chart**
   ```javascript
   const { container } = render(<App />);
   const pie = container.querySelector('[data-testid="pie"]');
   expect(pie).toHaveTextContent('6 segments');
   ```

3. **Use E2E for Visual Testing**
   - Playwright for screenshot comparisons
   - Test chart renders correctly in real browser

---

## 9. Edge Cases & Error Scenarios

### Critical Edge Cases to Test

1. **Data Variations**
   - Empty resources array
   - Missing required fields (title, url, id)
   - Null/undefined values
   - Pipe-delimited fields with extra spacing
   - Single vs multiple personas/barriers

2. **URL State**
   - Malformed query parameters
   - Invalid theme/barrier IDs
   - Special characters in search
   - Very long search queries
   - Multiple parameters combined

3. **User Interactions**
   - Rapid clicking (debounce/throttle)
   - Selecting theme then barrier (single-selection)
   - Clearing filters with no filters applied
   - Searching with no results
   - Resizing viewport during interaction

4. **Build Process**
   - Missing environment variables
   - Network timeouts
   - Invalid CSV format
   - Empty CSV files
   - BOM (Byte Order Mark) handling

5. **Accessibility**
   - Keyboard-only navigation
   - Screen reader announcements
   - Focus trap in modals
   - Color contrast ratios
   - Touch target sizes (mobile)

### Example Edge Case Tests

```javascript
describe('Edge cases', () => {
  it('should handle resources with missing personas field', () => {
    const resource = { id: '1', title: 'Test', personas: undefined };
    const normalized = normalizeResource(resource);
    expect(normalized.personas).toEqual([]);
  });

  it('should handle empty search results gracefully', () => {
    render(<App />);
    userEvent.type(screen.getByRole('searchbox'), 'xyznonexistent');
    expect(screen.getByText(/no resources found/i)).toBeInTheDocument();
  });

  it('should handle network failure during build', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(main()).rejects.toThrow();
  });

  it('should handle malformed URL parameters', () => {
    window.history.pushState({}, '', '?theme=invalid&barrier=<script>');
    render(<App />);
    // Should not crash, should sanitize or ignore
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should handle very long search queries', async () => {
    const longQuery = 'a'.repeat(1000);
    render(<App />);
    await userEvent.type(screen.getByRole('searchbox'), longQuery);
    expect(screen.getByRole('searchbox')).toHaveValue(longQuery);
  });
});
```

---

## 10. Maintenance & Continuous Improvement

### Test Maintenance Strategy

1. **Keep Tests Up-to-Date**
   - Update tests when features change
   - Refactor tests alongside code
   - Remove obsolete tests

2. **Monitor Test Health**
   - Track flaky tests
   - Keep test execution time < 30s for unit/component
   - Fix broken tests immediately

3. **Review Coverage Reports Monthly**
   - Identify untested code paths
   - Prioritize high-risk areas
   - Set incremental coverage goals

### Code Review Checklist

When reviewing PRs, verify:
- [ ] New features include tests
- [ ] Tests follow naming conventions
- [ ] Coverage doesn't decrease
- [ ] Tests are isolated and don't depend on order
- [ ] Mocks are cleaned up after tests
- [ ] E2E tests updated for UI changes
- [ ] Edge cases are tested
- [ ] Tests pass in CI/CD pipeline

### Refactoring Support

Tests enable safe refactoring:

1. **Extract Components from App.jsx**
   - Write tests for current behavior
   - Extract component (e.g., `<SearchBar />`)
   - Run tests to verify behavior unchanged
   - Refactor component tests

2. **Extract Custom Hooks**
   - Test current App.jsx behavior
   - Extract hook (e.g., `useURLState`)
   - Test hook with `renderHook`
   - Verify App.jsx tests still pass

3. **Performance Optimizations**
   - Establish performance baseline with tests
   - Apply optimization (e.g., useMemo, useCallback)
   - Verify tests pass
   - Benchmark performance improvement

---

## 11. Estimated Timeline & Resources

### Implementation Timeline

| Phase | Duration | Effort | Dependencies |
|-------|----------|--------|--------------|
| Phase 1: Foundation | 2 weeks | 40 hours | None |
| Phase 2: Component Testing | 2 weeks | 40 hours | Phase 1 |
| Phase 3: Integration Testing | 2 weeks | 30 hours | Phase 2 |
| Phase 4: E2E Testing | 1 week | 20 hours | Phase 3 |
| Phase 5: Refactoring | Ongoing | Variable | Phase 2 |

**Total: 7-8 weeks, ~130 hours**

### Team Requirements

**Option A: Dedicated QA Engineer**
- 1 QA engineer full-time for 8 weeks
- Writes all tests, establishes patterns
- Trains development team

**Option B: Shared Responsibility**
- All developers write tests for their features
- 1 person owns test infrastructure setup (Week 1)
- Code review ensures test quality

### Success Metrics

Track these KPIs:
- Test coverage percentage (target: 75%+)
- Number of tests (target: 80+ total)
- Test execution time (target: <60s for full suite)
- Bug escape rate (bugs found in production)
- Deployment confidence score (team survey)

---

## 12. Risks & Mitigation

### Risk 1: Monolithic Component (App.jsx)

**Risk:** 694-line component is hard to test comprehensively

**Mitigation:**
- Start with unit tests for pure functions
- Test component behavior via user interactions
- Plan gradual refactoring once tests are in place

### Risk 2: External Data Dependencies

**Risk:** Build script fetches from Google Sheets; tests need mocks

**Mitigation:**
- Mock `node-fetch` in tests
- Create realistic fixture data
- Test both success and failure scenarios
- Consider snapshot testing for data structures

### Risk 3: Chart Library Testing

**Risk:** Recharts rendering is complex to test

**Mitigation:**
- Focus on data passed to Recharts, not rendering
- Test click handlers and callbacks
- Use E2E tests for visual verification
- Consider visual regression testing

### Risk 4: Learning Curve

**Risk:** Team may be unfamiliar with testing tools

**Mitigation:**
- Provide training sessions
- Create example tests as templates
- Pair programming for first tests
- Document testing patterns in TESTING.md

### Risk 5: Test Maintenance Burden

**Risk:** Tests become outdated and start failing

**Mitigation:**
- Enforce test updates in code reviews
- Make test failures block deployments
- Keep tests simple and focused
- Avoid testing implementation details

---

## 13. Next Steps

### Immediate Actions (This Week)

1. **Get Buy-In**
   - Share this proposal with team
   - Discuss timeline and resource allocation
   - Identify test champions

2. **Setup Environment**
   - Install Vitest and React Testing Library
   - Configure vitest.config.js
   - Add test scripts to package.json

3. **Write First Tests**
   - Test `lighten` function (easiest win)
   - Test `toArray` utility
   - Verify test runner works

### Week 1 Goals

- [ ] Complete testing infrastructure setup
- [ ] Write 10+ utility function tests
- [ ] Achieve 90%+ coverage on extracted utils
- [ ] Document testing patterns in TESTING.md

### Month 1 Goals

- [ ] 50+ total tests written
- [ ] 60%+ overall coverage
- [ ] Component tests for App.jsx
- [ ] CI/CD pipeline running tests

### Quarter 1 Goals

- [ ] 80+ total tests
- [ ] 75%+ overall coverage
- [ ] E2E tests for critical flows
- [ ] Begin refactoring App.jsx with test safety net

---

## 14. Additional Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing JavaScript (Kent C. Dodds)](https://testingjavascript.com/)

### Example Projects
- [Vitest React Example](https://github.com/vitest-dev/vitest/tree/main/examples/react)
- [Testing Library Examples](https://github.com/testing-library/react-testing-library/tree/main/examples)

### Team Training
1. **Workshop 1:** Introduction to Vitest & RTL (2 hours)
2. **Workshop 2:** Writing Effective Component Tests (2 hours)
3. **Workshop 3:** E2E Testing with Playwright (2 hours)
4. **Workshop 4:** Test-Driven Development (TDD) (2 hours)

---

## 15. Conclusion

This Project Delivery Toolkit is a well-structured, modern React application that currently has **zero test coverage**. Implementing this testing proposal will:

✅ **Reduce bugs** by catching issues before production
✅ **Increase confidence** when deploying and refactoring
✅ **Improve code quality** through testable design
✅ **Enable safe refactoring** of the monolithic App.jsx
✅ **Accelerate development** with faster feedback loops

The recommended approach uses **Vitest + React Testing Library** for unit/component tests and **Playwright** for E2E tests, leveraging the existing Vite build infrastructure.

**Priority:** Start with Phase 1 (Foundation) immediately, focusing on extracting and testing pure functions. This provides quick wins and establishes testing patterns for the team.

**Key Success Factor:** Commit to writing tests for all new features going forward. Treat tests as first-class citizens in code reviews.

---

**Document Version:** 1.0
**Created:** 2025-10-28
**Last Updated:** 2025-10-28
**Author:** Testing Proposal Analysis
