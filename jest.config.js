module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$',
  testEnvironment: 'node',
  rootDir: '.',
  collectCoverageFrom: ['**/*.ts', '!demo.ts'],
};
