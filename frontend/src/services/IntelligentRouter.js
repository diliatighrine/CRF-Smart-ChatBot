import { IntentClassifier } from './IntentClassifier';
import { MLIntentClassifier } from './MLIntentClassifier';

export class IntelligentRouter {
  constructor(useML = false) {
    // Choose classifier based on configuration
    this.useML = useML;
    this.classifier = useML ? new MLIntentClassifier() : new IntentClassifier();
    
    // Model mapping configuration
    this.modelMapping = {
      'image': 'Image Generator',
      'document': 'Gemini 2',
      'help': 'Best',
      'simple': 'Best'
    };
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      averageRoutingTime: 0,
      intentCounts: {
        image: 0,
        document: 0,
        help: 0,
        simple: 0
      }
    };
  }

  // Route the request to appropriate model
  async route(message, userId) {
    const startTime = performance.now();
    
    try {
      // Classify intent (async for ML, sync for pattern-based)
      const classification = this.useML 
        ? await this.classifier.classify(message)
        : this.classifier.classify(message);
      
      // Determine the model based on intent
      const selectedModel = this.modelMapping[classification.intent];
      
      // Update metrics
      const routingTime = performance.now() - startTime;
      this.updateMetrics(classification.intent, routingTime);
      
      // Create detailed response
      const response = {
        model: selectedModel,
        intent: classification.intent,
        confidence: classification.confidence,
        metadata: {
          userId,
          intent: classification.intent,
          confidence: classification.confidence,
          scores: classification.scores,
          routingTime: `${routingTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          classifierType: this.useML ? 'ML' : 'pattern'
        }
      };
      
      // Log routing decision in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Routing decision:', {
          message: message.substring(0, 50) + '...',
          ...response
        });
      }
      
      return response;
    } catch (error) {
      console.error('Routing error:', error);
      
      // Fallback response
      return {
        model: 'Best',
        intent: 'simple',
        confidence: 0,
        metadata: {
          userId,
          intent: 'simple',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Update performance metrics
  updateMetrics(intent, routingTime) {
    this.metrics.totalRequests++;
    this.metrics.intentCounts[intent]++;
    
    // Update average routing time
    const currentAvg = this.metrics.averageRoutingTime;
    const totalRequests = this.metrics.totalRequests;
    this.metrics.averageRoutingTime = 
      (currentAvg * (totalRequests - 1) + routingTime) / totalRequests;
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      classifierType: this.useML ? 'ML' : 'pattern'
    };
  }

  // Check if ML model is ready (if using ML)
  isReady() {
    if (!this.useML) return true;
    return this.classifier.getStatus().isReady;
  }

  // Get classifier status
  getStatus() {
    if (!this.useML) {
      return { isReady: true, isLoading: false, type: 'pattern' };
    }
    return {
      ...this.classifier.getStatus(),
      type: 'ML'
    };
  }

  // Switch classifier type
  async switchClassifierType(useML) {
    if (this.useML === useML) return;
    
    this.useML = useML;
    this.classifier = useML ? new MLIntentClassifier() : new IntentClassifier();
    
    // Reset metrics when switching
    this.metrics.totalRequests = 0;
    this.metrics.averageRoutingTime = 0;
    
    // Initialize ML model if needed
    if (useML && !this.classifier.isReady) {
      await this.classifier.initialize();
    }
  }
}

// Create singleton instance with pattern-based classifier by default
export const router = new IntelligentRouter(false);