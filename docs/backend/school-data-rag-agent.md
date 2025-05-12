# School Data RAG Agent

The School Data RAG Agent is a component of the FlexTime COMPASS system that uses Retrieval-Augmented Generation (RAG) to source and analyze data from schools to assist with scheduling and analytics.

## Features

- **School Data Management**: Store and retrieve data for multiple schools
- **Vector Search**: Perform similarity search on school data using embeddings
- **Natural Language Queries**: Query school data using natural language
- **Multiple Data Types**: Support for team information, schedules, venue availability, constraints, and preferences
- **Structured Data Chunking**: Intelligent chunking of structured data for effective retrieval

## Data Types

The agent supports the following data types:

1. **team_info**: Basic information about teams, including name, mascot, conference, division, etc.
2. **schedule**: Game schedules, including dates, opponents, venues, etc.
3. **venue_availability**: Information about venue availability, including dates, conflicts, etc.
4. **constraints**: Scheduling constraints, including date constraints, travel constraints, etc.
5. **preferences**: Scheduling preferences, including preferred game days, times, etc.

## Integration

The School Data RAG Agent can be integrated with the FlexTime system in several ways:

1. **API Integration**: The agent can be accessed through the FlexTime API
2. **Command Line**: The agent can be run from the command line for testing and development
3. **Web Interface**: The agent can be integrated into the FlexTime web interface

## API Usage

```javascript
// Import the agent
const SchoolDataAgent = require('./agents/rag/school_data_agent');

// Create an instance
const agent = new SchoolDataAgent();

// Initialize with schools
await agent.initialize([
  { id: 'school_1', name: 'University of Texas' },
  { id: 'school_2', name: 'University of Oklahoma' }
]);

// Update school data
await agent.updateSchoolData('school_1', 'team_info', 'mock');
await agent.updateSchoolData('school_1', 'schedule', 'mock');

// Query school data
const result = await agent.query('What is the schedule for University of Texas?');
console.log(result.response);
```

## Command Line Usage

The agent can be run from the command line using the following commands:

```bash
# Test the agent with mock data
npm run test-school-data-agent

# Run the agent with a specific query
npm run run-school-data-agent --query="What is the schedule for University of Texas?"

# Run the agent with a specific school
npm run run-school-data-agent --school=school_1 --query="What are the scheduling constraints?"
```

## Dependencies

The School Data RAG Agent depends on the following components:

1. **AI Adapter**: Provides access to AI services for embeddings and text generation
2. **Data Storage**: Stores school data in memory and on disk
3. **Vector Search**: Performs similarity search on embedded documents

## Configuration

The agent can be configured with the following options:

- **dataDirectory**: Directory for storing school data
- **cacheExpiration**: Time before cache entries expire
- **searchResultLimit**: Maximum number of search results to return
- **embeddingModel**: Model to use for embeddings
- **chatModel**: Model to use for text generation

## Performance Considerations

- **Memory Usage**: The agent stores data in memory for fast access
- **Embedding Caching**: Embeddings are cached to reduce API calls
- **Document Chunking**: Large documents are chunked for more effective retrieval
- **Vector Search Optimization**: Similarity search is optimized for performance

## Security

- **API Key Management**: AI service API keys are stored in environment variables
- **Data Isolation**: School data is isolated by school ID
- **Input Validation**: All inputs are validated before processing

## Future Enhancements

1. **Database Integration**: Store data in a database instead of files
2. **Real-time Updates**: Support for real-time updates of school data
3. **Advanced Chunking**: More sophisticated document chunking strategies
4. **Multi-tenant Support**: Support for multiple tenants with data isolation
5. **Hybrid Search**: Combine vector search with keyword search for better results

## Troubleshooting

Common issues and solutions:

1. **Missing Data**: Ensure all required data types are loaded
2. **API Rate Limits**: Monitor AI service API rate limits
3. **Memory Usage**: Monitor memory usage for large datasets
4. **Embedding Quality**: Ensure embeddings are of high quality

## Resources

- [OpenAI Embeddings Documentation](https://platform.openai.com/docs/guides/embeddings)
- [Anthropic Claude Documentation](https://docs.anthropic.com/)
- [Vector Search Best Practices](https://www.pinecone.io/learn/vector-search-basics/)