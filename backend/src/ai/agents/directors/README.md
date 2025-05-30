# FlexTime Director Agents

This directory contains director agents that coordinate and manage other agents in the FlexTime system. Director agents serve as high-level coordinators that delegate tasks to specialized worker agents.

## Director Agents

- `master_director_agent.js`: Top-level coordinator for the entire agent system
- `parallel_scheduling_agent.js`: Coordinates parallel scheduling operations for improved performance

## Responsibilities

Director agents are responsible for:

1. **Coordination**: Orchestrating the activities of multiple worker agents
2. **Decision Making**: Determining which agents to engage for specific tasks
3. **Resource Allocation**: Managing system resources across agent activities
4. **Progress Monitoring**: Tracking and reporting on the status of complex operations
5. **Error Handling**: Managing failures and implementing recovery strategies

## Implementation Notes

Director agents typically:

- Maintain references to worker agents they coordinate
- Implement strategies for breaking down complex problems
- Handle communication between agents they manage
- Provide abstraction for agent system clients

For more information, see the Multi-Agent Architecture section in the [Technical Architecture](../../../../../development/infrastructure-enhancement/docs/technical_architecture.md) document.
