# Project-Specific Front-End Code Review Checklist

This checklist is tailored specifically for the **SMT AOI/SPI/Laser Daily Inspection System** UI. Use this guide during PR reviews of all new features, components, and modifications to enforce modern front-end standards, IAAP compliance, and peak web performance.

---

## 1. Accessibility (a11y) & Assistive Technology Compliance
All UI additions must align with **WCAG 2.1 AA / WCAG 2.2 AA** targets to support desktop, mobile, and screen reader (VoiceOver/NVDA) users on the production floor.

- [ ] **Semantic Structure:**
  - Avoid `div` soup. Ensure appropriate structural landmarks: `<main>`, `<header>`, `<nav>`, `<aside>`, `<section>`, and `<footer>` are used rather than generic containers.
  - Heading tags (`<h1>` to `<h6>`) must follow a strict, non-skipping descending hierarchy (e.g., never place an `<h3>` directly inside a header without an preceding `<h2>`).
- [ ] **Interactive Elements and Buttons:**
  - Every click trigger must be a semantic `<button>` or a valid `<a>` link. Never assign `onClick` handlers to `<div>` or `<span>` without adding `role="button"` and key press handlers.
  - Buttons must explicitly declare their type: `type="button"`, `type="submit"`, or `type="reset"`. (In React, the default button type inside a `<form>` is `submit`, which causes unexpected page reloads).
- [ ] **Inputs and Labels:**
  - Every `<input>`, `<select>`, or `<textarea>` must have an associated `<label>` either implicitly wrapping it or explicitly referenced via matching `id` and `htmlFor` attributes.
  - If a visible label is visually redundant, use `aria-label` or `aria-labelledby` to ensure the screen reader reads the field name (e.g., the analysis month picker input on the Home dashboard).
  - Every input must include a valid `name` and `id` to avoid React DOM reconciliation issues and screen-reader confusion.
- [ ] **Modal Focus Control:**
  - Modals (like `ConfirmModal`, `WorkflowModal`, and `ProfileModal`) must trap focus. When a modal opens:
    - Active focus must automatically move inside the modal (e.g., to the close button or first interactive control).
    - Pressing `Tab` must cycle focus *exclusively* within the modal elements.
    - Pressing `Escape` must dismiss/close the modal.
    - On close, focus must return to the element that triggered the modal.
- [ ] **Images and Media:**
  - Every graphic asset (e.g., logos, avatar images, icons) must have an explicit `alt="..."` attribute.
  - Decorative SVG icons or background shapes must include `aria-hidden="true"` so that assistive technologies ignore them.
- [ ] **Color Contrast & Focus Rings:**
  - Ensure contrast ratios are at least **4.5:1** for regular body text, and **3:1** for large header text, against their background. Pay special attention to muted gray subtexts (e.g., slate colors on white backgrounds).
  - Never suppress active outline indicators (`outline: none` or `outline: 0`) in CSS unless replacing them with highly visible custom focus ring styles (`:focus-visible`). Focus rings are critical for keyboard-only operators.

---

## 2. Performance & Rendering Efficiency
The app runs on factory-floor terminals and mobile tablets. Render performance is crucial to maintain lightweight interactions.

- [ ] **State Splitting & Unnecessary Re-renders:**
  - Avoid placing all state in top-level components (like `Home.js` or `MaintenanceForm.js`). Keep state as local as possible. If a form checkbox or input only affects its own sub-section, encapsulate that section's state.
  - Use `React.memo` for static or slow-changing complex lists, such as the line selection buttons or logs tables.
  - Utilize `useCallback` for functions passed down to deep child components to prevent breaking child reference checks.
  - Wrap complex computations (such as recalculating dashboard counts from all database records) in `useMemo` with proper dependency arrays.
- [ ] **Asset and Module Lazy Loading:**
  - Huge external dependencies like `jspdf` and `jspdf-autotable` (used in Reports) should not be loaded on initial app start.
  - Dynamically import these heavy libraries only when the user triggers the "Export PDF" button:
    ```javascript
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    ```
  - Leverage `React.lazy` and `Suspense` to chunk non-critical routes (like `/reports`, `/activity-log`, or `/users`) so that the core bundle remains ultra-light.
- [ ] **Image Optimization:**
  - Logos (like `vivo-logo.svg`) and other image elements must be optimized vector graphics or modern image formats (`.webp`, `.png` optimized). Declare explicit `width` and `height` to prevent layout shifts (CLS).

---

## 3. State Management & Architectural Separation
- [ ] **State Colocation:**
  - Do not put volatile temporary data (like "Is dropdown menu open?") in a global context.
  - Prefer clean, semantic state hooks. Combine related states that change together into a single `useReducer` or state object rather than calling multiple state setters in succession.
- [ ] **Avoiding Prop-Drilling:**
  - User authorization state (`currentUser`) or selected translation function (`t`, `language`) should be fetched via context hooks (`useLanguage()`, `useAuth()`) rather than drilling props down multiple tiers.
- [ ] **Clear Separation of Concerns:**
  - Move business logic (such as API call triggers, response mapping, and validation algorithms) out of visual components into dedicated hook modules or utility files (e.g., helper functions in `/services` or `/utils`).
  - Components should serve only to take inputs, apply styling classes, and emit events.

---

## 4. TypeScript Migration & Security Enforcement
To transition the client codebase to a secure, robust environment, enforce strict TypeScript definitions and code validation.

- [ ] **Strict Typing Standards:**
  - Absolutely **NO `any` types allowed** in TypeScript. Always declare explicit interfaces or types for API payloads and component parameters.
  - Use `unknown` with type guards rather than `any` if an external API's response schema is not fully deterministic.
  - Always type-check children elements using `React.ReactNode` and callback events using explicit React event types (e.g., `React.ChangeEvent<HTMLInputElement>`).
- [ ] **Prevention of Cross-Site Scripting (XSS):**
  - Never use React's `dangerouslySetInnerHTML` unless rendering sanitized data.
  - Verify that user inputs (remarks, machine names, error text fields) are treated strictly as text nodes, letting React auto-escape content, and ensuring they do not contain raw HTML strings.
- [ ] **Session & LocalStorage Guardrails:**
  - Verify that JWT tokens are safely stored, and clear storage on expired/unauthorized response events (intercepted via the standard API response interceptor).
  - Implement request rate-limit alerts or disabling buttons immediately upon form clicks to prevent double-submit payloads or brute-force inputs.
