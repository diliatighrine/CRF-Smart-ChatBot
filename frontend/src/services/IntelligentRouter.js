import { MLIntentClassifier } from './MLIntentClassifier';
import { localModel } from './LocalModelService';

export class IntelligentRouter {
  constructor(useML = true) { // Default to ML for better accuracy
    // Choose classifier based on configuration
    this.useML = useML;
    this.classifier = new MLIntentClassifier() ;
    
    // Model mapping configuration - based on ML intents
    this.modelMapping = {
      'image': 'Image Generator',          // Always cloud
      'document': 'Local Model',           // Simple doc queries
      'document_complex': 'Gemini 2',      // Complex doc analysis
      'help': 'Local Model',               // Help queries
      'simple': 'Local Model',             // Simple questions
      'greeting': 'Local Model',           // Greetings
      'complex': 'Pro',                    // Complex tasks
      'general': 'Local Model'             // General queries
    };
    
    // Cloud-only mapping for when local isn't available
    this.cloudOnlyMapping = {
      'image': 'Image Generator',
      'document': 'Best',
      'document_complex': 'Gemini 2',
      'help': 'Best',
      'simple': 'Best',
      'greeting': 'Best',
      'complex': 'Pro',
      'general': 'Best'
    };
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      averageRoutingTime: 0,
      mlClassificationTime: 0,
      intentCounts: {},
      modelCounts: {
        'Local Model': 0,
        'Best': 0,
        'Gemini 2': 0,
        'Gemini 2 Flash': 0,
        'Image Generator': 0,
        'Pro': 0
      }
    };
    
    // Initialize both models in parallel
    this.initializeModels();
  }

  async initializeModels() {
    console.log('🚀 Initializing routing system...');
    
    // Initialize ML classifier and local model in parallel
    const promises = [];
    
    if (this.useML) {
      promises.push(this.classifier.initialize());
    }
    
    promises.push(localModel.initialize((progress) => {
      console.log(`Local model loading: ${progress.progress}%`);
    }));
    
    try {
      await Promise.all(promises);
      console.log('✅ All models initialized successfully');
    } catch (error) {
      console.error('Error initializing models:', error);
    }
  }

  // Route the request to appropriate model
  async route(message, userId, imageUrl = null) {
    const startTime = performance.now();
    
    try {
      // Use ML classification for maximum accuracy
      const classificationStart = performance.now();
      const classification = await this.classifier.classify(message);
      const classificationTime = performance.now() - classificationStart;
      
      // Update ML classification time metric
      this.metrics.mlClassificationTime = 
        (this.metrics.mlClassificationTime * this.metrics.totalRequests + classificationTime) / 
        (this.metrics.totalRequests + 1);
      
      // Determine if we should use local model
      let selectedModel;
      let useLocal = false;
      
      // Check conditions for local processing
      const localReady = localModel.isReady;
      const canHandleLocally = localModel.isSuitable(message);
      const requiresCloud = classification.requiresCloud || imageUrl;
      const intent = classification.intent;
      
      if (localReady && canHandleLocally && !requiresCloud) {
        // Use local model for suitable tasks
        selectedModel = 'Local Model';
        useLocal = true;
        console.log(`✅ Routing to local model for ${intent} intent`);
      } else {
        // Use cloud model based on intent
        selectedModel = this.cloudOnlyMapping[intent] || 'Best';
        
        // Log why we're not using local
        if (!localReady) {
          console.log('☁️ Routing to cloud: Local model not ready');
        } else if (!canHandleLocally) {
          console.log('☁️ Routing to cloud: Message too long for local model');
        } else if (requiresCloud) {
          console.log(`☁️ Routing to cloud: ${intent} intent requires cloud processing`);
        } else if (imageUrl) {
          console.log('☁️ Routing to cloud: Image processing required');
        }
      }
      
      // Update metrics
      const routingTime = performance.now() - startTime;
      this.updateMetrics(intent, selectedModel, routingTime);
      
      // Create detailed response
      const response = {
        model: selectedModel,
        intent: intent,
        confidence: classification.confidence,
        isLocal: useLocal,
        isComplex: classification.isComplex,
        metadata: {
          userId,
          intent: intent,
          confidence: classification.confidence,
          scores: classification.scores,
          mlScore: classification.mlScore,
          routingTime: `${routingTime.toFixed(2)}ms`,
          classificationTime: `${classificationTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          classifierType: 'ML (BART Large MNLI)',
          deviceType: localModel.deviceType,
          localModelReady: localReady,
          requiresCloud: requiresCloud
        }
      };
      
      // Detailed logging for development
      console.log('🎯 Routing decision:', {
        message: message.substring(0, 50) + '...',
        intent: intent,
        confidence: `${classification.confidence}%`,
        model: selectedModel,
        isLocal: useLocal,
        scores: classification.scores
      });
      
      return response;
    } catch (error) {
      console.error('Routing error:', error);
      
      // Fallback response
      return {
        model: 'Best',
        intent: 'simple',
        confidence: 0,
        isLocal: false,
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
  updateMetrics(intent, model, routingTime) {
    this.metrics.totalRequests++;
    
    // Update intent counts
    if (!this.metrics.intentCounts[intent]) {
      this.metrics.intentCounts[intent] = 0;
    }
    this.metrics.intentCounts[intent]++;
    
    // Update model counts
    this.metrics.modelCounts[model] = (this.metrics.modelCounts[model] || 0) + 1;
    
    // Update average routing time
    const currentAvg = this.metrics.averageRoutingTime;
    const totalRequests = this.metrics.totalRequests;
    this.metrics.averageRoutingTime = 
      (currentAvg * (totalRequests - 1) + routingTime) / totalRequests;
  }

  // Get current metrics
  getMetrics() {
    const localPercentage = this.metrics.totalRequests > 0 
      ? Math.round((this.metrics.modelCounts['Local Model'] / this.metrics.totalRequests) * 100)
      : 0;
      
    return {
      ...this.metrics,
      localModelPercentage: localPercentage,
      avgClassificationTime: `${this.metrics.mlClassificationTime.toFixed(2)}ms`,
      classifierInfo: this.classifier.getModelInfo ? this.classifier.getModelInfo() : {},
      localModel: localModel.getStatus()
    };
  }

  // Check if both models are ready
  isFullyReady() {
    const mlReady = !this.useML || this.classifier.isReady;
    const localReady = localModel.isReady;
    return mlReady && localReady;
  }

  // Get detailed status
  getStatus() {
    return {
      classifier: {
        type: 'ML (Zero-shot)',
        ...this.classifier.getStatus(),
        modelInfo: this.classifier.getModelInfo ? this.classifier.getModelInfo() : {}
      },
      localModel: localModel.getStatus(),
      isFullyReady: this.isFullyReady()
    };
  }

  // Force ML initialization (already using ML by default)
  async ensureMLClassifier() {
    if (!this.useML) {
      this.useML = true;
      this.classifier = new MLIntentClassifier();
    }
    
    if (!this.classifier.isReady) {
      await this.classifier.initialize();
    }
  }
}

// Create singleton instance with ML classifier by default
export const router = new IntelligentRouter(true);