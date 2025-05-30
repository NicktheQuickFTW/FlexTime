/**
 * Jest Testing Framework Setup
 * Global configuration and utilities for FT Engine tests
 */

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in tests (can be overridden per test)
global.mockConsole = () => {
    global.console = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
    };
};

// Restore console methods
global.restoreConsole = () => {
    global.console = require('console');
};

// Global test utilities
global.testUtils = {
    // Create a delay for async testing
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Generate random test data
    randomString: (length = 10) => {
        return Math.random().toString(36).substring(2, length + 2);
    },
    
    // Generate random integer
    randomInt: (min = 0, max = 100) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Create mock request object
    mockRequest: (overrides = {}) => ({
        method: 'GET',
        url: '/test',
        headers: {},
        query: {},
        params: {},
        body: {},
        ...overrides
    }),
    
    // Create mock response object
    mockResponse: () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.send = jest.fn().mockReturnValue(res);
        res.end = jest.fn().mockReturnValue(res);
        res.set = jest.fn().mockReturnValue(res);
        return res;
    },
    
    // Create mock next function
    mockNext: () => jest.fn(),
    
    // Memory usage helper
    getMemoryUsage: () => {
        const used = process.memoryUsage();
        return {
            heapUsed: used.heapUsed / 1024 / 1024, // MB
            heapTotal: used.heapTotal / 1024 / 1024, // MB
            external: used.external / 1024 / 1024, // MB
            rss: used.rss / 1024 / 1024 // MB
        };
    },
    
    // Performance measurement helper
    measurePerformance: async (fn, iterations = 1000) => {
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = process.hrtime.bigint();
            await fn();
            const end = process.hrtime.bigint();
            times.push(Number(end - start) / 1000000); // Convert to milliseconds
        }
        
        times.sort((a, b) => a - b);
        
        return {
            min: times[0],
            max: times[times.length - 1],
            mean: times.reduce((a, b) => a + b, 0) / times.length,
            median: times[Math.floor(times.length / 2)],
            p95: times[Math.floor(times.length * 0.95)],
            p99: times[Math.floor(times.length * 0.99)]
        };
    }
};

// Global test data generators
global.testData = {
    // Generate mock team data
    createTeam: (overrides = {}) => ({
        id: global.testUtils.randomString(8),
        name: `Team ${global.testUtils.randomString(5)}`,
        abbreviation: global.testUtils.randomString(3).toUpperCase(),
        city: `City ${global.testUtils.randomString(5)}`,
        state: global.testUtils.randomString(2).toUpperCase(),
        conference: 'Big 12',
        sport: 'Football',
        ...overrides
    }),
    
    // Generate mock game data
    createGame: (overrides = {}) => ({
        id: global.testUtils.randomString(10),
        homeTeamId: global.testUtils.randomString(8),
        awayTeamId: global.testUtils.randomString(8),
        date: new Date(Date.now() + global.testUtils.randomInt(1, 365) * 24 * 60 * 60 * 1000),
        time: '12:00',
        venue: `Venue ${global.testUtils.randomString(5)}`,
        sport: 'Football',
        ...overrides
    }),
    
    // Generate mock constraint data
    createConstraint: (overrides = {}) => ({
        id: global.testUtils.randomString(8),
        type: 'DATE_CONSTRAINT',
        priority: global.testUtils.randomInt(1, 10),
        description: `Constraint ${global.testUtils.randomString(5)}`,
        enabled: true,
        parameters: {},
        ...overrides
    }),
    
    // Generate mock schedule data
    createSchedule: (gameCount = 10) => {
        const games = [];
        for (let i = 0; i < gameCount; i++) {
            games.push(global.testData.createGame());
        }
        return {
            id: global.testUtils.randomString(12),
            name: `Schedule ${global.testUtils.randomString(5)}`,
            sport: 'Football',
            season: '2025',
            games,
            constraints: [
                global.testData.createConstraint(),
                global.testData.createConstraint(),
                global.testData.createConstraint()
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
};

// Performance monitoring setup for tests
let performanceData = {};

beforeEach(() => {
    performanceData = {
        startTime: process.hrtime.bigint(),
        startMemory: process.memoryUsage()
    };
});

afterEach(() => {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const executionTime = Number(endTime - performanceData.startTime) / 1000000; // ms
    const memoryDelta = endMemory.heapUsed - performanceData.startMemory.heapUsed;
    
    // Log performance data if test took longer than 1 second or used more than 10MB
    if (executionTime > 1000 || Math.abs(memoryDelta) > 10 * 1024 * 1024) {
        console.log(`Test Performance: ${executionTime.toFixed(2)}ms, Memory Delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    }
});

// Global error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Memory leak detection setup
if (process.env.NODE_ENV === 'test' && process.env.DETECT_MEMORY_LEAKS === 'true') {
    const memwatch = require('memwatch-next');
    
    memwatch.on('leak', (info) => {
        console.error('Memory leak detected:', info);
    });
    
    memwatch.on('stats', (stats) => {
        if (stats.usage_trend > 0) {
            console.warn('Memory usage trending upward:', stats);
        }
    });
}

console.log('FT Engine Test Framework initialized');