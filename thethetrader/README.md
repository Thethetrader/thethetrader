# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```









CURSOR SONNET 20 JUIN 14h42 INSTALLE NETIFY MCP SETUP 
Understood. Here's your project knowledge summary:

## MCP SETUP SESSION SUMMARY

### 1/ WHAT WE DID THIS SESSION
• Added Netlify MCP to Cursor (ready to use)
• Added Supabase MCP to Cursor (fully configured)
• Updated `/Users/theodorebrey/.cursor/mcp.json` with both MCPs
• Created `MCP_SETUP.md` reference guide

### 2/ HOW WE DID IT
• Found existing empty MCP config at `/Users/theodorebrey/.cursor/mcp.json`
• Added Netlify MCP with `npx @netlify/mcp` command
• Added Supabase MCP with read-only mode and project scoping
• User provided project ref: `sbp_64b3c9feddc6a750742d9533155efd24c6614326`
• User provided personal access token: `sbp_f11c4c60c1b59d320e01e64902c0160cc5bcdcd5`

### 3/ WHAT WE FAILED AT AND WHY
• **MISTAKE**: User initially confused project reference with personal access token
• **WHY**: Put same project ref (`sbp_64b3c9feddc6a750742d9533155efd24c6614326`) in both project-ref and access token fields
• **LESSON**: Project reference ≠ Personal access token (they're different things)

### 4/ WHAT'S IMPORTANT TO KNOW & NEXT STEPS
• **STATUS**: MCPs fully configured, needs Cursor restart to activate
• **SECURITY**: Supabase MCP in read-only mode (safe)
• **NEXT**: Restart Cursor, test with "What tables do I have in Supabase?" or "Deploy to Netlify"
• **NEVER AGAIN**: Don't mix up project refs and personal access tokens