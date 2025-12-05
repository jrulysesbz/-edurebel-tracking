/** Relax a few rules so builds don't fail on style-only issues. */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  rules: {
    // Let 'any' pass in CI (keep typechecking via TS)
    '@typescript-eslint/no-explicit-any': 'off',
    // Don't fail on missing deps; show as warnings
    'react-hooks/exhaustive-deps': 'warn',
    // Don't fail the build for unused vars; underscore to silence
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
  },
};
