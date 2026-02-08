# Project Setup Instructions

Your current project is a basic Vite + React (JavaScript) setup. To support the requirements for this component, follow these steps:

## 1. Install Tailwind CSS

Run the following commands to install and initialize Tailwind CSS:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update your `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add the Tailwind directives to your `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... add other shadcn variables here */
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}
```

## 2. Setup TypeScript (Optional but Recommended)

Since you requested TypeScript support, you can rename your `.jsx` files to `.tsx` and follow these steps:

1. Install TypeScript:
   ```bash
   npm install -D typescript @types/node @types/react @types/react-dom
   ```
2. Initialize TypeScript configuration:
   ```bash
   npx tsc --init
   ```
3. Configure `tsconfig.json` for React and Vite path aliases.

## 3. Setup shadcn/ui

Run the shadcn-ui init command:

```bash
npx shadcn-ui@latest init
```

During initialization, it's recommended to:
- Use **Next.js**: No (since you're using Vite)
- Use **TypeScript**: Yes/No (based on your choice)
- Style: **Default**
- Base color: **Slate**
- Global CSS file: `src/index.css`
- Use CSS variables for colors: **Yes**
- Where is your `tailwind.config.js` located? `tailwind.config.js`
- Configure path aliases: **@**

### Why `/components/ui`?
The `/components/ui` folder is the standard location for shadcn components. Keeping them here ensures:
- **Organization**: Separates reusable UI primitives from feature-specific components.
- **CLI Compatibility**: The shadcn CLI expects this structure when adding new components.
- **Consistency**: Makes it easier for other developers to understand your project structure.
