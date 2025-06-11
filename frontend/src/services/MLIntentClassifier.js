// ML-based intent classifier using Transformers.js
// Note: This requires adding transformers.js to your project:
// npm install @xenova/transformers

import { pipeline } from '@xenova/transformers';
import { env } from '@xenova/transformers';



export class MLIntentClassifier {
  constructor() {
    this.classifier = null;
    this.isLoading = false;
    this.isReady = false;
    env.allowLocalModels = false;   // skip the local check
    env.useBrowserCache  = false;   // flush any bad HTML already cached
    // Intent labels for zero-shot classification
    this.intentLabels = [
      'generate image or create visual content',
      'search documents or find information',
      'get help or learn how to use',
      'general conversation or simple query'
    ];
    
    // Mapping from classifier labels to intent names
    this.labelToIntent = {
      'generate image or create visual content': 'image',
      'search documents or find information': 'document',
      'get help or learn how to use': 'help',
      'general conversation or simple query': 'simple'
    };
    
    // Initialize the model
    this.initialize();
  }

  async initialize() {
    if (this.isLoading || this.isReady) return;
    
    this.isLoading = true;
    console.log('Loading ML model for intent classification...');
    console.time('⏳ [ML] model-load');              // START timer

    try {
      // Load the zero-shot classification pipeline
      // This will download the model on first use (~100MB)
      this.classifier = await pipeline(
        'zero-shot-classification',
        'Xenova/mobilebert-uncased-mnli' // Lighter model for browser use
      );
      
      this.isReady = true;
      this.isLoading = false;
      console.log('ML model loaded successfully');
      console.timeEnd('⏳ [ML] model-load');        // END timer

    } catch (error) {
      console.error('Failed to load ML model:', error);
      this.isLoading = false;
      throw error;
    }
  }

  async classify(message) {
    // Ensure model is loaded
    if (!this.isReady) {
      if (!this.isLoading) {
        await this.initialize();
      } else {
        // Wait for ongoing initialization
        while (this.isLoading) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    try {
      // Perform zero-shot classification
       console.time('🔎 [ML] intent-analysis');
      const result = await this.classifier(message, this.intentLabels, {
        multi_label: false,
        hypothesis_template: 'This text is about {}.'
      });
      console.timeEnd('🔎 [ML] intent-analysis');
      console.log('🧠 Intent details →', result); 
      // Get the best matching label
      const bestLabel = result.labels[0];
      const bestScore = result.scores[0];
      const intent = this.labelToIntent[bestLabel];

      // Create scores object for all intents
      const scores = {};
      result.labels.forEach((label, index) => {
        const intentName = this.labelToIntent[label];
        scores[intentName] = Math.round(result.scores[index] * 100);
      });

      return {
        intent: intent,
        confidence: Math.round(bestScore * 100),
        mlScore: bestScore,
        scores
      };
    } catch (error) {
      console.error('Classification error:', error);
      // Fallback to simple intent
      return {
        intent: 'simple',
        confidence: 0,
        mlScore: 0,
        scores: { simple: 100, image: 0, document: 0, help: 0 }
      };
    }
  }

  // Get loading status
  getStatus() {
    return {
      isReady: this.isReady,
      isLoading: this.isLoading
    };
  }
}