# TDD Checklist for Every Feature

## Before Writing Any Code:
- [ ] Have I written the test(s) first?
- [ ] Do my tests cover the happy path?
- [ ] Do my tests cover error cases?
- [ ] Do my tests verify multi-tenant isolation?
- [ ] Have I run the tests to ensure they fail?

## After Writing Implementation:
- [ ] Does my code make all tests pass?
- [ ] Have I written ONLY the code needed to pass tests?
- [ ] Do all existing tests still pass?
- [ ] Is my code coverage at least 80%?

## Before Submitting:
- [ ] Have I refactored for clarity?
- [ ] Do all tests still pass after refactoring?
- [ ] Have I added integration tests if needed?
- [ ] Have I updated documentation?

## For Financial Features:
- [ ] Are GL postings tested?
- [ ] Are calculations tested with multiple scenarios?
- [ ] Are rounding errors handled and tested?
- [ ] Are audit trails tested?