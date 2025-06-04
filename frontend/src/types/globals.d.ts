// Global type declarations for FlexTime

declare global {
  const vi: {
    fn: () => jest.Mock;
    mock: typeof jest.mock;
    resetAllMocks: typeof jest.resetAllMocks;
    clearAllMocks: typeof jest.clearAllMocks;
    restoreAllMocks: typeof jest.restoreAllMocks;
  };
}

export {};