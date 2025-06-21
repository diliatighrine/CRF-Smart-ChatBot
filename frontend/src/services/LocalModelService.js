import { pipeline, env } from '@xenova/transformers';

export class LocalModelService {
  constructor() {
    this.pipeline = null;
    this.isLoading = false;
    this.isReady = false;

    // Detect device capabilities
    this.deviceType = this.detectDeviceType();
    
    // Configure environment for better model loading
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    
    // Try models in order of preference
    this.modelConfigs = [
      {
        // Try Qwen first - it's a good chat model available in Xenova
        model: 'Xenova/Qwen1.5-0.5B-Chat',
        contextLength: 1024,
        maxTokens: 256,
        task: 'text-generation',
        chatTemplate: 'qwen'
      },
      {
        // Phi-2 is another good small model
        model: 'Xenova/phi-2',
        contextLength: 2048,
        maxTokens: 128,
        task: 'text-generation',
        chatTemplate: 'phi'
      },
      {
        // TinyLlama variants to try
        model: 'Xenova/TinyLlama-1.1B-Chat-v0.6',
        contextLength: 2048,
        maxTokens: 128,
        task: 'text-generation',
        chatTemplate: 'tinyllama'
      }
    ];
    
    this.activeConfig = null;
  }

  // Classify device into tiers
  detectDeviceType() {
    const mem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    
    if (mem >= 8 && cores >= 4) return 'high-end';
    if (mem >= 4 && cores >= 2) return 'mid-range';
    return 'high-end';
  }

  // Initialize the model
  async initialize(progressCallback = null) {
    if (this.isLoading || this.isReady) return;

    this.isLoading = true;
    console.log(`🔄 Initializing local model service...`);

    const wrappedCallback = progressCallback ? (progress) => {
      if (typeof progress === 'object' && progress.progress !== undefined) {
        progressCallback(progress);
      } else if (typeof progress === 'number') {
        progressCallback({ progress: Math.round(progress * 100) });
      }
    } : null;

    // Try each model configuration
    for (const config of this.modelConfigs) {
      try {
        console.log(`🔍 Trying to load: ${config.model}`);
        
        this.pipeline = await pipeline(
          config.task,
          config.model,
          { 
            progress_callback: wrappedCallback,
            revision: 'main'
          }
        );
        
        this.activeConfig = config;
        this.isReady = true;
        console.log(`✅ Model loaded successfully: ${config.model}`);
        
        // Test the model
        const testSuccess = await this.testModel();
        if (testSuccess) {
          break; // Model works, stop trying others
        } else {
          console.warn(`⚠️ Model ${config.model} loaded but test failed, trying next...`);
          this.isReady = false;
          this.pipeline = null;
          this.activeConfig = null;
        }
        
      } catch (error) {
        console.log(`❌ Failed to load ${config.model}:`, error.message);
        continue; // Try next model
      }
    }
    
    if (!this.isReady) {
      console.error('❌ No suitable local model could be loaded.');
    }
    
    this.isLoading = false;
  }

  // Test the model to ensure it's working
  async testModel() {
    try {
      const testPrompt = this.formatPrompt("Hello");
      
      const result = await this.pipeline(testPrompt, {
        max_new_tokens: 10,
        temperature: 0.7,
        do_sample: true,
        // Use appropriate tokens for the model
        pad_token_id: this.getPadToken(),
        eos_token_id: this.getEosToken()
      });
      
      // Check if we got a valid response
      const hasResult = result && (
        (Array.isArray(result) && result.length > 0 && result[0].generated_text) ||
        (result.generated_text)
      );
      
      if (hasResult) {
        console.log('✅ Model test successful');
        return true;
      } else {
        console.warn('⚠️ Model test produced no output');
        return false;
      }
    } catch (error) {
      console.warn('Model test failed:', error);
      return false;
    }
  }

  // Get appropriate pad token for the model
  getPadToken() {
    if (!this.activeConfig) return 50256; // GPT-2 default
    
    const tokenMap = {
      'qwen': 151643,
      'phi': 50256,
      'tinyllama': 2,
      'none': 50256 // GPT-2
    };
    
    return tokenMap[this.activeConfig.chatTemplate] || 50256;
  }

  // Get appropriate EOS token for the model
  getEosToken() {
    if (!this.activeConfig) return 50256; // GPT-2 default
    
    const tokenMap = {
      'qwen': 151643,
      'phi': 50256,
      'tinyllama': 2,
      'none': 50256 // GPT-2
    };
    
    return tokenMap[this.activeConfig.chatTemplate] || 50256;
  }

  // Format prompt based on model's chat template
  formatPrompt(message) {
    if (!this.activeConfig) return message;
    
    switch (this.activeConfig.chatTemplate) {
      case 'qwen':
        return `<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
${message}<|im_end|>
<|im_start|>assistant
`;
      
      case 'phi':
        return `Instruct: ${message}\nOutput:`;
      
      case 'tinyllama':
        return `<|system|>
You are a helpful AI assistant.</s>
<|user|>
${message}</s>
<|assistant|>
`;
      
      case 'none':
      default:
        // For GPT-2, try to guide it toward Q&A
        if (message.includes('?')) {
          return `Q: ${message}\nA:`;
        }
        return message;
    }
  }

  // Check if local inference should handle this request
  isSuitable(message) {
    if (!this.isReady || !this.activeConfig) return false;
    
    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const tokenEstimate = message.length / 4;
    
    // Be conservative with context length
    const maxInputTokens = (this.activeConfig.contextLength - this.activeConfig.maxTokens) * 0.5;
    
    return tokenEstimate <= maxInputTokens;
  }

  // Generate text locally
  async generate(prompt, options = {}) {
    if (!this.isReady) {
      throw new Error('Local model not initialized');
    }

    const startTime = performance.now();
    
    try {
      // Validate input length
      if (!this.isSuitable(prompt)) {
        throw new Error('Input too long for local model');
      }
      
      // Format the prompt based on model type
      const formattedPrompt = this.formatPrompt(prompt);
      
      console.log('🤖 Generating with:', this.activeConfig.model);
      
      // Generate with conservative settings to avoid errors
      const result = await this.pipeline(formattedPrompt, {
        max_new_tokens: Math.min(
          options.maxTokens || this.activeConfig.maxTokens,
          this.activeConfig.maxTokens
        ),
        temperature: options.temperature || 0.7,
        top_p: 0.9,
        do_sample: true,
        pad_token_id: this.getPadToken(),
        eos_token_id: this.getEosToken(),
        repetition_penalty: 1.1,
        // Ensure we don't exceed context
        truncation: true,
        max_length: this.activeConfig.contextLength,
        return_full_text: false,
      });
      console.log(result)
      // Extract the response
      let generated = '';
      if (Array.isArray(result) && result.length > 0) {
        generated = result[0].generated_text || '';
              console.log(generated)

      } else if (result && result.generated_text) {
        generated = result.generated_text;
                      console.log(generated)

      }
      
      // Clean the response based on model type
      // generated = this.cleanGeneratedText(generated, formattedPrompt);
      
      // Validate we got something meaningful
      if (!generated) {
        generated = "I couldn't generate a proper response. The local model has limitations.";
      }
      
      const responseTime = performance.now() - startTime;

      return {
        text: generated,
        metrics: {
          responseTime: `${responseTime.toFixed(0)}ms`,
          tokens: generated.length / 4,
          model: this.activeConfig.model
        },
        deviceType: this.deviceType,
        model: this.activeConfig.model.split('/')[1] || this.activeConfig.model
      };
      
    } catch (error) {
      console.error('Generation error:', error);
      
      // Provide helpful error message
      if (error.message.includes('offset is out of bounds')) {
        throw new Error('Model memory error. Try a shorter input or use cloud models.');
      }
      
      throw new Error(`Local generation failed: ${error.message}`);
    }
  }

  // Clean up generated text based on model type
  cleanGeneratedText(text, originalPrompt) {
    if (!text || !this.activeConfig) return "";
    
    // Remove the original prompt if present
    if (text.startsWith(originalPrompt)) {
      text = text.substring(originalPrompt.length);
    }
    
    // Clean based on chat template
    switch (this.activeConfig.chatTemplate) {
      case 'qwen':
        // Remove any remaining chat markers
        text = text.replace(/<\|im_start\|>/g, '')
                   .replace(/<\|im_end\|>/g, '')
                   .split('<|im_start|>')[0]; // Stop at next turn
        break;
        
      case 'phi':
        // Remove instruction markers
        text = text.replace(/Instruct:/g, '')
                   .replace(/Output:/g, '');
        break;
        
      case 'tinyllama':
        // Remove chat tokens
        text = text.replace(/<\|[^|]+\|>/g, '')
                   .replace(/<\/s>/g, '');
        break;
        
      case 'none':
        // For GPT-2, clean Q&A format
        text = text.replace(/^A:\s*/i, '')
                   .replace(/^Q:\s*/i, '');
        break;
    }
    
    // General cleanup
    text = text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .split('\n')[0]; // Take first line for cleaner response
    
    // Limit length
    if (text.length > 200) {
      const sentenceEnd = text.search(/[.!?]\s/);
      if (sentenceEnd > 50 && sentenceEnd < 180) {
        text = text.substring(0, sentenceEnd + 1);
      } else {
        text = text.substring(0, 150) + '...';
      }
    }
    
    return text;
  }

  // Get status for UI
  getStatus() {
    const modelName = this.activeConfig ? 
      (this.activeConfig.model.split('/')[1] || this.activeConfig.model) : 
      null;
      
    return {
      deviceType: this.deviceType,
      model: modelName,
      isReady: this.isReady,
      isLoading: this.isLoading,
      contextLength: this.activeConfig?.contextLength || 0,
      maxTokens: this.activeConfig?.maxTokens || 0
    };
  }

  // Clean up resources
  dispose() {
    this.isReady = false;
    this.isLoading = false;
    this.pipeline = null;
    this.activeConfig = null;
    console.log('🧹 Local model disposed');
  }
}

export const localModel = new LocalModelService();
