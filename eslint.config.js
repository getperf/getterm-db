module.exports = [
    {
      files: ["**/*.js", "**/*.ts"],
      plugins: {
        "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
      },
      languageOptions: {
        parser: require("@typescript-eslint/parser"),
      },
      rules: {
        "@/semi": ["error", "always"]
      },
      ignores: [
        'out',
        'dist',
        '**/*.d.ts'
      ]
    },
];