import nextPlugin from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextPlugin(),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  {
    ignores: [".next/", "node_modules/", "drizzle/", "playwright-report/", "test-results/"],
  },
];
