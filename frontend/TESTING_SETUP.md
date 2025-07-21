# Frontend Testing Setup

This document describes the Jest and React Testing Library configuration for the frontend testing suite.

## Overview

The frontend uses Jest with React Testing Library for unit and integration testing. The setup includes:

- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **Jest DOM**: Custom jest matchers for DOM testing
- **User Event**: Utilities for simulating user interactions

## Configuration Files

### `jest.config.js`
Main Jest configuration using Next.js Jest setup:
- Test environment: `jest-environment-jsdom`
- Setup files: `jest.setup.js`
- Module mapping for `@/` alias
- Coverage configuration
- Excludes Playwright tests from Jest

### `jest.setup.js`
Test setup file that:
- Imports Jest DOM matchers
- Mocks Next.js navigation hooks
- Provides global test utilities

### `package.json` Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Test Structure

### Components Tests
Located in `src/components/__tests__/`

Example component test:
```typescript
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Hooks Tests
Located in `src/hooks/__tests__/`

Example hook test:
```typescript
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })
})
```

### Services Tests
Located in `src/services/__tests__/`

Example service test:
```typescript
import { authService } from '@/services/authService'

// Mock axios
jest.mock('@/lib/axiosInstance', () => ({
  post: jest.fn(),
  get: jest.fn(),
}))

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have login method', () => {
    expect(typeof authService.login).toBe('function')
  })
})
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- Button.test.tsx
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="should render"
```

## Best Practices

### Component Testing
1. **Test behavior, not implementation**: Focus on what the user sees and does
2. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Mock external dependencies**: Mock API calls, external libraries
4. **Test user interactions**: Use `fireEvent` or `userEvent` for interactions

### Hook Testing
1. **Use `renderHook`**: For testing custom hooks in isolation
2. **Test state changes**: Verify hook state updates correctly
3. **Mock dependencies**: Mock external services or context providers
4. **Use fake timers**: For hooks that use setTimeout, setInterval

### Service Testing
1. **Mock HTTP client**: Mock axios or fetch calls
2. **Test API contract**: Verify correct endpoints and payloads
3. **Test error handling**: Verify error scenarios
4. **Mock external dependencies**: Mock authentication, storage, etc.

## Mocking Patterns

### Next.js Router
Already mocked in `jest.setup.js`:
```typescript
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
}))
```

### Axios Instance
```typescript
jest.mock('@/lib/axiosInstance', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}))
```

### Zustand Store
```typescript
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}))
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory when running:
```bash
npm run test:coverage
```

The configuration collects coverage from:
- `src/**/*.{js,jsx,ts,tsx}`
- Excludes type definitions and story files

## Integration with CI/CD

Tests can be integrated into CI/CD pipelines:
```bash
# In Docker
RUN npm test -- --passWithNoTests --watchAll=false

# In GitHub Actions
- name: Run tests
  run: npm test -- --passWithNoTests --watchAll=false
```

## Troubleshooting

### Common Issues

1. **Module not found errors**: Check module mapping in `jest.config.js`
2. **DOM not available**: Ensure `jest-environment-jsdom` is configured
3. **Async operations**: Use `waitFor` for async operations
4. **Timer issues**: Use `jest.useFakeTimers()` for timer-based code

### Debugging Tests
```bash
# Run with verbose output
npm test -- --verbose

# Run single test file
npm test -- --testPathPattern=Button.test.tsx

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```
