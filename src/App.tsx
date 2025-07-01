import React, { useState, useRef, useEffect } from 'react';
import { Camera, Play, Square, BarChart3, Activity, Users } from 'lucide-react';
import VideoStream from './components/VideoStream';
import EmotionChart from './components/EmotionChart';
import StatsPanel from './components/StatsPanel';
import { EmotionData, EmotionStats } from './types/emotion';

function App() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [emotions, setEmotions] = useState<EmotionData[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [stats, setStats] = useState<EmotionStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to emotion server');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from emotion server');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Fetch stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiUrl}/api/stats`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    if (isConnected) {
      fetchStats();
      const interval = setInterval(fetchStats, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const handleEmotionDetected = (emotion: EmotionData) => {
    setCurrentEmotion(emotion);
    setEmotions(prev => [...prev.slice(-49), emotion]);

    // Send to backend via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(emotion));
    }
  };

  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
    if (!isDetecting) {
      setEmotions([]);
      setCurrentEmotion(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Emotion-Aware Video Chat
            </h1>
          </div>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Real-time emotion detection powered by TensorFlow.js with live analytics and insights
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex justify-center mb-6">
          <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
            isConnected 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            {isConnected ? 'Connected to Server' : 'Connecting to Server...'}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Stream */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Camera className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-semibold text-white">Live Video Stream</h2>
                </div>
                <button
                  onClick={toggleDetection}
                  className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 ${
                    isDetecting
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                  }`}
                >
                  {isDetecting ? (
                    <>
                      <Square className="w-4 h-4" />
                      Stop Detection
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Detection
                    </>
                  )}
                </button>
              </div>

              <VideoStream
                isDetecting={isDetecting}
                onEmotionDetected={handleEmotionDetected}
                currentEmotion={currentEmotion}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Emotion */}
            {currentEmotion && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Current Emotion
                </h3>
                <div className="text-center">
                  <div className="text-3xl mb-2">
                    {currentEmotion.emotion === 'happy' && '😊'}
                    {currentEmotion.emotion === 'sad' && '😢'}
                    {currentEmotion.emotion === 'angry' && '😠'}
                    {currentEmotion.emotion === 'surprised' && '😲'}
                    {currentEmotion.emotion === 'neutral' && '😐'}
                  </div>
                  <div className="text-xl font-bold text-white capitalize mb-2">
                    {currentEmotion.emotion}
                  </div>
                  <div className="text-sm text-slate-300">
                    Confidence: {(currentEmotion.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentEmotion.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stats Panel */}
            <StatsPanel stats={stats} />
          </div>
        </div>

        {/* Emotion Chart */}
        {emotions.length > 0 && (
          <div className="mt-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Emotion Trends</h2>
              </div>
              <EmotionChart emotions={emotions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;