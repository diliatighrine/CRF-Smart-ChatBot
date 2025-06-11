export class IntentClassifier {
  constructor() {
    // Intent patterns with keywords and regex patterns
    this.intentPatterns = {
      image: {
        keywords: ['image', 'picture', 'photo', 'generate', 'create', 'draw', 'illustration', 'artwork', 'design', 'visual', 'graphic'],
        patterns: [
          /(?:generate|create|draw|make|design|produce|render)\s+(?:an?\s+)?(?:image|picture|photo|illustration|graphic|visual)/i,
          /(?:image|picture|photo|illustration)\s+(?:of|showing|depicting|with)\s+/i,
          /(?:can you|could you|please|I want|I need)\s+(?:generate|create|draw|make)/i,
          /(?:show me|create me|make me)\s+(?:a|an)\s+/i
        ],
        priority: 2
      },
      document: {
        keywords: ['history', 'mission', 'presentation', 'origin', 'creation', 'founder', 'goal', 'objective', 'purpose', 'about', 'information', 'details', 'crf', 'croix', 'rouge', 'organization'],
        patterns: [
          /(?:what is|tell me about|explain|describe)\s+(?:the\s+)?(?:history|mission|origin|purpose|goal)/i,
          /(?:who\s+(?:is|was|are|were)\s+the\s+(?:founder|founders|creator))/i,
          /(?:when\s+was\s+.*\s+(?:created|founded|established|started))/i,
          /(?:information|details|facts)\s+(?:about|on|regarding)/i,
          /(?:what|how)\s+(?:does|is)\s+(?:the\s+)?(?:CRF|Croix.Rouge|organization)/i
        ],
        priority: 1
      },
      help: {
        keywords: ['how', 'works', 'working', 'function', 'functioning', 'use', 'usage', 'manual', 'faq', 'help', 'support', 'explanation', 'guide', 'tutorial', 'instructions', 'steps'],
        patterns: [
          /how\s+(?:does|do|can|should|to)\s+/i,
          /(?:can you|could you)\s+(?:help|explain|guide|show|teach)/i,
          /(?:what\s+can\s+(?:you|I|this)\s+do)/i,
          /(?:user\s+)?(?:guide|manual|tutorial|instructions)/i,
          /(?:how|what)\s+(?:to|should)\s+(?:use|work|operate)/i,
          /(?:need|want)\s+(?:help|assistance|support)/i
        ],
        priority: 1
      },
      simple: {
        keywords: [],
        patterns: [],
        priority: 0
      }
    };
  }

  // Calculate similarity score between message and intent
  calculateScore(message, intentConfig) {
    let score = 0;
    const lowerMessage = message.toLowerCase();
    
    // Check keywords (weight: 2 points each)
    intentConfig.keywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        score += 2;
      }
    });
    
    // Check regex patterns (weight: 3 points each)
    intentConfig.patterns.forEach(pattern => {
      if (pattern.test(message)) {
        score += 3;
      }
    });
    
    return score;
  }

  // Classify the intent of a message
  classify(message) {
    const scores = {};
    let bestIntent = 'simple';
    let bestScore = 0;
    
    // Calculate scores for each intent
    Object.entries(this.intentPatterns).forEach(([intent, config]) => {
      const score = this.calculateScore(message, config);
      scores[intent] = score;
      
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    });
    
    // Apply priority rules for edge cases
    if (scores.help > 0 && scores.document > 0) {
      // If both help and document match, prioritize based on specific keywords
      const helpKeywords = ['how', 'works', 'use', 'faq', 'guide', 'tutorial'];
      const hasHelpKeyword = helpKeywords.some(kw => message.toLowerCase().includes(kw));
      bestIntent = hasHelpKeyword ? 'help' : 'document';
    }
    
    // Calculate confidence percentage
    const maxPossibleScore = Math.max(...Object.values(this.intentPatterns).map(config => 
      config.keywords.length * 2 + config.patterns.length * 3
    ));
    const confidence = Math.min(100, Math.round((bestScore / maxPossibleScore) * 100));
    
    return {
      intent: bestIntent,
      confidence: confidence,
      rawScore: bestScore,
      scores
    };
  }
}