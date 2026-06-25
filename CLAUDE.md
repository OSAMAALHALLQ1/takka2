# CLAUDE.md

Developer guidelines, commands, and project conventions for **Takka (تكة)**.

## Commands

- **Development Server**: `npm run dev`
- **Production Build**: `npm run build`
- **Preview Production Build**: `npm run preview`
- **Linting**: `npm run lint`

## Project Structure & Architecture

- **Entry Point**: `src/main.jsx` -> `src/App.jsx`
- **Styling**: `src/index.css` (Main styling file with custom CSS variables and UI tokens)
- **Database Connection**: `src/utils/supabaseClient.js` (Supabase integration)
- **Local Storage / Offline Helpers**: `src/utils/storage/index.js`
- **Auth Store**: `src/utils/auth-store.js`
- **Views & Components**:
  - `src/components/WaiterView.jsx` (Waiter POS terminal interface)
  - `src/components/CashierView.jsx` (Cashier checkout/billing interface)
  - `src/components/AdminDashboard.jsx` (Manager/admin panel)
  - `src/components/Dashboard/KitchenDashboard.jsx` (Kitchen display system screen)
  - `src/components/Dashboard/BarDashboard.jsx` (Bar screen)
  - `src/components/Dashboard/ShishaDashboard.jsx` (Shisha screen)

## Coding Conventions

- **React & JSX**: Use React 19 functional components, hooks, and standard ESM import/export syntax.
- **Language/Direction**: Arabic locale with Right-to-Left (RTL) layout. Font family: `'Cairo', sans-serif` for Arabic text.
- **CSS Styles**: Use CSS variables defined in `src/index.css`. Keep visual aesthetics premium, using glassmorphic UI, smooth curves, and micro-animations.
- **State Management**: Context-based State Providers (`src/context/OrderContext` and `src/context/NotificationContext`).
