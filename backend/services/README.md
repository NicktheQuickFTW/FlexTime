# FlexTime Services

This directory contains service implementations for the FlexTime platform organized by their roles in the system architecture.

## Directory Structure

- `/core`: Core business service implementations that provide fundamental platform functionality
- `/integration`: Services that integrate with external systems and third-party APIs

## Services vs. Agents

FlexTime makes a clear distinction between services and agents:

- **Services** provide functional capabilities through well-defined interfaces, respond to direct requests, and generally don't maintain internal state between operations.
- **Agents** (found in `/backend/src/ai/agents`) operate with varying degrees of autonomy, make decisions, collaborate with other agents, and often maintain internal state.

## Guidelines for Adding New Services

1. Place the service in the appropriate subdirectory based on its purpose
2. Follow the naming convention: `descriptiveNameService.js`
3. Document the service's purpose and API using JSDoc comments
4. Keep services focused on a single responsibility
5. Implement proper error handling and logging

## Service Organization

This organization aligns with the architectural principles outlined in the [FlexTime Playbook](../../FlexTime_Playbook.md), which emphasizes clean separation of concerns and standardized implementations.

For more detailed information about the FlexTime architecture, refer to the [Technical Architecture](../../development/infrastructure-enhancement/docs/technical_architecture.md) documentation.
