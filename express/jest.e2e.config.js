module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$',
  testEnvironment: 'node',
  rootDir: 'tests/e2e',
  collectCoverageFrom: ['**/*.ts', '!demo.ts'],
  globalSetup: '<rootDir>/hooks/globalSetup.ts',
  globalTeardown: '<rootDir>/hooks/globalTeardown.ts',
  testTimeout: 120_000
};
