// types.ts
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  intent?: string;
  timestamp?: string;
}

export interface Model {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export interface ClassificationResult {
  intent: 'image' | 'document' | 'help' | 'simple';
  confidence: number;
  scores: Record<string, number>;
  rawScore?: number;
  mlScore?: number;
}

export interface RoutingResult {
  model: string;
  intent: string;
  confidence: number;
  metadata: {
    userId: string;
    intent: string;
    confidence?: number;
    scores?: Record<string, number>;
    routingTime?: string;
    timestamp: string;
    classifierType?: 'ML' | 'pattern';
    error?: string;
  };
}

export interface RouterMetrics {
  totalRequests: number;
  averageRoutingTime: number;
  intentCounts: {
    image: number;
    document: number;
    help: number;
    simple: number;
  };
  classifierType?: 'ML' | 'pattern';
}

export interface ClassifierStatus {
  isReady: boolean;
  isLoading: boolean;
  type?: 'ML' | 'pattern';
}