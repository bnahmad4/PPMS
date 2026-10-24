# NPA Port Pass Management System — Correction Report

## Changes applied

1. Reduced the company-registration form's outer shadow.
2. Darkened textbox backgrounds and strengthened textbox borders for clearer contrast.
3. Increased the default NPA logo size.
4. Added Nigerian phone-number validation for the company contact, authorised representative, and optional MD/CEO contact in the browser and on the registration API.
5. Standardised the billing input label to **Remark**.
6. Hid non-payment document controls from company accounts and removed category documents and passport-photo URLs from company application API responses. Public tracking responses no longer expose document payloads or payment receipt file bytes. Payment receipt and billing information remain available in the company payment view.
7. Locked company appointment date selection after an OIC reschedule; server-side booking blocks further date changes. The reschedule API is restricted to the OIC ID Unit or System Administrator, checks assigned-port access, and the data store rejects repeat rescheduling.

## Checks performed

- Static source assertions passed for all seven requested areas.
- Phone validation examples passed: `08012345678`, `+2348012345678`, and `2348012345678` accepted; malformed examples rejected.
- Existing `.data/ppms-db.json` was preserved unchanged.

## Build-test limitation

A full Vite/TypeScript build could not be completed in the preparation environment. The supplied `node_modules` contains Windows-specific native packages, and a clean dependency installation could not reach the npm registry. Therefore, the source-level checks passed, but a successful production build and live browser workflow test have **not** been verified here. On Windows, run `npm ci`, then `npm run lint` and `npm run build` before deploying.
