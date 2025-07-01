"""
Alternative Python FastAPI Backend Implementation
This is an example of how you could implement the backend using Python and FastAPI
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Emotion Detection API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (in production, use Redis or a database)
emotion_data: List[Dict] = []
session_stats = {
    "total_sessions": 0,
    "sessions": [],
    "emotion_distribution": {
        "happy": 0,
        "sad": 0,
        "angry": 0,
        "surprised": 0,
        "neutral": 0,
    },
}

# Active WebSocket connections
active_connections: List[WebSocket] = []

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        session_stats["total_sessions"] += 1
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    session_start = datetime.now()
    
    try:
        while True:
            data = await websocket.receive_text()
            emotion_data_point = json.loads(data)
            
            # Validate emotion data
            if all(key in emotion_data_point for key in ["emotion", "confidence", "timestamp"]):
                # Store emotion data
                emotion_data_point.update({
                    "session_id": session_stats["total_sessions"],
                    "received_at": datetime.now().timestamp() * 1000
                })
                emotion_data.append(emotion_data_point)
                
                # Update emotion distribution
                emotion = emotion_data_point["emotion"]
                if emotion in session_stats["emotion_distribution"]:
                    session_stats["emotion_distribution"][emotion] += 1
                
                # Cleanup old data (keep last 1000 records)
                if len(emotion_data) > 1000:
                    emotion_data[:] = emotion_data[-1000:]
                
                logger.info(f"Received emotion: {emotion} ({emotion_data_point['confidence']*100:.1f}%)")
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        
        # Calculate session duration
        session_end = datetime.now()
        session_duration = (session_end - session_start).total_seconds()
        
        session_stats["sessions"].append({
            "start": session_start.timestamp() * 1000,
            "end": session_end.timestamp() * 1000,
            "duration": session_duration
        })
        
        logger.info(f"Session ended. Duration: {session_duration:.1f}s")

@app.get("/api/stats")
async def get_stats():
    now = datetime.now()
    five_minutes_ago = now - timedelta(minutes=5)
    five_minutes_ago_ms = five_minutes_ago.timestamp() * 1000
    
    # Filter recent emotion data
    recent_emotions = [e for e in emotion_data if e["received_at"] > five_minutes_ago_ms]
    
    # Calculate average confidence
    total_confidence = sum(e["confidence"] for e in recent_emotions)
    average_confidence = total_confidence / len(recent_emotions) if recent_emotions else 0
    
    # Calculate average session duration
    total_duration = sum(s["duration"] for s in session_stats["sessions"])
    average_session_duration = total_duration / len(session_stats["sessions"]) if session_stats["sessions"] else 0
    
    # Find peak emotion
    emotion_counts = session_stats["emotion_distribution"]
    peak_emotion = max(emotion_counts, key=emotion_counts.get) if any(emotion_counts.values()) else "neutral"
    
    return {
        "totalSessions": session_stats["total_sessions"],
        "averageSessionDuration": average_session_duration,
        "emotionDistribution": session_stats["emotion_distribution"],
        "peakEmotion": peak_emotion,
        "confidenceAverage": average_confidence,
        "recentEmotionsCount": len(recent_emotions),
        "totalEmotionsCount": len(emotion_data),
    }

@app.get("/api/emotions")
async def get_emotions(limit: int = 100, offset: int = 0):
    emotions = emotion_data[-limit:][offset:]
    
    return {
        "emotions": [
            {
                "emotion": e["emotion"],
                "confidence": e["confidence"],
                "timestamp": e["timestamp"],
                "receivedAt": e["received_at"],
            }
            for e in emotions
        ],
        "total": len(emotion_data),
        "limit": limit,
        "offset": offset,
    }

@app.get("/api/sessions")
async def get_sessions():
    return {
        "totalSessions": session_stats["total_sessions"],
        "sessions": session_stats["sessions"][-10:],  # Last 10 sessions
        "currentConnections": len(manager.active_connections),
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "connections": len(manager.active_connections),
        "emotionDataCount": len(emotion_data),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)