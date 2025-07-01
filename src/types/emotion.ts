export interface EmotionData {
  emotion: 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral';
  confidence: number;
  timestamp: number;
}

export interface EmotionStats {
  totalSessions: number;
  averageSessionDuration: number;
  emotionDistribution: {
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    neutral: number;
  };
  peakEmotion: string;
  confidenceAverage: number;
}

export interface FaceLandmarks {
  x: number;
  y: number;
  z?: number;
}