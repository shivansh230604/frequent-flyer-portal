# PROMPTS.md

Ticket: ENG-163087, End-to-End Frequent Flyer Portal
Tool: Antigravity (AI assistant). Workflow: TDD (Red, then Green, then Polish).

---

## Prompt 1: Setup, design tokens, and failing tests (TDD Red phase)

**Prompt sent:**

```
You are my AI pair programmer. I act as Product Manager. We are building ticket
ENG-163087: a digital End-to-End Frequent Flyer Portal for an airline client whose
floor staff currently use paper and Excel, causing data loss. Priority P1.
Do NOT write implementation code yet. This step is setup + failing tests only.

TECH STACK
React + Vite + TypeScript, Vitest + React Testing Library, vitest-axe,
eslint-plugin-jsx-a11y, DOMPurify, react-router, plain CSS with CSS variables.
No real backend: create a mock data layer with artificial delay (setTimeout) and a
switch to simulate failure. Persist to localStorage. No real API keys or PII anywhere.

ROLES
- Staff user (route "/"): search members, add/edit member, log points earned/redeemed.
- Manager (route "/manager"): read-only dashboard: total members, members per tier,
  points issued vs redeemed, searchable/sortable members table (real <table> with
  <th scope>), recent activity log. Add a Staff/Manager switcher in the header
  (no real login).
- Both views share ONE data source via React Context so data is consistent.
- Data model: Member {id, name, email, tier, points, joinDate};
  Transaction {memberId, points, type: "earn" | "redeem", date}.

ACCEPTANCE CRITERIA TO TEST
Happy path:
1. The portal interface renders clearly with headings and a primary task.
2. Inputs respond immediately (no blocking loading screens for local interactions).
3. Manager outputs always use the same consistent data structure.
Unhappy path:
4. Empty list or empty search result shows a friendly "No data found" message,
   never a blank screen.
5. Every async operation shows a visible loading indicator (assume slow 3G);
   failed operations show a clear error message with a retry button.
6. Submitting a form with missing/malformed data is blocked and the offending
   fields are highlighted in red (aria-invalid + visible error text, not color alone).
NFRs:
7. Accessibility: vitest-axe reports zero violations on every page; all buttons and
   inputs have accessible names/ARIA labels; everything is keyboard navigable
   (tab order, visible focus, Enter/Space activation); target 100% Lighthouse a11y.
8. Telemetry: on every completed primary action, console.log a message like
   "[Analytics] User interacted with End-to-End Frequent Flyer Portal" (include the
   action name).
9. Security: all text inputs are sanitized with DOMPurify BEFORE being stored in
   state; test that "<script>alert(1)</script>" and "<img onerror=...>" are neutralized.

DESIGN SYSTEM (strict, monochromatic corporate)
Create src/styles/tokens.css as the ONLY place hex colors may appear:
  --color-white: #FFFFFF;   --color-gray-50: #F5F5F5;  --color-gray-200: #E5E5E5;
  --color-gray-400: #A3A3A3; --color-gray-600: #737373; --color-gray-800: #404040;
  --color-gray-900: #171717;
  --color-error: #B00020;  (the single allowed exception, used ONLY for invalid fields)
Spacing tokens in 16px steps: --space-1: 16px; --space-2: 32px; --space-3: 48px.
Rules: no hex/rgb/hsl values or named colors anywhere else; all padding/margins use
spacing tokens; no inline color styles; no other accent colors. Text must meet
WCAG AA contrast (use gray-600 or darker for text on white; gray-400 for borders only).
Add a test or lint check that scans src/ for hex colors outside tokens.css.

TASK NOW
1. Scaffold the project and folder structure.
2. Write tokens.css.
3. Write the full test suite covering criteria 1-9 and the design-token check.
4. Run the tests and show me that they FAIL (red). Do not implement features yet.
Explain what each test file covers.
```

**Result:**
- Scaffolded React + Vite + TypeScript with Vitest, React Testing Library, vitest-axe, eslint-plugin-jsx-a11y, DOMPurify.
- Created src/styles/tokens.css (grayscale palette, one error color, 16px-step spacing).
- Wrote 6 test files covering Acceptance Criteria 1-9 plus a hex-color scan.
- Test run: 17 failed, 5 passed (expected, since nothing is implemented yet).
- Issue noted: hex-color test failed because of Vite starter boilerplate CSS. Fixed in Prompt 2.

---

## Prompt 2: Implementation (TDD Green phase)

**Prompt sent:**

```
The tests are written and failing (17 failed, 5 passed). Now move from Red to Green.
Write the minimum implementation to make ALL tests pass, one feature at a time, and
run the tests after each one and report results:
1. src/utils/sanitize.ts (DOMPurify) and src/utils/telemetry.ts
2. src/services/mockApi.ts (localStorage persistence, artificial delay, failure toggle)
3. src/context/PortalContext.tsx (shared data layer for both roles)
4. Components: Header (Staff/Manager switcher), StaffPortal, ManagerDashboard,
   MemberFormModal, PointsModal
5. Global styling using ONLY tokens.css variables.

Also: remove or rewrite the Vite starter boilerplate CSS (App.css, index.css) so no
hex, rgb, hsl or named colors exist outside tokens.css. All padding and margins must
use --space-1/2/3. The error red is used ONLY for invalid fields.

Requirements: semantic HTML (main, nav, table with th scope, label for), aria-labels on
all interactive elements, aria-live regions for loading and errors, visible focus
outline, empty states showing "No data found", loading indicators on every async call,
error alerts with a Retry button.

Do NOT edit the tests to make them pass. If a test seems wrong, tell me instead.
```

**Result:**
- Implemented sanitize.ts (DOMPurify), telemetry.ts, mockApi.ts (localStorage, delay, failure toggle), PortalContext.tsx, and the Header, StaffPortal, ManagerDashboard, MemberFormModal and PointsModal components.
- Removed Vite boilerplate CSS; no colors outside tokens.css.
- Test run: 6 of 6 files, 22 of 22 tests passing.
- a11y lint: 0 errors, 0 warnings. Production build succeeded.

---

## Recovery prompts

**Issue:** With "Simulate Network Failure" enabled, clicking Save Member or Submit Points in modals provided no visible feedback because the error alert was rendered behind the modal backdrop and only appeared after canceling.

**Prompt sent:**
```
That approach caused a usability problem. With "Simulate Network Failure" ticked, clicking
Save Member in the Add/Edit Member modal shows no visible feedback, because the error
banner is rendered behind the modal overlay and only appears after Cancel. Let's fix it:
1. While a save is in progress, show a loading indicator inside the modal and disable the
   Save button to prevent repeated clicks.
2. If the save fails, show the error message inside the modal (role="alert") with a Retry
   button, and keep all entered form data.
3. Apply the same behavior to the Log Points modal.
4. On success, close the modal as before.
Use only tokens.css variables (no new colors). Do not add new features and do not edit the
existing tests. Run the tests, full ESLint and the build afterward and report results.
```

**Outcome:**
- Added in-modal loading indicator (`role="status"`) and disabled submit buttons during async save/log operations in both MemberFormModal and PointsModal.
- Added in-modal error alert (`role="alert"`) with a Retry button upon failure while preserving all user-entered form data.
- Styled in-modal feedback elements strictly using `tokens.css` variables.
- Verified: All 22 tests passing, full ESLint clean (0 errors, 0 warnings), production build succeeded.

---

## Prompt 3: Final polish and code freeze

**Prompt sent:**

```
Execute the code freeze. Do the following and report each result:
1. Run the FULL ESLint (not just the a11y rules): fix to ZERO warnings and remove
   unused imports.
2. Run the full test suite: all passing.
3. Run the hex-color scan: confirm no colors outside tokens.css.
4. Run a Lighthouse accessibility audit on both the Staff and Manager pages: fix until
   the score is 100 (never below 90). Also report the Performance score.
5. Confirm no API keys, secrets, or real PII in the source.
6. Run the production build (npm run build) and confirm it succeeds.
7. Write a README with setup steps, the role switcher, the failure-toggle for testing,
   the single error-color exception, and a note that real authentication would be the
   next step.
Do not add new features and do not edit the tests to make them pass.
```

**Result:**
- Full ESLint: 0 errors, 0 warnings, no unused imports.
- Tests: 22 of 22 passing.
- Hex-color scan: no colors outside tokens.css.
- Lighthouse accessibility: 100 (Staff), 100 (Manager). Performance: 85 (Staff), 94 (Manager).
- No API keys, secrets or real PII found (mock data only).
- Production build succeeded.
- README.md written (setup, role switcher, failure toggle, error-color exception, auth as next step).