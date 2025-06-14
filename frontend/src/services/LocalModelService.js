import { pipeline, env } from '@xenova/transformers';

export class LocalModelService {
  constructor() {
    this.pipeline = null;
    this.isLoading = false;
    this.isReady = false;

    // Detect device capabilities
    this.deviceType = this.detectDeviceType();
    this.modelConfig = this.getModelConfig();

    // Configure environment for better model loading
    env.allowLocalModels = false; // Use CDN models for reliability
    env.useBrowserCache = true;
  }

  // Classify device into tiers
  detectDeviceType() {
    const mem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    
    // Check for WebGPU support (more modern than just 'gpu' in navigator)
    const hasWebGPU = 'gpu' in navigator;
    
    if (!hasWebGPU && cores < 4) return 'cpu-only';
    if (mem >= 16 && cores >= 8) return 'high-end';
    if (mem >= 8 && cores >= 4) return 'mid-range';
    return 'high-end';
  }

  // Select working model config based on device tier
  getModelConfig() {
    const configs = {
      'high-end': {
        model: 'Xenova/gpt2',              // Reliable, well-tested model
        contextLength: 1024,
        maxTokens: 256,
        temperature: 0.7
      },
      'mid-range': {
        model: 'Xenova/distilgpt2',        // Smaller, faster version of GPT-2
        contextLength: 1024,
        maxTokens: 128,
        temperature: 0.7
      },
      'low-end': {
        model: 'Xenova/distilgpt2',        // Same as mid-range but with lower limits
        contextLength: 512,
        maxTokens: 64,
        temperature: 0.8
      },
      'cpu-only': {
        model: 'Xenova/distilgpt2',        // Even on CPU-only, try with very low limits
        contextLength: 256,
        maxTokens: 32,
        temperature: 0.8
      }
    };
    return configs[this.deviceType] || configs['low-end'];
  }

  // Initialize the selected model pipeline
  async initialize(progressCallback = null) {
    if (this.isLoading || this.isReady) return;
    if (!this.modelConfig) {
      console.warn('No local model available for this device.');
      return;
    }

    this.isLoading = true;
    console.log(`🔄 Loading local model: ${this.modelConfig.model} for ${this.deviceType} device...`);

    try {
      // Create progress wrapper to handle the callback format
      const wrappedCallback = progressCallback ? (progress) => {
        if (typeof progress === 'object' && progress.progress !== undefined) {
          progressCallback(progress);
        } else if (typeof progress === 'number') {
          progressCallback({ progress: Math.round(progress * 100) });
        }
      } : null;

      this.pipeline = await pipeline(
        'text-generation',
        this.modelConfig.model,
        { 
          progress_callback: wrappedCallback,
          // Additional options for better loading
          revision: 'main',
          cache_dir: './.cache'
        }
      );
      
      this.isReady = true;
      console.log(`✅ Local model loaded successfully: ${this.modelConfig.model} (${this.deviceType})`);
      
      // Test the model with a simple generation
      await this.testModel();
    } catch (error) {
      console.error('Failed to load local model:', error);
      
      // Try fallback to an even simpler model
      if (this.modelConfig.model !== 'Xenova/distilgpt2') {
        console.log('🔄 Trying fallback model...');
        this.modelConfig = {
          model: 'Xenova/distilgpt2',
          contextLength: 256,
          maxTokens: 32,
          temperature: 0.8
        };
        
        try {
          this.pipeline = await pipeline('text-generation', 'Xenova/distilgpt2');
          this.isReady = true;
          console.log('✅ Fallback model loaded successfully');
        } catch (fallbackError) {
          console.error('Fallback model also failed:', fallbackError);
        }
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Test the model to ensure it's working
  async testModel() {
    try {
      const testResult = await this.pipeline('Hello', {
        max_new_tokens: 5,
        temperature: 0.7,
        do_sample: true,
        pad_token_id: 50256 // GPT-2 pad token
      });
      console.log('✅ Model test successful');
    } catch (error) {
      console.warn('Model test failed, but model may still work:', error);
    }
  }

  // Check if local inference should handle this request
  isSuitable(message) {
    if (!this.isReady || !this.modelConfig) return false;
    
    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const tokenEstimate = message.length / 4;
    
    // Leave room for the response
    const maxInputTokens = this.modelConfig.contextLength - this.modelConfig.maxTokens;
    
    // Only handle messages that fit comfortably in context
    return tokenEstimate <= maxInputTokens * 0.7; // Use 70% of available space
  }

  // Generate text locally with better prompting
  async generate(prompt, options = {}) {
    if (!this.isReady) {
      throw new Error('Local model not initialized');
    }

    const startTime = performance.now();
    
    try {
      // Create a better response based on the type of question
      let response = await this.generateSmartResponse(prompt, options);
      
      const responseTime = performance.now() - startTime;

      return {
        text: response,
        metrics: {
          responseTime: `${responseTime.toFixed(0)}ms`,
          tokens: response.length / 4,
          model: this.modelConfig.model
        },
        deviceType: this.deviceType,
        model: this.modelConfig.model.split('/')[1] || this.modelConfig.model
      };
    } catch (error) {
      console.error('Generation error:', error);
      throw new Error(`Local generation failed: ${error.message}`);
    }
  }

  // Generate contextually appropriate responses
  async generateSmartResponse(prompt, options = {}) {
    // Handle different types of questions with appropriate responses
    
    // Math questions
    if (this.isMathQuestion(prompt)) {
      return this.handleMathQuestion(prompt);
    }
    
    // Greetings
    if (this.isGreeting(prompt)) {
      return this.handleGreeting(prompt);
    }
    
    // Simple factual questions
    if (this.isSimpleQuestion(prompt)) {
      return this.generateWithModel(prompt);
    }
    
    // For other questions, try to use the model but with better prompting
    return await this.generateWithModel(prompt, options);
  }

  isMathQuestion(prompt) {
    return /[\d\s\+\-\*\/\(\)\.]+\s*[\+\-\*\/]\s*[\d\s\+\-\*\/\(\)\.]+/i.test(prompt) ||
           /what'?s\s+\d+.*[\+\-\*\/].*\d+/i.test(prompt);
  }

  isGreeting(prompt) {
    return /^(hi|hello|hey|good\s*(morning|afternoon|evening)|greetings)/i.test(prompt);
  }

  isSimpleQuestion(prompt) {
    return prompt.length < 100 && prompt.includes('?');
  }

  handleMathQuestion(prompt) {
    try {
      // Extract the math expression
      const mathMatch = prompt.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
      if (mathMatch) {
        const [, num1, operator, num2] = mathMatch;
        const a = parseFloat(num1);
        const b = parseFloat(num2);
        let result;
        
        switch (operator) {
          case '+': result = a + b; break;
          case '-': result = a - b; break;
          case '*': result = a * b; break;
          case '/': result = b !== 0 ? a / b : 'undefined (division by zero)'; break;
          default: result = 'unable to calculate';
        }
        
        return `${a} ${operator} ${b} = ${result}`;
      }
    } catch (error) {
      console.error('Math calculation error:', error);
    }
    
    return "I can help with basic math! Could you please write the calculation in a format like '2 + 2' or 'what's 5 * 3'?";
  }

  handleGreeting(prompt) {
    const greetings = [
      "Hello! How can I help you today?",
      "Hi there! What would you like to know?", 
      "Hey! I'm here to assist you.",
      "Hello! I'm ready to help with your questions.",
      "Hi! What can I do for you?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  handleSimpleQuestion(prompt) {
    // For simple questions, provide helpful responses
    if (/how are you/i.test(prompt)) {
      return "I'm doing well, thank you! I'm here to help answer your questions.";
    }
    
    if (/what.*time/i.test(prompt)) {
      return `The current time is ${new Date().toLocaleTimeString()}.`;
    }
    
    if (/what.*date/i.test(prompt)) {
      return `Today is ${new Date().toLocaleDateString()}.`;
    }
    
    // For other simple questions, give a helpful response
    return "That's an interesting question! I'd be happy to help, though I may have limited information as a local model. What specifically would you like to know?";
  }

  async generateWithModel(prompt, options = {}) {
    try {
      const { maxTokens, temperature } = this.modelConfig;
      
      // Create a better prompt format for the model
      const formattedPrompt = `Question: ${prompt}\nAnswer: `;
      
      // Ensure prompt isn't too long
      const maxPromptLength = (this.modelConfig.contextLength - maxTokens) * 3; // Rough char estimate
      const truncatedPrompt = formattedPrompt.length > maxPromptLength 
        ? formattedPrompt.substring(0, maxPromptLength) 
        : formattedPrompt;

      const result = await this.pipeline(truncatedPrompt, {
        max_new_tokens: Math.min(options.maxTokens || maxTokens, 100), // Reasonable length
        temperature: options.temperature || 0.7,
        top_p: 0.9,
        do_sample: true,
        pad_token_id: 50256,
        eos_token_id: 50256,
        repetition_penalty: 1.2,
        no_repeat_ngram_size: 2
      });

      // Extract and clean the response
      let generatedText;
      if (Array.isArray(result)) {
        generatedText = result[0].generated_text.replace(truncatedPrompt, '').trim();
      } else {
        generatedText = result.generated_text.replace(truncatedPrompt, '').trim();
      }

      // Basic cleanup only
      generatedText = this.cleanGeneratedText(generatedText);
      
      // Return the generated text or a minimal fallback
      return generatedText || "I'm not sure about that specific question.";
      
    } catch (error) {
      console.error('Model generation error:', error);
      return "I'm having trouble generating a response right now.";
    }
  }

  // Clean up generated text
  cleanGeneratedText(text) {
    if (!text) return "";
    
    // Remove common artifacts
    text = text
      .replace(/^\s*[\.\,\;\:\!]\s*/g, '') // Remove leading punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // If text is too short or just punctuation, return fallback
    if (text.length < 3 || /^[\.\,\;\:\!\?\s]+$/.test(text)) {
      return "I understand your question. Let me help you with that.";
    }
    
    return text;
  }

  // Get status for UI
  getStatus() {
    return {
      deviceType: this.deviceType,
      model: this.modelConfig?.model?.split('/')[1] || this.modelConfig?.model || null,
      isReady: this.isReady,
      isLoading: this.isLoading,
      contextLength: this.modelConfig?.contextLength || 0,
      maxTokens: this.modelConfig?.maxTokens || 0
    };
  }

  // Clean up resources
  dispose() {
    this.isReady = false;
    this.isLoading = false;
    this.pipeline = null;
    console.log('🧹 Local model disposed');
  }
}

export const localModel = new LocalModelService();