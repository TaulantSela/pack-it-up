import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // New in eslint-config-next 16 (React Hooks 7). It flags seven deliberate patterns here:
      // restoring the guest trip and form after mount, syncing props into state, the mounted guard
      // and resetting place suggestions. Kept visible as warnings until they're refactored.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  // eslint-config-next's default ignores, spelled out because globalIgnores replaces them
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
