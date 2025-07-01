import React from 'react';
import { TrendingUp, Clock, Target, Users } from 'lucide-react';
import { EmotionStats } from '../types/emotion';

interface StatsPanelProps {
  stats: EmotionStats | null;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Analytics
        </h3>
        <div className="text-center text-slate-400 py-8">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No analytics data available</p>
          <p className="text-sm mt-2">Start a session to see insights</p>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const mostCommonEmotion = Object.entries(stats.emotionDistribution)
    .sort(([,a], [,b]) => b - a)[0];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Session Analytics
      </h3>

      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-3 mx-auto">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalSessions}</div>
            <div className="text-sm text-slate-300">Total Sessions</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-xl mb-3 mx-auto">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatDuration(Math.round(stats.averageSessionDuration))}
            </div>
            <div className="text-sm text-slate-300">Avg Duration</div>
          </div>
        </div>

        {/* Peak Emotion */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-xl mb-3 mx-auto">
            <Target className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-xl font-bold text-white capitalize mb-1">
            {mostCommonEmotion?.[0] || 'None'}
          </div>
          <div className="text-sm text-slate-300">Most Common Emotion</div>
          <div className="text-sm text-slate-400">
            {mostCommonEmotion?.[1] || 0} detections
          </div>
        </div>

        {/* Confidence Average */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-300">Average Confidence</span>
            <span className="text-sm text-white font-medium">
              {(stats.confidenceAverage * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.confidenceAverage * 100}%` }}
            />
          </div>
        </div>

        {/* Emotion Distribution */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3">Emotion Distribution</h4>
          <div className="space-y-2">
            {Object.entries(stats.emotionDistribution).map(([emotion, count]) => {
              const total = Object.values(stats.emotionDistribution).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={emotion} className="flex items-center gap-3">
                  <div className="text-lg">
                    {emotion === 'happy' && '😊'}
                    {emotion === 'sad' && '😢'}
                    {emotion === 'angry' && '😠'}
                    {emotion === 'surprised' && '😲'}
                    {emotion === 'neutral' && '😐'}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white capitalize">{emotion}</span>
                      <span className="text-slate-300">{count}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1">
                      <div
                        className="h-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;