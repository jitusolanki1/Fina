# Fina - Simple Bank Dashboard (Vite + React)

This project reproduces the Google Sheets logic you shared in React using `json-server` as a quick backend.

Features:
- Create accounts with opening balance
- Account sheets with deposits, other deposits, penal withdrawals and other withdrawals
- Running balance per transaction
- Dashboard summary and a deposit/withdrawal chart (Recharts)
- Toast notifications (react-hot-toast)

Quick start

1. Install dependencies:

```powershell
npm install
```

2. Run the json-server in one terminal:

```powershell
npm run json-server
```

3. Run the dev server in another terminal:

```powershell
npm run dev
```

Open `http://localhost:5173` (Vite default) and `http://localhost:3001` is the json-server API.

Notes
- Tailwind is configured but you must install the `tailwindcss`, `postcss`, and `autoprefixer` devDependencies (they are in `package.json`).
- The project keeps computation on the client side similar to your sheet formulas.# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
