// Jest setup file for inscription SDK tests

// Mock environment variables
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Keep error and warn for debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Global test timeout
jest.setTimeout(30000);
