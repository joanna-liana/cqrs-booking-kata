module.exports = function (_wallaby) {
  return {
    tests: {
      override: (_testPatterns) => {
        return ['tests/integration/**/*.test.ts'];
      }
    },

    env: {
      type: 'node'
    },

    testFramework: {
      configFile: 'jest.it.config.js'
    },

    runMode: 'onsave'

    // trace: true
  };
};
