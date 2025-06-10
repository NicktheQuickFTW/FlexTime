import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Zap, Filter, MessageCircle, BarChart3, Bot } from 'lucide-react';

interface SearchResult {
  id: string;
  score: number;
  metadata: {
    type: string;
    name?: string;
    description?: string;
    sport?: string;
    endpoint?: string;
  };
}

interface AssistantResponse {
  question: string;
  answer: string;
  sources: Array<{
    type: string;
    name: string;
    description?: string;
    relevance: number;
  }>;
  timestamp: string;
}

const VectorSearchInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('general');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState<AssistantResponse | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sport, setSport] = useState('');
  const [limit, setLimit] = useState(10);

  const searchTypes = [
    { id: 'general', label: 'General Search', icon: Search, endpoint: '/api/vector/search' },
    { id: 'schedules', label: 'Schedules', icon: BarChart3, endpoint: '/api/vector/search/schedules' },
    { id: 'teams', label: 'Teams', icon: Zap, endpoint: '/api/vector/search/teams' },
    { id: 'constraints', label: 'Constraints', icon: Filter, endpoint: '/api/vector/search/constraints' },
    { id: 'apis', label: 'API Endpoints', icon: Bot, endpoint: '/api/vector/search/apis' },
    { id: 'assistant', label: 'AI Assistant', icon: MessageCircle, endpoint: '/api/vector/assistant/ask' }
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setResults([]);
    setAssistantResponse(null);

    try {
      const selectedType = searchTypes.find(t => t.id === searchType);
      const endpoint = selectedType?.endpoint || '/api/vector/search';

      const payload = searchType === 'assistant' 
        ? { question: query, includeContext: true }
        : { 
            query, 
            topK: limit, 
            filter: sport ? { sport } : null 
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (searchType === 'assistant') {
        setAssistantResponse(data);
      } else {
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      schedule: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      team: 'bg-green-500/20 text-green-400 border-green-500/30',
      constraint: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      api: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      insight: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      default: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[type as keyof typeof colors] || colors.default;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Vector Search Interface
            </h1>
            <p className="text-white/70">
              Semantic search across 1.5M+ FlexTime data points
            </p>
          </div>

          {/* Search Type Selector */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {searchTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSearchType(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    searchType === type.id
                      ? 'bg-blue-500/30 border-blue-400 text-blue-400'
                      : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon size={16} />
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                searchType === 'assistant' 
                  ? "Ask me anything about scheduling..."
                  : "Search schedules, teams, constraints..."
              }
              className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white p-2 rounded-lg transition-colors"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Filters */}
          {searchType !== 'assistant' && (
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                <Filter size={16} />
                Filters
              </button>
              
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-4"
                >
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="">All Sports</option>
                    <option value="basketball">Basketball</option>
                    <option value="football">Football</option>
                    <option value="wrestling">Wrestling</option>
                    <option value="baseball">Baseball</option>
                  </select>
                  
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                    min="1"
                    max="50"
                    className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    placeholder="Limit"
                  />
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* Results */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <p className="text-white/70 mt-4">Searching vector database...</p>
          </motion.div>
        )}

        {/* Assistant Response */}
        {assistantResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="text-blue-400" size={24} />
              <h2 className="text-xl font-semibold text-white">AI Assistant Response</h2>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-white/90 leading-relaxed">{assistantResponse.answer}</p>
            </div>

            {assistantResponse.sources.length > 0 && (
              <div>
                <h3 className="text-white/80 font-medium mb-3">Sources:</h3>
                <div className="grid gap-2">
                  {assistantResponse.sources.map((source, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                    >
                      <div>
                        <span className={`inline-block px-2 py-1 rounded text-xs border ${getTypeColor(source.type)}`}>
                          {source.type}
                        </span>
                        <span className="text-white ml-3">{source.name}</span>
                      </div>
                      <span className="text-blue-400 text-sm">
                        {(source.relevance * 100).toFixed(1)}% relevant
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">
              Search Results ({results.length})
            </h2>
            
            <div className="grid gap-4">
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs border ${getTypeColor(result.metadata.type)}`}>
                        {result.metadata.type}
                      </span>
                      <span className="text-white font-medium">
                        {result.metadata.name || result.metadata.endpoint || result.id}
                      </span>
                    </div>
                    <span className="text-blue-400 text-sm">
                      {(result.score * 100).toFixed(1)}% match
                    </span>
                  </div>
                  
                  {result.metadata.description && (
                    <p className="text-white/70 text-sm">
                      {result.metadata.description}
                    </p>
                  )}
                  
                  {result.metadata.sport && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      {result.metadata.sport}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !results.length && !assistantResponse && query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="mx-auto text-white/30 mb-4" size={48} />
            <p className="text-white/70">No results found for "{query}"</p>
            <p className="text-white/50 text-sm mt-2">Try adjusting your search terms or filters</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VectorSearchInterface;