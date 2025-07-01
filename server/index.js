import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for emotion data
let emotionData = [];
let sessionStats = {
  totalSessions: 0,
  sessions: [],
  emotionDistribution: {
    happy: 0,
    sad: 0,
    angry: 0,
    surprised: 0,
    neutral: 0,
  },
};

// Clean up old data (keep last 1000 records)
const cleanupData = () => {
  if (emotionData.length > 1000) {
    emotionData = emotionData.slice(-1000);
  }
};

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Emotion Detection API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      stats: '/api/stats',
      emotions: '/api/emotions',
      sessions: '/api/sessions',
      websocket: 'ws://localhost:8080'
    },
    timestamp: new Date().toISOString()
  });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Start a new session
  const sessionStart = Date.now();
  sessionStats.totalSessions += 1;
  
  ws.on('message', (data) => {
    try {
      const emotion = JSON.parse(data.toString());
      
      // Validate emotion data
      if (emotion.emotion && emotion.confidence && emotion.timestamp) {
        // Store emotion data
        emotionData.push({
          ...emotion,
          sessionId: sessionStats.totalSessions,
          receivedAt: Date.now(),
        });
        
        // Update emotion distribution
        if (sessionStats.emotionDistribution.hasOwnProperty(emotion.emotion)) {
          sessionStats.emotionDistribution[emotion.emotion] += 1;
        }
        
        // Cleanup old data periodically
        if (emotionData.length % 100 === 0) {
          cleanupData();
        }
        
        console.log(`Received emotion: ${emotion.emotion} (${(emotion.confidence * 100).toFixed(1)}%)`);
      }
    } catch (error) {
      console.error('Error parsing emotion data:', error);
    }
  });
  
  ws.on('close', () => {
    // Calculate session duration
    const sessionEnd = Date.now();
    const sessionDuration = (sessionEnd - sessionStart) / 1000; // in seconds
    
    sessionStats.sessions.push({
      start: sessionStart,
      end: sessionEnd,
      duration: sessionDuration,
    });
    
    console.log(`Client disconnected. Session duration: ${sessionDuration.toFixed(1)}s`);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// REST API endpoints

// Get emotion statistics
app.get('/api/stats', (req, res) => {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  // Filter recent emotion data
  const recentEmotions = emotionData.filter(emotion => emotion.receivedAt > fiveMinutesAgo);
  
  // Calculate average confidence
  const totalConfidence = recentEmotions.reduce((sum, emotion) => sum + emotion.confidence, 0);
  const averageConfidence = recentEmotions.length > 0 ? totalConfidence / recentEmotions.length : 0;
  
  // Calculate average session duration
  const totalDuration = sessionStats.sessions.reduce((sum, session) => sum + session.duration, 0);
  const averageSessionDuration = sessionStats.sessions.length > 0 ? totalDuration / sessionStats.sessions.length : 0;
  
  // Find peak emotion
  const emotionCounts = Object.entries(sessionStats.emotionDistribution);
  const peakEmotion = emotionCounts.reduce((max, [emotion, count]) => 
    count > max.count ? { emotion, count } : max, 
    { emotion: 'neutral', count: 0 }
  );
  
  const stats = {
    totalSessions: sessionStats.totalSessions,
    averageSessionDuration,
    emotionDistribution: sessionStats.emotionDistribution,
    peakEmotion: peakEmotion.emotion,
    confidenceAverage: averageConfidence,
    recentEmotionsCount: recentEmotions.length,
    totalEmotionsCount: emotionData.length,
  };
  
  res.json(stats);
});

// Get raw emotion data
app.get('/api/emotions', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  
  const emotions = emotionData
    .slice(-limit)
    .slice(offset)
    .map(emotion => ({
      emotion: emotion.emotion,
      confidence: emotion.confidence,
      timestamp: emotion.timestamp,
      receivedAt: emotion.receivedAt,
    }));
  
  res.json({
    emotions,
    total: emotionData.length,
    limit,
    offset,
  });
});

// Get session information
app.get('/api/sessions', (req, res) => {
  res.json({
    totalSessions: sessionStats.totalSessions,
    sessions: sessionStats.sessions.slice(-10), // Last 10 sessions
    currentConnections: wss.clients.size,
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: wss.clients.size,
    emotionDataCount: emotionData.length,
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Emotion detection server running on port ${PORT}`);
  console.log(`📊 WebSocket server ready for connections`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 API documentation: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});