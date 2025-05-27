# Machine Learning Directory Structure

FlexTime's machine learning capabilities are spread across multiple directories with different purposes:

## Learning Directory Organization

- `/ml` (this directory): Contains the complete ML workflow, memory adapters, historical data managers, championship date management, and training pipelines
- `/agents/learning`: Contains agent-specific learning components like feedback systems and machine learning modules

## Recommended Usage

When developing ML features:

1. **Agent Learning Components**: If your feature involves agent-specific learning logic, use `/agents/learning/`
2. **Core ML Infrastructure**: If your feature involves core ML workflow, championship constraints, memory adapters, or historical data, use `/ml/`

This structure allows separation of concerns while maintaining a modular learning system.