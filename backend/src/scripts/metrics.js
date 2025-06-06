// Metrics middleware for request tracking and performance monitoring

const middleware = {
  requestMiddleware: (req, res, next) => {
    // Track request start time
    req.startTime = Date.now();
    
    // Track request completion
    res.on('finish', () => {
      const duration = Date.now() - req.startTime;
      const method = req.method;
      const url = req.originalUrl || req.url;
      const status = res.statusCode;
      
      // Log request metrics (can be extended to send to monitoring service)
      console.log(`[METRICS] ${method} ${url} - ${status} - ${duration}ms`);
    });
    
    next();
  }
};

module.exports = { middleware };