const axios = require('axios');
const Redis = require('redis');
const logger = require('../../utils/logger');

/**
 * FlexTime Enhanced Integration Manager
 * 
 * Handles external API integrations with comprehensive error handling,
 * rate limiting, caching, and monitoring capabilities.
 * 
 * Features:
 * - Weather API integration for game-day forecasting
 * - Travel distance calculations for logistics
 * - TV network scheduling coordination
 * - Big 12 conference data feeds
 * - Venue availability systems
 * - Third-party calendar integrations
 */

class IntegrationManager {
    constructor(config = {}) {
        this.config = {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || null
            },
            rateLimits: {
                weather: { requests: 1000, window: 3600000 }, // 1000/hour
                maps: { requests: 2500, window: 86400000 },   // 2500/day
                big12: { requests: 100, window: 300000 },     // 100/5min
                tv: { requests: 50, window: 60000 },          // 50/minute
                calendar: { requests: 1000, window: 3600000 } // 1000/hour
            },
            retryConfig: {
                maxRetries: 3,
                baseDelay: 1000,
                maxDelay: 10000
            },
            timeouts: {
                default: 30000,
                weather: 15000,
                maps: 20000,
                big12: 10000
            },
            ...config
        };

        this.redis = null;
        this.integrations = new Map();
        this.healthStatus = new Map();
        this.metrics = {
            requests: new Map(),
            errors: new Map(),
            responseTime: new Map()
        };

        this.initializeRedis();
        this.setupIntegrations();
        this.startHealthMonitoring();
    }

    /**
     * Initialize Redis connection for caching and rate limiting
     */
    async initializeRedis() {
        try {
            this.redis = Redis.createClient(this.config.redis);
            await this.redis.connect();
            logger.info('IntegrationManager: Redis connection established');
        } catch (error) {
            logger.error('IntegrationManager: Redis connection failed', error);
            this.redis = null;
        }
    }

    /**
     * Setup all external integrations
     */
    setupIntegrations() {
        // Weather API Integration
        this.integrations.set('weather', {
            name: 'Weather API',
            baseUrl: process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5',
            apiKey: process.env.WEATHER_API_KEY,
            headers: {
                'User-Agent': 'FlexTime-Scheduler/1.0'
            },
            timeout: this.config.timeouts.weather
        });

        // Google Maps/Distance Matrix API
        this.integrations.set('maps', {
            name: 'Google Maps API',
            baseUrl: 'https://maps.googleapis.com/maps/api',
            apiKey: process.env.GOOGLE_MAPS_API_KEY,
            headers: {
                'User-Agent': 'FlexTime-Scheduler/1.0'
            },
            timeout: this.config.timeouts.maps
        });

        // Big 12 Conference Data API
        this.integrations.set('big12', {
            name: 'Big 12 Conference API',
            baseUrl: process.env.BIG12_API_URL || 'https://api.big12sports.com/v1',
            apiKey: process.env.BIG12_API_KEY,
            headers: {
                'Authorization': `Bearer ${process.env.BIG12_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: this.config.timeouts.big12
        });

        // TV Network APIs
        this.integrations.set('tv', {
            name: 'TV Network API',
            baseUrl: process.env.TV_API_URL,
            apiKey: process.env.TV_API_KEY,
            headers: {
                'Authorization': `Bearer ${process.env.TV_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: this.config.timeouts.default
        });

        // Calendar Integration (CalDAV/Exchange)
        this.integrations.set('calendar', {
            name: 'Calendar Integration',
            baseUrl: process.env.CALENDAR_API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CALENDAR_API_TOKEN}`
            },
            timeout: this.config.timeouts.default
        });

        logger.info('IntegrationManager: All integrations configured');
    }

    /**
     * Make rate-limited API request with retries and caching
     */
    async makeRequest(integrationKey, endpoint, options = {}) {
        const integration = this.integrations.get(integrationKey);
        if (!integration) {
            throw new Error(`Integration '${integrationKey}' not found`);
        }

        const startTime = Date.now();
        const cacheKey = `integration:${integrationKey}:${endpoint}:${JSON.stringify(options.params || {})}`;

        try {
            // Check rate limit
            await this.checkRateLimit(integrationKey);

            // Check cache first
            if (options.cache !== false) {
                const cached = await this.getFromCache(cacheKey);
                if (cached) {
                    logger.debug(`Cache hit for ${integrationKey}:${endpoint}`);
                    return cached;
                }
            }

            // Make the request with retries
            const response = await this.makeRequestWithRetry(integration, endpoint, options);

            // Cache the response
            if (options.cache !== false && response.data) {
                await this.setCache(cacheKey, response.data, options.cacheTTL || 300);
            }

            // Update metrics
            this.updateMetrics(integrationKey, 'success', Date.now() - startTime);

            return response.data;

        } catch (error) {
            this.updateMetrics(integrationKey, 'error', Date.now() - startTime);
            this.updateHealthStatus(integrationKey, false, error.message);
            throw error;
        }
    }

    /**
     * Make request with exponential backoff retry
     */
    async makeRequestWithRetry(integration, endpoint, options, attempt = 1) {
        const url = `${integration.baseUrl}${endpoint}`;
        const requestConfig = {
            url,
            method: options.method || 'GET',
            headers: {
                ...integration.headers,
                ...options.headers
            },
            params: options.params,
            data: options.data,
            timeout: integration.timeout
        };

        // Add API key to params if required
        if (integration.apiKey && !requestConfig.headers.Authorization) {
            requestConfig.params = {
                ...requestConfig.params,
                key: integration.apiKey
            };
        }

        try {
            const response = await axios(requestConfig);
            this.updateHealthStatus(integration.name, true);
            return response;

        } catch (error) {
            if (attempt < this.config.retryConfig.maxRetries && this.isRetryableError(error)) {
                const delay = Math.min(
                    this.config.retryConfig.baseDelay * Math.pow(2, attempt - 1),
                    this.config.retryConfig.maxDelay
                );

                logger.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${this.config.retryConfig.maxRetries})`, {
                    url,
                    error: error.message
                });

                await this.sleep(delay);
                return this.makeRequestWithRetry(integration, endpoint, options, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Check if error is retryable
     */
    isRetryableError(error) {
        if (!error.response) return true; // Network errors
        
        const status = error.response.status;
        return status >= 500 || status === 429 || status === 408;
    }

    /**
     * Check rate limit for integration
     */
    async checkRateLimit(integrationKey) {
        if (!this.redis) return; // Skip if Redis unavailable

        const limit = this.config.rateLimits[integrationKey];
        if (!limit) return;

        const key = `rate_limit:${integrationKey}`;
        const current = await this.redis.get(key);

        if (current && parseInt(current) >= limit.requests) {
            throw new Error(`Rate limit exceeded for ${integrationKey}`);
        }

        // Increment counter
        const pipeline = this.redis.multi();
        pipeline.incr(key);
        pipeline.expire(key, Math.ceil(limit.window / 1000));
        await pipeline.exec();
    }

    /**
     * Get data from cache
     */
    async getFromCache(key) {
        if (!this.redis) return null;

        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.warn('Cache get error', error);
            return null;
        }
    }

    /**
     * Set data in cache
     */
    async setCache(key, data, ttl = 300) {
        if (!this.redis) return;

        try {
            await this.redis.setEx(key, ttl, JSON.stringify(data));
        } catch (error) {
            logger.warn('Cache set error', error);
        }
    }

    /**
     * Update integration metrics
     */
    updateMetrics(integrationKey, type, responseTime) {
        const now = Date.now();
        const hour = Math.floor(now / 3600000);

        // Initialize if needed
        if (!this.metrics.requests.has(integrationKey)) {
            this.metrics.requests.set(integrationKey, new Map());
            this.metrics.errors.set(integrationKey, new Map());
            this.metrics.responseTime.set(integrationKey, []);
        }

        // Update request count
        const requests = this.metrics.requests.get(integrationKey);
        requests.set(hour, (requests.get(hour) || 0) + 1);

        // Update error count
        if (type === 'error') {
            const errors = this.metrics.errors.get(integrationKey);
            errors.set(hour, (errors.get(hour) || 0) + 1);
        }

        // Update response time (keep last 100 measurements)
        const responseTimes = this.metrics.responseTime.get(integrationKey);
        responseTimes.push(responseTime);
        if (responseTimes.length > 100) {
            responseTimes.shift();
        }
    }

    /**
     * Update health status for integration
     */
    updateHealthStatus(integrationKey, isHealthy, errorMessage = null) {
        this.healthStatus.set(integrationKey, {
            healthy: isHealthy,
            lastCheck: new Date(),
            errorMessage,
            consecutiveFailures: isHealthy ? 0 : (this.healthStatus.get(integrationKey)?.consecutiveFailures || 0) + 1
        });
    }

    /**
     * Weather API Methods
     */
    async getWeatherForecast(latitude, longitude, days = 5) {
        return this.makeRequest('weather', '/forecast', {
            params: {
                lat: latitude,
                lon: longitude,
                cnt: days * 8, // 3-hour intervals
                units: 'imperial'
            },
            cache: true,
            cacheTTL: 1800 // 30 minutes
        });
    }

    async getCurrentWeather(latitude, longitude) {
        return this.makeRequest('weather', '/weather', {
            params: {
                lat: latitude,
                lon: longitude,
                units: 'imperial'
            },
            cache: true,
            cacheTTL: 600 // 10 minutes
        });
    }

    /**
     * Travel Distance Methods
     */
    async calculateTravelDistance(origins, destinations, mode = 'driving') {
        const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
        const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');

        return this.makeRequest('maps', '/distancematrix/json', {
            params: {
                origins: originsStr,
                destinations: destinationsStr,
                mode,
                units: 'imperial',
                departure_time: 'now'
            },
            cache: true,
            cacheTTL: 3600 // 1 hour
        });
    }

    async geocodeAddress(address) {
        return this.makeRequest('maps', '/geocode/json', {
            params: {
                address
            },
            cache: true,
            cacheTTL: 86400 // 24 hours
        });
    }

    /**
     * Big 12 Conference Data Methods
     */
    async getBig12Schedule(sport, season) {
        return this.makeRequest('big12', `/schedules/${sport}/${season}`, {
            cache: true,
            cacheTTL: 3600 // 1 hour
        });
    }

    async getBig12TeamInfo(teamId) {
        return this.makeRequest('big12', `/teams/${teamId}`, {
            cache: true,
            cacheTTL: 86400 // 24 hours
        });
    }

    async getBig12VenueInfo(venueId) {
        return this.makeRequest('big12', `/venues/${venueId}`, {
            cache: true,
            cacheTTL: 86400 // 24 hours
        });
    }

    /**
     * TV Network Integration Methods
     */
    async getAvailableTimeSlots(network, date, sport) {
        return this.makeRequest('tv', '/time-slots', {
            params: {
                network,
                date,
                sport
            },
            cache: true,
            cacheTTL: 1800 // 30 minutes
        });
    }

    async reserveTimeSlot(network, startTime, duration, gameInfo) {
        return this.makeRequest('tv', '/time-slots/reserve', {
            method: 'POST',
            data: {
                network,
                startTime,
                duration,
                gameInfo
            },
            cache: false
        });
    }

    /**
     * Calendar Integration Methods
     */
    async createCalendarEvent(eventData) {
        return this.makeRequest('calendar', '/events', {
            method: 'POST',
            data: {
                summary: eventData.title,
                start: {
                    dateTime: eventData.startTime,
                    timeZone: eventData.timeZone || 'America/Chicago'
                },
                end: {
                    dateTime: eventData.endTime,
                    timeZone: eventData.timeZone || 'America/Chicago'
                },
                location: eventData.venue,
                description: eventData.description
            },
            cache: false
        });
    }

    async getCalendarEvents(startDate, endDate, calendar = 'primary') {
        return this.makeRequest('calendar', `/calendars/${calendar}/events`, {
            params: {
                timeMin: startDate,
                timeMax: endDate,
                singleEvents: true,
                orderBy: 'startTime'
            },
            cache: true,
            cacheTTL: 300 // 5 minutes
        });
    }

    /**
     * Venue Availability Methods
     */
    async checkVenueAvailability(venueId, startDate, endDate) {
        // This would integrate with venue management systems
        return this.makeRequest('big12', `/venues/${venueId}/availability`, {
            params: {
                start: startDate,
                end: endDate
            },
            cache: true,
            cacheTTL: 600 // 10 minutes
        });
    }

    /**
     * Data Transformation and Validation
     */
    transformWeatherData(weatherData) {
        if (!weatherData || !weatherData.list) return null;

        return weatherData.list.map(item => ({
            datetime: new Date(item.dt * 1000),
            temperature: item.main.temp,
            feelsLike: item.main.feels_like,
            humidity: item.main.humidity,
            windSpeed: item.wind?.speed || 0,
            windDirection: item.wind?.deg || 0,
            precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0,
            conditions: item.weather[0]?.description || 'Unknown',
            visibility: item.visibility || 10000,
            cloudCover: item.clouds?.all || 0
        }));
    }

    transformDistanceData(distanceData) {
        if (!distanceData || !distanceData.rows) return null;

        return distanceData.rows.map((row, originIndex) => ({
            origin: distanceData.origin_addresses[originIndex],
            destinations: row.elements.map((element, destIndex) => ({
                destination: distanceData.destination_addresses[destIndex],
                distance: element.distance?.value || null,
                distanceText: element.distance?.text || 'Unknown',
                duration: element.duration?.value || null,
                durationText: element.duration?.text || 'Unknown',
                durationInTraffic: element.duration_in_traffic?.value || null,
                status: element.status
            }))
        }));
    }

    /**
     * Health Monitoring
     */
    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthChecks();
        }, 300000); // Every 5 minutes

        logger.info('IntegrationManager: Health monitoring started');
    }

    async performHealthChecks() {
        for (const [key, integration] of this.integrations) {
            try {
                // Simple health check endpoint
                await this.makeRequest(key, '/health', {
                    timeout: 5000,
                    cache: false
                });
                this.updateHealthStatus(key, true);
            } catch (error) {
                this.updateHealthStatus(key, false, error.message);
                logger.warn(`Health check failed for ${integration.name}`, error);
            }
        }
    }

    /**
     * Get integration status and metrics
     */
    getIntegrationStatus() {
        const status = {};

        for (const [key, integration] of this.integrations) {
            const health = this.healthStatus.get(key);
            const requests = this.metrics.requests.get(key);
            const errors = this.metrics.errors.get(key);
            const responseTimes = this.metrics.responseTime.get(key);

            const totalRequests = requests ? Array.from(requests.values()).reduce((a, b) => a + b, 0) : 0;
            const totalErrors = errors ? Array.from(errors.values()).reduce((a, b) => a + b, 0) : 0;
            const avgResponseTime = responseTimes && responseTimes.length > 0 
                ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
                : 0;

            status[key] = {
                name: integration.name,
                healthy: health?.healthy || false,
                lastCheck: health?.lastCheck || null,
                consecutiveFailures: health?.consecutiveFailures || 0,
                errorMessage: health?.errorMessage || null,
                metrics: {
                    totalRequests,
                    totalErrors,
                    errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
                    avgResponseTime: Math.round(avgResponseTime)
                }
            };
        }

        return status;
    }

    /**
     * Utility methods
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.redis) {
            await this.redis.quit();
        }
        logger.info('IntegrationManager: Cleanup completed');
    }
}

module.exports = IntegrationManager;