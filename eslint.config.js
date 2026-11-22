import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores([
    "dist/**",
    "node_modules/**",
    "coverage/**",
    "src-tauri/**",
    "src/contracts/generated/**",
    "test-results/**",
    "playwright-report/**",
    ".test-results/**",
    ".claude/**",
    ".workbuddy/**",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["src/**/*.tsx"],
    extends: [reactRefresh.configs.vite],
  },
  {
    files: ["**/*.{js,mjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["scripts/test-desktop.mjs"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ["*.config.ts", "vitest.setup.ts", "scripts/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
])
