// ML-based intent classifier using Transformers.js with simplified, clearer labels
import { pipeline } from '@xenova/transformers';
import { env } from '@xenova/transformers';

export class MLIntentClassifier {
  constructor() {
    this.classifier = null;
    this.isLoading = false;
    this.isReady = false;
    
    // Configure environment
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    
    // Very specific and distinct intent labels for better ML classification
    this.intentLabels = [
      'mathematical calculation or arithmetic problem requiring computation',
      'casual greeting or salutation to start conversation', 
      'request for help or tutorial on how to do something',
      'quick factual question expecting a brief direct answer',
      'request to generate create draw or make images pictures or visual content',
      'request for historical facts biographical information or encyclopedia-style knowledge',
      'comprehensive research analysis or complex multi-step task requiring detailed work',
      'document processing text analysis or working with written content'
    ];
    
    // Direct mapping from labels to intents
    this.labelToIntent = {
      'mathematical calculation or arithmetic problem requiring computation': 'simple',
      'casual greeting or salutation to start conversation': 'greeting', 
      'request for help or tutorial on how to do something': 'help',
      'quick factual question expecting a brief direct answer': 'simple',
      'request to generate create draw or make images pictures or visual content': 'image',
      'request for historical facts biographical information or encyclopedia-style knowledge': 'historical_facts',
      'comprehensive research analysis or complex multi-step task requiring detailed work': 'complex',
      'document processing text analysis or working with written content': 'document_complex'
    };
  }

  async initialize() {
    if (this.isLoading || this.isReady) return;
    
    this.isLoading = true;
    console.log('🧠 Loading ML intent classifier...');

    try {
      // Use a smaller, faster model that's more reliable
      this.classifier = await pipeline(
        'zero-shot-classification',
        'Xenova/distilbert-base-uncased-mnli' // Smaller, faster than BART
      );
      
      this.isReady = true;
      this.isLoading = false;
      console.log('✅ ML classifier loaded successfully');
      
      // Warm up with a simple test
      await this.warmUp();
    } catch (error) {
      console.error('Failed to load ML classifier:', error);
      this.isLoading = false;
      throw error;
    }
  }

  async warmUp() {
    console.log('🔥 Warming up classifier...');
    await this.classify('Hello there');
    await this.classify('What is 5 + 3?');
    console.log('✅ Classifier warmed up');
  }

  async classify(message) {
    // Ensure model is loaded
    if (!this.isReady) {
      if (!this.isLoading) {
        await this.initialize();
      } else {
        while (this.isLoading) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    try {
      console.time('🔎 ML-classification');
      
      // Perform zero-shot classification with improved settings
      const result = await this.classifier(message, this.intentLabels, {
        multi_label: false,
        hypothesis_template: 'This message is requesting {}.'
      });
      
      console.timeEnd('🔎 ML-classification');
      
      // Get the best classification
      const primaryLabel = result.labels[0];
      const primaryScore = result.scores[0];
      let intent = this.labelToIntent[primaryLabel] || 'simple';
      
      // Additional logic to improve classification accuracy
      intent = this.refineIntentClassification(message, intent, result);
      
      // Create scores object
      const scores = {};
      result.labels.forEach((label, index) => {
        const mappedIntent = this.labelToIntent[label];
        if (mappedIntent) {
          // If multiple labels map to same intent, take the highest score
          scores[mappedIntent] = Math.max(scores[mappedIntent] || 0, Math.round(result.scores[index] * 100));
        }
      });
      
      // Ensure all intents have scores
      ['simple', 'greeting', 'help', 'image', 'document', 'complex', 'document_complex','historical_facts'].forEach(i => {
        if (!scores[i]) scores[i] = 0;
      });
      
      console.log('🧠 ML Classification:', {
        message: message.substring(0, 30) + '...',
        intent,
        confidence: Math.round(primaryScore * 100),
        primaryLabel: primaryLabel.substring(0, 40) + '...',
        topScores: Object.entries(scores)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([intent, score]) => `${intent}:${score}%`)
      });
      
      return this.createResult(intent, Math.round(primaryScore * 100), scores);
    } catch (error) {
      console.error('ML classification error:', error);
      return this.createResult('simple', 50, { simple: 50 });
    }
  }

  // Refine classification based on context and scores
  refineIntentClassification(message, primaryIntent, result) {
    const messageLength = message.length;
    const wordCount = message.split(/\s+/).length;
    
    // For very short mathematical expressions, ensure they're classified as simple
    if (wordCount <= 6 && /\d.*[\+\-\*\/].*\d/.test(message)) {
      // Check if simple is in top 2 classifications
      const simpleRank = result.labels.findIndex(label => this.labelToIntent[label] === 'simple');
      if (simpleRank <= 1) { // If simple is in top 2, prefer it for math
        return 'simple';
      }
    }
    
    // For very short messages that are likely greetings
    if (wordCount <= 3 && /^(hi|hello|hey)/i.test(message)) {
      const greetingRank = result.labels.findIndex(label => this.labelToIntent[label] === 'greeting');
      if (greetingRank <= 1) {
        return 'greeting';
      }
    }
    
    // For image requests, be more confident
    if (/(generate|create|make|draw|design).*(image|picture|photo|illustration)/i.test(message)) {
      return 'image';
    }
    
    // For history requests, distinguish between simple and complex
    if (/history.*briefly|brief.*history/i.test(message)) {
      return 'document'; // Brief history is simpler
    }
    
    if (/detailed.*history|comprehensive.*history|history.*analysis/i.test(message)) {
      return 'complex'; // Detailed history is complex
    }
    
    return primaryIntent;
  }

  createResult(intent, confidence, scores) {
    return {
      intent,
      confidence,
      mlScore: confidence / 100,
      scores,
      isComplex: ['complex', 'document_complex', 'image','historical_facts'].includes(intent),
      requiresCloud: ['complex', 'document_complex', 'image','historical_facts'].includes(intent)
    };
  }

  getStatus() {
    return {
      isReady: this.isReady,
      isLoading: this.isLoading
    };
  }
  
  getModelInfo() {
    return {
      name: 'DistilBERT MNLI (Pure ML)',
      size: '~250MB',
      accuracy: 'High',
      labels: this.intentLabels.length,
      approach: 'Zero-shot classification only'
    };
  }
}