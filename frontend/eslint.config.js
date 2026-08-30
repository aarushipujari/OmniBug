import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/**
 * The rules-of-hooks rule is the reason this config exists.
 *
 * Both modals shipped with a `useEffect` placed after an `if (...) return null`
 * guard. Opening either one therefore ran one more hook than closing it, and
 * React aborted the render with "Rendered more hooks than during the previous
 * render" (#310). Creating a bug and opening a bug — the two primary actions in
 * the product — both crashed, and nothing in the toolchain objected: `tsc`
 * reported zero errors and the test suite passed, because neither one renders a
 * component.
 *
 * `react-hooks/rules-of-hooks` catches exactly that, statically, in under a
 * second. It is an error here, not a warning.
 */
export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'eslint.config.js'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      'react-hooks/rules-of-hooks': 'error',

      /*
       * Every instance this rule could flag that was a genuine cascading
       * render has been removed: the create-bug form and the flag requestee
       * now derive their defaults during render instead of correcting
       * themselves in a second pass, the command palette mounts fresh instead
       * of clearing stale state, and session restoration starts from whether a
       * token exists. What remains are fetch-on-mount effects that set a
       * loading flag before awaiting — the shape of every data load in the
       * app. The rule's own answer to those is to move fetching out of effects
       * entirely, into a query layer or a route loader; that is a real change
       * worth making, not something to silence with inline disables, so the
       * rule stays on as a warning that names each remaining site.
       */
      'react-hooks/set-state-in-effect': 'warn',
      // Dependency completeness is worth knowing about but not worth blocking a
      // build over; several effects here intentionally run on a narrow subset.
      'react-hooks/exhaustive-deps': 'warn',

      // Unused variables are a warning so the build stays green while genuine
      // problems above stay loud.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
