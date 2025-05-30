# FlexTime Core Services

This directory contains the core service implementations for the FlexTime platform. These services provide fundamental functionality that is used throughout the application.

## Core Services

- `advanced_scheduling_service.js`: Main schedule generation engine that provides scheduling capabilities for the platform
- `schedule_service.js`: Data access service for schedule information
- `feedback_service.js`: Consolidated feedback handling service

## Service vs. Agent Distinction

Unlike agents (found in `/backend/src/ai/agents`), services in this directory:

1. **Do not operate autonomously**: They respond to direct API calls rather than making independent decisions
2. **Provide functional capabilities**: They implement specific business logic and data access patterns
3. **Are stateless**: They generally don't maintain their own state between operations
4. **Focus on implementation**: They implement specific functionality rather than solving general problems

## Development Conventions

When adding new services to this directory:

1. Follow the naming convention: `serviceName.js`
2. Use JSDoc comments to document the service's purpose and methods
3. Keep services focused on a single responsibility
4. Avoid mixing agent-like features into services

For more details, refer to the [Controller Standardization](../../../../FlexTime_Playbook.md) section in the FlexTime Playbook.
