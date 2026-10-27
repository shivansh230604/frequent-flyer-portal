# ENG-163087: Digital End-to-End Frequent Flyer Portal

> **Priority:** P1  
> **Target Audience:** Airline Floor Operations Staff & Executive Operations Management  
> **Status:** Production-Ready & Code-Frozen  

A resilient, accessible, monochromatic digital portal replacing legacy paper and spreadsheet tracking for airline floor operations and management.

---

## 1. Quick Start & Setup

### Prerequisites
* **Node.js** v18+ (tested on Node v20/v24)
* **npm** v9+

### Installation
```bash
# Install dependencies
npm install
```

### Running Locally
```bash
# Start local development server with Vite
npm run dev

# Open browser at http://localhost:5173
```

### Running Tests
```bash
# Run the full Vitest suite (all 27 tests across 7 suites)
npm test

# Run tests in watch mode
npm run test:watch
```

### Linting & Code Quality
```bash
# Run full strict ESLint (including JSX accessibility checks and no-unused-vars)
npx eslint src
```

### Production Build & Preview
```bash
# Compile TypeScript and bundle production assets
npm run build

# Preview production build locally
npm run preview
```

---

## 2. Roles & Architecture

Both views share **one single unified data source** via React Context (`PortalContext`), guaranteeing real-time state synchronization with zero data loss.

### 1. Floor Staff View (`/`)
* **Real-time Member Directory:** Instant member search by name, email, tier, or membership ID without blocking loading screens.
* **Member Registration & Editing:** Accessible modal dialog with real-time field validation, `aria-invalid` signaling, and explicit error labels.
* **Points Transaction Logging:** Quick-log points earned or redeemed, immediately updating the member's balance and transaction history.
* **Operator Shift Notes:** Integrated station notes field for floor personnel handover.

### 2. Manager Dashboard (`/manager`)
* **Executive Metrics:** High-level operational summary including Total Registered Members, Tier Breakdown (Platinum, Gold, Silver, Bronze), and Points Issued vs. Redeemed.
* **Searchable & Sortable Table:** Semantic `<table>` with accessible `<th scope="col">` column headers, sortable by Name, Email, Tier, Points, and Join Date.
* **Recent Activity Log:** Live transaction audit trail tracking all earn and redeem events with member IDs and timestamps.

### 3. Role Switcher
* Located in the persistent header navigation (`<nav aria-label="Role navigation">`).
* Allows instantaneous switching between Staff and Manager views without authentication barriers for floor demonstration and review.

---

## 3. Simulated Data Layer & Failure-Toggle for Testing

The portal operates on a client-side mock persistence layer (`src/services/mockApi.ts`) that persists to browser `localStorage` without requiring external backend servers or storing real PII.

* **Artificial Network Latency:** Simulates realistic slow 3G network conditions (`setTimeout`) during initial data fetch and operations.
* **Failure Simulation Toggle:** An accessible toggle switch in the portal header (**"Simulate Network Failure"**) immediately forces the API layer to reject operations.
* **Error Recovery Flow:** When an operation fails, the portal renders an accessible alert (`role="alert"`, `aria-live="assertive"`) featuring a **"Retry"** button. Disabling the failure toggle and clicking "Retry" re-triggers and recovers the failed operation.

---

## 4. Strict Monochromatic Corporate Design System

The application strictly enforces a high-contrast corporate palette defined exclusively in [`src/styles/tokens.css`](file:///d:/prodesk%20Priority%20Module%20End-to-End%20Frequent%20Flyer%20Portal/src/styles/tokens.css):

```css
:root {
  /* Strict Monochromatic Palette */
  --color-white: #FFFFFF;
  --color-gray-50: #F5F5F5;
  --color-gray-200: #E5E5E5;
  --color-gray-400: #A3A3A3;
  --color-gray-600: #737373;
  --color-gray-800: #404040;
  --color-gray-900: #171717;

  /* The Single Allowed Color Exception: Invalid Fields ONLY */
  --color-error: #B00020;

  /* Spacing Tokens in 16px Steps */
  --space-1: 16px;
  --space-2: 32px;
  --space-3: 48px;
}
```

### Design Constraints
* **No Unauthorized Colors:** Zero hex, RGB, HSL, or named colors exist outside `tokens.css`. This is verified by an automated CI test (`src/test/designTokens.test.ts`).
* **Single Color Exception:** `--color-error` (`#B00020`) is strictly reserved for invalid input borders and error text.
* **16px Spacing Grid:** All padding and margin values strictly use `--space-1`, `--space-2`, `--space-3`, or `0`.
* **WCAG AA Contrast:** Body text uses `--color-gray-800` or `--color-gray-900` on white/gray backgrounds, exceeding WCAG AA minimum contrast ratio (4.5:1).

---

## 5. Security & NFRs

* **DOMPurify Sanitization:** All text inputs are sanitized through `DOMPurify` before entering application state or persistence layer, neutralizing malicious `<script>` tags, event handlers (`onerror`), and pseudoprotocol URLs (`javascript:`).
* **Analytics Telemetry:** Every completed primary action logs formatted operational telemetry to the console:
  `[Analytics] User interacted with End-to-End Frequent Flyer Portal: <action_name>`
* **Accessibility Excellence:** Achieves a **100/100 Lighthouse Accessibility score** and **0 axe-core violations** across both Staff and Manager pages with full keyboard navigability and visible focus indicators.
* **Privacy Assurance:** Zero real PII, API keys, or credentials exist in the source code. All member profiles utilize mock demonstrative data.

---

## 6. Next Steps: Production Authentication

For enterprise deployment, the client-side role switcher should be upgraded with:
1. **Enterprise Single Sign-On (SSO):** Integration with SAML 2.0 / OpenID Connect (e.g., Okta, Azure AD, or Ping Identity).
2. **Role-Based Access Control (RBAC):** Server-side JWT authentication enforcing staff station claims and manager managerial clearances.
3. **Audit Log Encryption:** Transitioning client `localStorage` records to an encrypted, append-only backend data store.
