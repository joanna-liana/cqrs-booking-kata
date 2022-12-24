module.exports = function (_wallaby) {
  return {
    tests: {
      override: (_testPatterns) => {
        return ['tests/e2e/**/*.test.ts'];
      }
    },

    env: {
      type: 'node'
    },

    testFramework: {
      configFile: 'jest.e2e.config.js'
    },

    runMode: 'onsave'

    // trace: true
  };
};
