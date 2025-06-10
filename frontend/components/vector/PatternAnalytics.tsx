import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Award, BarChart3, Zap, Target } from 'lucide-react';

interface Pattern {
  id: string;
  score: number;
  metadata: {
    type: string;
    sport?: string;
    confidence: number;
    pattern?: string;
    description?: string;
  };
}

interface Anomaly {
  isAnomaly: boolean;
  anomalyScore: number;
  similarityScore: number;
  message: string;
  similarSchedules: Array<{
    id: string;
    score: number;
    metadata: any;
  }>;
}

interface Recommendation {
  id: string;
  score: number;
  type: string;
  description: string;
  metadata: any;
}

const PatternAnalytics: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState('basketball');
  const [patterns, setPatterns] = useState<{
    high: Pattern[];
    medium: Pattern[];
    low: Pattern[];
  }>({ high: [], medium: [], low: [] });
  const [anomaly, setAnomaly] = useState<Anomaly | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('patterns');

  const sports = [
    'basketball', 'football', 'wrestling', 'baseball', 'soccer', 'tennis', 'golf'
  ];

  const tabs = [
    { id: 'patterns', label: 'Patterns', icon: TrendingUp },
    { id: 'anomaly', label: 'Anomaly Detection', icon: AlertTriangle },
    { id: 'recommendations', label: 'Recommendations', icon: Target }
  ];

  const loadPatterns = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vector/analytics/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport: selectedSport, type: 'all' })
      });
      const data = await response.json();
      setPatterns(data.patterns || { high: [], medium: [], low: [] });
    } catch (error) {
      console.error('Failed to load patterns:', error);
    }
    setIsLoading(false);
  };

  const runAnomalyDetection = async () => {
    setIsLoading(true);
    try {
      // Mock schedule data for testing
      const mockSchedule = {
        sport: selectedSport,
        games: [
          { team1: 'Kansas', team2: 'Baylor', date: '2025-01-15' },
          { team1: 'Iowa State', team2: 'Texas Tech', date: '2025-01-16' }
        ],
        constraints: ['no_back_to_back', 'min_rest_days'],
        venues: ['Allen Fieldhouse', 'United Supermarkets Arena']
      };

      const response = await fetch('/api/vector/analytics/anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: mockSchedule, sport: selectedSport })
      });
      const data = await response.json();
      setAnomaly(data);
    } catch (error) {
      console.error('Failed to run anomaly detection:', error);
    }
    setIsLoading(false);
  };

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const preferences = {
        minimize_travel: 'high',
        maximize_tv_exposure: 'medium',
        optimize_rest_days: 'high',
        prefer_neutral_sites: 'low'
      };

      const response = await fetch('/api/vector/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences, sport: selectedSport, limit: 10 })
      });
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'patterns') {
      loadPatterns();
    } else if (activeTab === 'anomaly') {
      runAnomalyDetection();
    } else if (activeTab === 'recommendations') {
      loadRecommendations();
    }
  }, [selectedSport, activeTab]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (confidence >= 0.6) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Pattern Analytics & Insights
            </h1>
            <p className="text-white/70">
              AI-powered pattern recognition and scheduling intelligence
            </p>
          </div>

          {/* Sport Selector */}
          <div className="flex justify-center mb-6">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              {sports.map(sport => (
                <option key={sport} value={sport} className="bg-slate-800">
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-2 mb-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-500/30 border-purple-400 text-purple-400'
                      : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <p className="text-white/70 mt-4">Analyzing patterns...</p>
          </motion.div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6"
          >
            {/* High Confidence Patterns */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Award className="text-green-400" size={24} />
                <h2 className="text-xl font-semibold text-white">
                  High Confidence Patterns ({patterns.high.length})
                </h2>
              </div>
              
              <div className="grid gap-4">
                {patterns.high.map((pattern, index) => (
                  <motion.div
                    key={pattern.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-lg border text-sm ${getConfidenceColor(pattern.metadata.confidence)}`}>
                        {getConfidenceLabel(pattern.metadata.confidence)} Confidence
                      </span>
                      <span className="text-purple-400 text-sm">
                        {(pattern.score * 100).toFixed(1)}% relevance
                      </span>
                    </div>
                    
                    <h3 className="text-white font-medium mb-2">
                      {pattern.metadata.pattern || pattern.id}
                    </h3>
                    
                    {pattern.metadata.description && (
                      <p className="text-white/70 text-sm">
                        {pattern.metadata.description}
                      </p>
                    )}
                    
                    {pattern.metadata.sport && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                        {pattern.metadata.sport}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Medium & Low Confidence Patterns */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="text-yellow-400" size={24} />
                  <h2 className="text-lg font-semibold text-white">
                    Medium Confidence ({patterns.medium.length})
                  </h2>
                </div>
                {/* Medium patterns content */}
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="text-red-400" size={24} />
                  <h2 className="text-lg font-semibold text-white">
                    Low Confidence ({patterns.low.length})
                  </h2>
                </div>
                {/* Low patterns content */}
              </div>
            </div>
          </motion.div>
        )}

        {/* Anomaly Detection Tab */}
        {activeTab === 'anomaly' && !isLoading && anomaly && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className={anomaly.isAnomaly ? "text-red-400" : "text-green-400"} size={24} />
              <h2 className="text-xl font-semibold text-white">Anomaly Detection Results</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Anomaly Status</h3>
                <div className={`inline-block px-3 py-1 rounded-lg text-sm ${
                  anomaly.isAnomaly 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {anomaly.isAnomaly ? 'Anomaly Detected' : 'Normal Pattern'}
                </div>
                <p className="text-white/70 text-sm mt-2">{anomaly.message}</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Scores</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/70">Anomaly Score:</span>
                    <span className="text-red-400">{(anomaly.anomalyScore * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Similarity Score:</span>
                    <span className="text-green-400">{(anomaly.similarityScore * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {anomaly.similarSchedules.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-4">Similar Schedules</h3>
                <div className="grid gap-3">
                  {anomaly.similarSchedules.map((schedule, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white">{schedule.id}</span>
                        <span className="text-blue-400">{(schedule.score * 100).toFixed(1)}% similar</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Target className="text-cyan-400" size={24} />
              <h2 className="text-xl font-semibold text-white">
                Schedule Recommendations ({recommendations.length})
              </h2>
            </div>

            <div className="grid gap-4">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-1 rounded text-xs">
                      {rec.type}
                    </span>
                    <span className="text-cyan-400 text-sm">
                      {(rec.score * 100).toFixed(1)}% match
                    </span>
                  </div>
                  
                  <p className="text-white">{rec.description}</p>
                  
                  {rec.metadata.sport && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                      {rec.metadata.sport}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PatternAnalytics;