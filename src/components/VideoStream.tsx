import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { EmotionData } from '../types/emotion';
import { AlertCircle, Camera } from 'lucide-react';

interface VideoStreamProps {
  isDetecting: boolean;
  onEmotionDetected: (emotion: EmotionData) => void;
  currentEmotion: EmotionData | null;
}

const VideoStream: React.FC<VideoStreamProps> = ({ 
  isDetecting, 
  onEmotionDetected, 
  currentEmotion 
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize TensorFlow.js and face landmarks detection
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setIsModelLoading(true);
        setError(null);

        // Initialize TensorFlow.js
        await tf.ready();
        
        // Load face landmarks detection model
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
          runtime: 'tfjs' as const,
          maxFaces: 1,
          refineLandmarks: true,
        };
        
        const faceDetector = await faceLandmarksDetection.createDetector(model, detectorConfig);
        setDetector(faceDetector);
        
        console.log('Face detection model loaded successfully');
      } catch (err) {
        console.error('Error loading face detection model:', err);
        setError('Failed to load emotion detection model. Please refresh the page.');
      } finally {
        setIsModelLoading(false);
      }
    };

    initializeModel();
  }, []);

  // Emotion detection logic
  const detectEmotion = async () => {
    if (!detector || !webcamRef.current || !canvasRef.current) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    
    if (!video || video.readyState !== 4) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      // Detect faces
      const faces = await detector.estimateFaces(video);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (faces.length > 0) {
        const face = faces[0];
        
        // Simple emotion classification based on face landmarks
        // In a production app, you'd use a trained emotion classification model
        const emotion = classifyEmotion(face.keypoints);
        
        // Draw face landmarks and emotion
        drawFaceLandmarks(ctx, face.keypoints);
        drawEmotionOverlay(ctx, emotion, canvas.width, canvas.height);
        
        onEmotionDetected(emotion);
      }
    } catch (err) {
      console.error('Error during emotion detection:', err);
    }
  };

  // Simple emotion classification (placeholder - in production use a trained model)
  const classifyEmotion = (keypoints: any[]): EmotionData => {
    // This is a simplified emotion classification
    // In a real application, you would use a trained CNN model
    const emotions = ['happy', 'sad', 'angry', 'surprised', 'neutral'] as const;
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const confidence = 0.6 + Math.random() * 0.4; // Random confidence between 0.6-1.0
    
    return {
      emotion: randomEmotion,
      confidence,
      timestamp: Date.now(),
    };
  };

  // Draw face landmarks on canvas
  const drawFaceLandmarks = (ctx: CanvasRenderingContext2D, keypoints: any[]) => {
    ctx.fillStyle = '#00FF00';
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 1;
    
    // Draw key facial points
    keypoints.slice(0, 50).forEach((point, index) => {
      if (index % 5 === 0) { // Draw every 5th point to avoid clutter
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  // Draw emotion overlay
  const drawEmotionOverlay = (
    ctx: CanvasRenderingContext2D, 
    emotion: EmotionData, 
    width: number, 
    height: number
  ) => {
    // Background for emotion text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 300, 80);
    
    // Emotion text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Emotion: ${emotion.emotion}`, 20, 40);
    
    ctx.font = '18px Arial';
    ctx.fillText(`Confidence: ${(emotion.confidence * 100).toFixed(1)}%`, 20, 65);
    
    // Confidence bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(20, 75, 200, 10);
    
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(20, 75, 200 * emotion.confidence, 10);
  };

  // Start/stop detection
  useEffect(() => {
    if (isDetecting && detector) {
      detectionIntervalRef.current = setInterval(detectEmotion, 100); // 10 FPS
    } else {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      // Clear canvas when not detecting
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isDetecting, detector]);

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isModelLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading emotion detection model...</p>
          </div>
        </div>
      )}
      
      <div className="relative rounded-xl overflow-hidden bg-black">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          className="w-full h-auto"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: 'user',
          }}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        
        {/* Current emotion indicator */}
        {currentEmotion && isDetecting && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="text-2xl">
                {currentEmotion.emotion === 'happy' && '😊'}
                {currentEmotion.emotion === 'sad' && '😢'}
                {currentEmotion.emotion === 'angry' && '😠'}
                {currentEmotion.emotion === 'surprised' && '😲'}
                {currentEmotion.emotion === 'neutral' && '😐'}
              </div>
              <div>
                <div className="font-semibold capitalize">{currentEmotion.emotion}</div>
                <div className="text-sm text-gray-300">
                  {(currentEmotion.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}
        
        {!isDetecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Click "Start Detection" to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoStream;