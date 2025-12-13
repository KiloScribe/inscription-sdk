const config = {
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
        diagnostics: false,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!src/index.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@hashgraphonline/standards-sdk$': '<rootDir>/src/__mocks__/standards-sdk.ts',
    '^file-type$': '<rootDir>/src/__mocks__/file-type.ts',
  },
};

export default config;
