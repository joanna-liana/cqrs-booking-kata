module.exports = function (_wallaby) {
  return {
    tests: {
      override: (_testPatterns) => {
        return ['tests/unit/**/*.test.ts'];
      }
    },

    env: {
      type: 'node'
    },

    testFramework: {
      configFile: 'jest.unit.config.js'
    },

    // trace: true
  };
};
