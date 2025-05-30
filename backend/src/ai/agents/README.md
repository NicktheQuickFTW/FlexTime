# FlexTime Agent System

This directory contains the FlexTime multi-agent system components organized by their roles in the system.

## Directory Structure

- `/directors`: Manager/coordinator agents that oversee other agents and orchestrate complex operations
- `/workers`: Specialized worker agents that perform specific tasks in the system
- `/orchestrators`: Orchestration agents that manage complex workflows across multiple services

## Agent Guidelines

All agents in the FlexTime system follow these core principles:

1. **Autonomy**: Each agent has clearly defined responsibilities and can make decisions within its domain
2. **Collaboration**: Agents communicate through defined protocols to coordinate actions
3. **Specialization**: Agents focus on specific aspects of the scheduling problem
4. **Modularity**: Agents can be enhanced or replaced without affecting the entire system

## Development Conventions

When adding new agents to the system:

1. Place them in the appropriate subdirectory based on their role
2. Extend the base `Agent` class for consistency
3. Follow the established naming convention: `PurposeAgent.js`
4. Implement the required interface methods for your agent type

For more details, see the [Agent System Architecture](../../../development/infrastructure-enhancement/docs/technical_architecture.md) documentation.
