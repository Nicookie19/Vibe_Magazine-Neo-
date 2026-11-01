# Vitest Test Setup Documentation

## Overview
This document describes the automated test setup for the Vibe Magazine digital magazine application using Vitest with React Testing Library.

## Test Configuration

### Files Created

#### 1. Vitest Configuration (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.tsx'],
    include: ['src/**/*.{test,spec}.{js,ts,tsx,jsx}'],
    globals: true,
  },
})
```

#### 2. Test Setup (`src/test/setup.tsx`)
Global test setup with mocks for:
- **React Router DOM**: `useNavigate`, `useLocation`, `useParams`
- **Supabase Client**: Auth, database queries, edge functions, RPC
- **Lenis**: Smooth scrolling component
- **Polyfills**: `IntersectionObserver`, `matchMedia`

### Dependencies Added
```json
{
  "devDependencies": {
    "vitest": "^4.1.11",
    "@testing-library/react": "^16.3.3",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/user-event": "^14.6.7",
    "jsdom": "^29.1.1",
    "lenis": "^1.x"
  }
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui"
  }
}
```

## Test Suite Summary

### Test Files: 15 | Tests: 83 | All Passing

| Test File | Component | Tests | Description |
|-----------|-----------|-------|-------------|
| `Footer.test.jsx` | Footer | 6 | University info, copyright, social links, logo |
| `Navbar.test.jsx` | Navbar | 9 | Logo, navigation items, mobile menu, link paths |
| `AdminNavbar.test.jsx` | AdminNavbar | 9 | Tabs, super admin detection, logout, active state |
| `PageLayout.test.jsx` | PageLayout | 5 | Layout structure, navbar/footer rendering |
| `ProtectedRoute.test.jsx` | ProtectedRoute | 8 | Active staff access, denied profiles, auth changes, loading and errors |
| `HorizontalScrollCarousel.test.jsx` | HorizontalScrollCarousel | 4 | Carousel rendering, card titles, image URLs |
| `SmoothScrollHero.test.jsx` | SmoothScrollHero | 3 | Hero section, schedule items, dates/locations |
| `TextParallaxContent.test.jsx` | TextParallaxContentExample | 4 | Heading, content, button rendering |
| `BlurText.test.jsx` | BlurText | 8 | Text splitting, animation props, direction handling |
| `MagazineContext.test.jsx` | MagazineContext | 3 | Provider state, remove magazine, re-renders |

Additional regression coverage:

| Test File | Tests | Description |
|-----------|-------|-------------|
| `supabaseClient.test.js` | 12 | Authentication helpers and client calls |
| `utils/colorUtils.test.js` | 6 | Hex color conversion |
| `pages/ConfirmSignup.test.jsx` | 2 | Invalid confirmation links and verified success |
| `pages/MagazineReader.test.jsx` | 2 | Missing magazine and missing route-state handling |
| `pages/AdminDashboard/AdminSubmissions.test.jsx` | 2 | Publishing without email delivery; denied acceptance does not publish |

Counts above were verified on 2026-11-01. These tests mock backend services; passing them does not verify deployed database policies, OAuth configuration, or email delivery. See [PROJECT_AUDIT.md](PROJECT_AUDIT.md) for browser checks and remaining integration work.

## Running Tests

```bash
# Watch mode (development)
npm test

# Single run (CI/CD)
npm run test:run

# Visual UI
npm run test:ui
```

## Key Testing Patterns Used

### 1. Component Mocking
```typescript
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  useScroll: () => ({ scrollYProgress: { current: 0 } }),
  useTransform: (source, input, output) => output[0],
}))
```

### 2. Supabase Mocking
```typescript
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), ... })),
    functions: { invoke: vi.fn() },
    rpc: vi.fn(),
  }),
}))
```

### 3. Router Wrapper
```typescript
const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>)
```

### 4. Async Testing
```typescript
await waitFor(() => {
  expect(screen.getByTestId('protected-content')).toBeInTheDocument()
}, { timeout: 3000 })
```

## Test Coverage Areas

✅ **Covered:**
- Core UI components (Navbar, Footer, PageLayout)
- Authentication flow (ProtectedRoute)
- Admin navigation (AdminNavbar)
- Animation components (BlurText, HorizontalScrollCarousel, SmoothScrollHero, TextParallaxContent)
- Context providers (MagazineContext)
- Utility functions (`colorUtils.test.js`) and authentication helpers (`supabaseClient.test.js`)

❌ **Not Yet Covered:**
- Comprehensive main-page and form flows (reader and email-confirmation error paths have regression coverage)
- Admin dashboard pages (AdminDashboard, AdminLogin, AdminPanel)
- Comprehensive admin actions (submission acceptance has regression coverage)
- Supabase edge functions
- Form validation and submission flows

## Future Enhancements

1. **Add page-level tests** - Test main pages with mocked Supabase data
2. **Add admin dashboard tests** - Test admin tabs with mocked data
3. **Add integration tests** - Test user flows (login → dashboard → upload)
4. **Add E2E tests** - Use Playwright for full browser testing
5. **Add coverage reporting** - Configure `vitest --coverage`
6. **Add CI integration** - GitHub Actions workflow for automated testing