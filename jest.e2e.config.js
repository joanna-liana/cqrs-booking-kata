module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$',
  testEnvironment: 'node',
  rootDir: 'tests/e2e',
  globalSetup: '<rootDir>/hooks/globalSetup.ts'
};
