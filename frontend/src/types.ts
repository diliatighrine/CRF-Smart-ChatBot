// types.ts
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  intent?: string;
  timestamp?: string;
  isLocal?: boolean;
  image?: string;
  metadata?: {
    responseTime?: string;
    tokensGenerated?: number;
    cached?: boolean;
    deviceType?: string;
    modelName?: string;
    provider?: 'webllm' | 'transformers';
  };
}

export interface Model {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export interface ClassificationResult {
  intent: 'image' | 'document' | 'document_complex' | 'help' | 'simple' | 'greeting' | 'complex' | 'general';
  confidence: number;
  scores: Record<string, number>;
  rawScore?: number;
  mlScore?: number;
  isComplex?: boolean;
  requiresCloud?: boolean;
}

export interface RoutingResult {
  model: string;
  intent: string;
  confidence: number;
  isLocal?: boolean;
  metadata: {
    userId: string;
    intent: string;
    confidence?: number;
    scores?: Record<string, number>;
    routingTime?: string;
    timestamp: string;
    classifierType?: 'ML' | 'pattern';
    deviceType?: string;
    localModelReady?: boolean;
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
  modelCounts?: Record<string, number>;
  classifierType?: 'ML' | 'pattern';
  localModel?: LocalModelStatus;
}

export interface ClassifierStatus {
  isReady: boolean;
  isLoading: boolean;
  type?: 'ML' | 'pattern';
}

export interface LocalModelStatus {
  isReady: boolean;
  isLoading: boolean;
  deviceType: 'high-end' | 'mid-range' | 'low-end' | 'cpu-only';
  model: string | null;
  provider?: 'webllm' | 'transformers';
  canRunLocal: boolean;
  supportsImages?: boolean;
  metrics?: {
    totalInferences: number;
    averageResponseTime: number;
    totalTokensGenerated: number;
    cacheHits: number;
  };
}

export interface LocalModelProgress {
  progress: number;
  text: string;
}

export interface LocalModelResponse {
  text: string;
  model: string;
  deviceType: string;
  metrics: {
    responseTime: string;
    tokensGenerated: number;
    cached: boolean;
  };
}