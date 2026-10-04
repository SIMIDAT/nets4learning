import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig([
  globalIgnores(['dist', 'playwright-report', 'test-results']),
  {
    files  : ['**/*.{ts,tsx}'],
    plugins: {
      '@stylistic': stylistic,
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals    : globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any'        : 'off',
      '@typescript-eslint/ban-ts-comment'         : 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-unused-vars'         : [
        'error',
        {
          args                          : 'all',
          argsIgnorePattern             : '^_',
          caughtErrors                  : 'all',
          caughtErrorsIgnorePattern     : '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern             : '^_',
          ignoreRestSiblings            : true,
        },
      ],
      '@stylistic/key-spacing': ['error', { align: 'colon' }],
      // Comillas simples en el código (en los atributos de JSX no cambia nada); dobles solo para no escapar una simple
      '@stylistic/quotes'     : ['error', 'single', { avoidEscape: true }],
    },
  },
])
