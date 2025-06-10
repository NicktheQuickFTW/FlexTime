# FT Builder Integration Utilities

Essential integration utilities for FT Builder's monolithic architecture.

## 📁 Contents

- **`health-checker.js`** - System component health monitoring
- **`logger.js`** - Centralized logging utility  
- **`integration-config.js`** - Integration configuration settings

## 🔧 Usage

### Health Checking
```javascript
import { HealthChecker } from './health-checker.js';

const healthChecker = new HealthChecker();
healthChecker.start();
```

### Logging
```javascript
import { Logger } from './logger.js';

const logger = new Logger('ft-builder');
logger.info('Application started');
```

### Configuration
```javascript
import config from './integration-config.js';

const port = config.server.port;
```

## 🎯 Purpose

These utilities provide essential monitoring and logging capabilities for FT Builder's monolithic architecture, extracted from the larger FlexTime integration ecosystem.