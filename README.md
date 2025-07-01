# Emotion-Aware Video Chat Application

A real-time emotion detection application that uses TensorFlow.js for client-side emotion recognition and provides live analytics through WebSocket connections.

## Features

- 🎥 **Real-time Video Stream**: Live webcam feed with emotion detection overlay
- 🧠 **Emotion Detection**: Uses TensorFlow.js and face landmark detection for real-time emotion classification
- 📊 **Live Analytics**: Real-time charts and statistics of detected emotions
- 🔄 **WebSocket Integration**: Live data streaming between frontend and backend
- 📈 **Session Analytics**: Comprehensive session tracking and emotion distribution analysis
- 🐳 **Docker Support**: Containerized deployment with Docker Compose
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **TensorFlow.js** for machine learning
- **Face Landmarks Detection** for facial feature recognition
- **Chart.js** for data visualization
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **WebSocket** for real-time communication
- **CORS** for cross-origin requests
- In-memory data storage (easily extensible to Redis/PostgreSQL)

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Modern web browser with webcam access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd emotion-aware-video-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start the development servers**
   
   Terminal 1 (Backend):
   ```bash
   npm run server
   ```
   
   Terminal 2 (Frontend):
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` and allow camera access when prompted.

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   npm run docker:up
   ```

2. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8080`
   - Health Check: `http://localhost:8080/api/health`

3. **Stop the containers**
   ```bash
   npm run docker:down
   ```

## API Endpoints

### REST API
- `GET /api/health` - Health check
- `GET /api/stats` - Get emotion statistics
- `GET /api/emotions` - Get emotion data with pagination
- `GET /api/sessions` - Get session information

### WebSocket
- `ws://localhost:8080` - Real-time emotion data streaming

## Architecture

### Frontend Architecture
```
src/
├── components/
│   ├── VideoStream.tsx      # Video capture and emotion detection
│   ├── EmotionChart.tsx     # Data visualization
│   └── StatsPanel.tsx       # Analytics dashboard
├── types/
│   └── emotion.ts           # TypeScript interfaces
└── App.tsx                  # Main application component
```

### Backend Architecture
```
server/
├── index.js                 # Main server file
└── python_backend.py        # Alternative Python implementation
```

## Emotion Detection

The application uses a combination of:
- **Face Landmarks Detection**: Identifies facial features and key points
- **Emotion Classification**: Classifies emotions based on facial expressions
- **Confidence Scoring**: Provides confidence levels for each detection

### Supported Emotions
- 😊 Happy
- 😢 Sad
- 😠 Angry
- 😲 Surprised
- 😐 Neutral

## Customization

### Adding New Emotions
1. Update the `EmotionData` type in `src/types/emotion.ts`
2. Modify the emotion classification logic in `VideoStream.tsx`
3. Add corresponding emoji mappings in components

### Extending Backend Storage
Replace the in-memory storage with Redis or PostgreSQL:

```javascript
// Example Redis integration
import redis from 'redis';
const client = redis.createClient();

// Store emotion data
await client.lpush('emotions', JSON.stringify(emotionData));
```

### Custom Emotion Models
Replace the placeholder emotion detection with a trained model:

```javascript
// Load custom TensorFlow.js model
const model = await tf.loadLayersModel('/path/to/your/model.json');
const prediction = model.predict(preprocessedImage);
```

## Production Considerations

### Performance Optimization
- Adjust detection frequency (currently 10 FPS)
- Implement frame skipping for lower-end devices
- Add model quantization for faster inference

### Security
- Implement authentication for WebSocket connections
- Add rate limiting for API endpoints
- Use HTTPS in production

### Scalability
- Use Redis for distributed session storage
- Implement horizontal scaling with load balancers
- Add database persistence for long-term analytics

## Troubleshooting

### Common Issues

1. **Camera not detected**
   - Ensure browser has camera permissions
   - Check if camera is used by another application

2. **TensorFlow.js model loading fails**
   - Verify internet connection for model downloads
   - Check browser compatibility

3. **WebSocket connection issues**
   - Ensure backend server is running
   - Check firewall settings

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- TensorFlow.js team for the machine learning framework
- MediaPipe for face landmark detection
- React community for the excellent ecosystem