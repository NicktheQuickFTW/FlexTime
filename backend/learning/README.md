# Machine Learning Directory Structure

FlexTime's machine learning capabilities are spread across multiple directories with different purposes:

## Learning Directory Organization

- `/learning` (this directory): Contains memory adapters and historical data managers for ML systems
- `/learning-system`: Contains the complete ML workflow, championship date management, and training pipelines
- `/agents/learning`: Contains agent-specific learning components like feedback systems and machine learning modules

## Recommended Usage

When developing ML features:

1. **Agent Learning Components**: If your feature involves agent-specific learning logic, use `/agents/learning/`
2. **Core ML Infrastructure**: If your feature involves the core learning system infrastructure, use `/learning-system/`
3. **Memory and Historical Data**: If your feature involves memory adapters or historical data, use `/learning/`

This structure allows separation of concerns while maintaining a modular learning system.