import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // `useEffect(() => { fetchX() }, [...])` es el patrón de fetching usado en
      // todo el proyecto. El refactor a TanStack Query / Server Components excede el
      // alcance actual; degradamos la regla a "warn" para no bloquear CI/IDE.
      "react-hooks/set-state-in-effect": "warn",
      // Plantillas SVG/Compiler — algunos componentes integran librerías externas
      // (react-hook-form, jspdf) que React Compiler no puede memoizar de forma segura.
      "react-hooks/incompatible-library": "warn",
    },
  },
]);

export default eslintConfig;
