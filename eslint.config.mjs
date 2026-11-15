import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier/flat';

const services = [
  'graphql-api',
  'identity',
  'workspace',
  'messaging',
  'files',
  'notifications',
  'calls',
  'audit',
  'presence',
  'search',
];
const implementationImports = [
  '**/apps/**',
  '#apps/**',
  ...services.map((service) => `**/${service}/src/**`),
];
const domainInfrastructure = [
  '**/application/**',
  '**/infrastructure/**',
  '**/packages/storage/**',
  '#storage/**',
  '**/packages/runtime/**',
  '#runtime/**',
  '@nestjs/**',
  'pg',
  '@prisma/**',
  '**/generated/**',
  '#generated/**',
  'redis',
  'graphql',
  '@apollo/**',
];
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'generated/**',
      'packages/contracts/src/graphql-types.ts',
      'packages/contracts/src/graphql-validation.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/apps/**', '#apps/**'],
              message:
                'Import a public client port; app implementations belong only in composition roots.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['adapters/**/*.ts', 'scripts/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  ...services.map((service) => ({
    files: [`apps/${service}/src/**/*.ts`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/apps/**',
                '#apps/**',
                ...services
                  .filter((other) => other !== service)
                  .map((other) => `**/${other}/src/**`),
                ...(service === 'graphql-api'
                  ? ['**/packages/storage/**', '#storage/**']
                  : []),
              ],
              message:
                'Use the service client port; do not import another service implementation.',
            },
          ],
        },
      ],
    },
  })),
  {
    files: ['apps/*/src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [...implementationImports, ...domainInfrastructure],
              message:
                'Domain rules must stay independent of application, storage and transport.',
            },
          ],
        },
      ],
    },
  },
  {
    files: services
      .filter((service) => service !== 'graphql-api')
      .map((service) => `apps/${service}/src/application/**/*.ts`),
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                ...implementationImports,
                '**/infrastructure/**',
                '**/packages/storage/**',
                '#storage/**',
                'pg',
                '@prisma/**',
                '**/generated/**',
                '#generated/**',
                'redis',
                '@nestjs/**',
                'graphql',
                '@apollo/**',
              ],
              message:
                'Application scenarios depend on ports, not on concrete infrastructure or other services.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/contracts/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [...implementationImports, ...domainInfrastructure],
              message:
                'Public contracts cannot depend on framework or implementation packages.',
            },
          ],
        },
      ],
    },
  },
  prettier,
);
