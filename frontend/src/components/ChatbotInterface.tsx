import { useState, useRef, useEffect } from 'react';
import { Send, Image, Zap, Crown, Star, Menu, Smile, Paperclip, FileText, HelpCircle, MessageSquare, Bot, Cpu, Brain, Smartphone, Monitor } from 'lucide-react';
//@ts-ignore 
import { router } from '../services/IntelligentRouter';
//@ts-ignore
import { localModel } from '../services/LocalModelService';
import LoadingScreen from './LoadingScreen';
import type { Message, Model } from '../types';

const ChatbotInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! How can I help you today? I can answer questions, generate images, help with documents, or provide assistance.', model: 'Best' }
  ]);
  const [input, setInput] = useState('');
  const [currentModel, setCurrentModel] = useState('Best');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [autoRouting, setAutoRouting] = useState(true);
  const [mlStatus, setMlStatus] = useState({ isReady: false, isLoading: true });
  const [localModelStatus, setLocalModelStatus] = useState(localModel.getStatus());
  const [localModelProgress, setLocalModelProgress] = useState(0);
  const [isFullyReady, setIsFullyReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const models: Model[] = [
    { id: 'best', name: 'Best', icon: <Star className="h-5 w-5" />, description: 'General purpose AI (Cloud)' },
    { id: 'localModel', name: 'Local Model', icon: <Smartphone className="h-5 w-5" />, description: 'On-device AI' },
    { id: 'gemini2', name: 'Gemini 2', icon: <Crown className="h-5 w-5" />, description: 'Document analysis (Cloud)' },
    { id: 'gemini2flash', name: 'Gemini 2 Flash', icon: <Zap className="h-5 w-5" />, description: 'Fast responses (Cloud)' },
    { id: 'pro', name: 'Pro', icon: <Crown className="h-5 w-5 text-yellow-500" />, description: 'Advanced tasks (Cloud)' },
    { id: 'imageGenerator', name: 'Image Generator', icon: <Image className="h-5 w-5" />, description: 'Create images (Cloud)' },
  ];

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'document': 
      case 'document_complex': return <FileText className="h-4 w-4" />;
      case 'help': return <HelpCircle className="h-4 w-4" />;
      case 'greeting': return <Smile className="h-4 w-4" />;
      case 'complex': return <Crown className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'high-end': return <Monitor className="h-4 w-4" />;
      case 'mid-range': return <Monitor className="h-4 w-4" />;
      case 'low-end': return <Smartphone className="h-4 w-4" />;
      default: return <Cpu className="h-4 w-4" />;
    }
  };

  // Initialize models and check status
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    
    const checkStatus = async () => {
      // Check router status (includes both ML and local model)
      const routerStatus = router.getStatus();
      setMlStatus(routerStatus.classifier);
      setLocalModelStatus(routerStatus.localModel);
      
      // Check if fully ready
      const ready = router.isFullyReady();
      if (ready && !isFullyReady) {
        setIsFullyReady(true);
        // Clear interval once ready
        if (statusInterval) {
          clearInterval(statusInterval);
        }
      }
    };
    
    // Initial check
    checkStatus();
    
    // Set up polling while loading
    if (!isFullyReady) {
      statusInterval = setInterval(checkStatus, 500);
    }
    
    // Initialize local model with progress callback
    const initLocalModel = async () => {
      try {
        await localModel.initialize((progress) => {
          setLocalModelProgress(progress.progress || 0);
        });
      } catch (error) {
        console.error('Failed to initialize local model:', error);
      }
    };
    
    if (!localModelStatus.isReady && !localModelStatus.isLoading) {
      initLocalModel();
    }
    
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [isFullyReady, localModelStatus.isReady, localModelStatus.isLoading]);

  const handleSendMessage = async (imageUrl = null) => {
    if (input.trim() === '' && !imageUrl) return;

    const userMessage = input.trim();
    let selectedModel = currentModel;
    let intent = 'simple';
    let isLocal = false;

    // Add user message immediately
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      image: imageUrl,
      timestamp: new Date().toISOString()
    }]);
    setInput('');
    setIsResponding(true);

    try {
      // Use intelligent routing if enabled
      if (autoRouting) {
        const routingResult = await router.route(userMessage, 'user-123', imageUrl);
        selectedModel = routingResult.model;
        intent = routingResult.intent;
        isLocal = routingResult.isLocal;
        
        // Update current model for future messages if auto-routing
        setCurrentModel(selectedModel);
        
        // Log metrics periodically
        const metrics = router.getMetrics();
        if (metrics.totalRequests % 5 === 0) {
          console.log('📊 Router metrics:', {
            ...metrics,
            localUsage: `${metrics.localModelPercentage}%`,
            avgClassification: metrics.avgClassificationTime
          });
        }
      }

      let responseContent = '';
      let responseMetadata = {};

      // Handle local model generation
      if (selectedModel === 'Local Model' && localModelStatus.isReady) {
        try {
          const localResponse = await localModel.generate(userMessage, {
            image: imageUrl,
            maxTokens: 256
          });
          responseContent = localResponse.text;
          responseMetadata = {
            ...localResponse.metrics,
            deviceType: localResponse.deviceType,
            modelName: localResponse.model,
          };
        } catch (error) {
          console.error('Local model error:', error);
          // Fallback to cloud
          selectedModel = 'Best';
          isLocal = false;
          responseContent = await generateCloudResponse(intent, userMessage);
        }
      } else {
        // Use cloud model
        responseContent = await generateCloudResponse(intent, userMessage);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseContent,
        model: selectedModel,
        intent: intent,
        isLocal: isLocal,
        metadata: responseMetadata,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        model: 'Best',
        intent: 'simple',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsResponding(false);
    }
  };

  // Generate cloud response (simulated)
  const generateCloudResponse = async (intent: string, userMessage: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    switch (intent) {
      case 'image':
        return `I'll generate an image for you: "${userMessage}". The image is being processed and will appear below...`;
      case 'document':
        return `I found information about "${userMessage}". Here's what you need to know...`;
      case 'document_complex':
        return `I'll analyze this complex request about "${userMessage}". Here's a comprehensive analysis...`;
      case 'help':
        return `I'd be happy to help you! Here's a guide on ${userMessage}:\n\n1. First step...\n2. Second step...\n3. Third step...`;
      case 'greeting':
        return `Hello! Great to meet you. How can I assist you today?`;
      case 'complex':
        return `This is a complex request about "${userMessage}". Let me provide a detailed response...`;
      default:
        return `I understand you're asking about "${userMessage}". Let me provide you with some information...`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Find the current model object
  const currentModelObj = models.find(model => model.name === currentModel) || models[0];

  // Show loading screen until both models are ready
  if (!isFullyReady) {
    return (
      <LoadingScreen 
        mlStatus={mlStatus}
        localModelStatus={localModelStatus}
        localProgress={localModelProgress}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white py-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Menu className="h-6 w-6 text-gray-500 mr-3" />
            <h1 className="text-xl font-semibold text-gray-800">Intelligent AI Chatbot</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* System status */}
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex items-center space-x-1 text-green-600">
                <Brain className="h-4 w-4" />
                <span>ML Active</span>
              </div>
              {localModelStatus.isReady && (
                <div className="flex items-center space-x-1 text-green-600">
                  {getDeviceIcon(localModelStatus.deviceType)}
                  <span>{localModelStatus.model}</span>
                </div>
              )}
            </div>

            {/* Auto-routing toggle */}
            <div className="flex items-center space-x-2">
              <Bot className={`h-5 w-5 ${autoRouting ? 'text-indigo-600' : 'text-gray-400'}`} />
              <label className="text-sm text-gray-700">Auto-routing</label>
              <button
                onClick={() => setAutoRouting(!autoRouting)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoRouting ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoRouting ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex items-center space-x-1 rounded-full bg-white border border-gray-300 py-1 px-3 text-sm hover:bg-gray-50"
                disabled={autoRouting}
              >
                <span className="flex items-center">
                  {currentModelObj.icon}
                  <span className="ml-1">{currentModel}</span>
                </span>
              </button>

              {isModelMenuOpen && !autoRouting && (
                <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b border-gray-100">
                      Select Model
                    </div>
                    {models.map((model) => (
                      <button
                        key={model.id}
                        className={`flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${
                          currentModel === model.name ? 'bg-gray-50 text-indigo-600' : 'text-gray-700'
                        } ${model.name === 'Local Model' && !localModelStatus.isReady ? 'opacity-50' : ''}`}
                        onClick={() => {
                          if (model.name === 'Local Model' && !localModelStatus.isReady) {
                            alert('Local model is still loading...');
                            return;
                          }
                          setCurrentModel(model.name);
                          setIsModelMenuOpen(false);
                        }}
                        disabled={model.name === 'Local Model' && !localModelStatus.isReady}
                      >
                        <span className="mr-2">{model.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500">
                            {model.description}
                            {model.name === 'Local Model' && localModelStatus.model && (
                              <span className="ml-1">({localModelStatus.model})</span>
                            )}
                          </div>
                        </div>
                        {currentModel === model.name && (
                          <svg className="ml-2 h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                } ${message.role === 'assistant' ? 'shadow-sm' : ''}`}
              >
                {message.role === 'assistant' && message.model && (
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <div className="flex items-center">
                      {models.find(m => m.name === message.model)?.icon}
                      <span className="ml-1">{message.model}</span>
                      {message.isLocal && (
                        <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          On-device
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {message.intent && (
                        <div className="flex items-center text-gray-400">
                          {getIntentIcon(message.intent)}
                          <span className="ml-1">{message.intent}</span>
                        </div>
                      )}
                      {message.metadata?.responseTime && (
                        <span className="text-gray-400">{message.metadata.responseTime}</span>
                      )}
                    </div>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          {isResponding && (
            <div className="flex justify-start">
              <div className="max-w-lg rounded-lg px-4 py-3 bg-white border border-gray-200 text-gray-800 shadow-sm">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  {currentModelObj.icon}
                  <span className="ml-1">{currentModel}</span>
                  {currentModel === 'Local Model' && (
                    <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      Processing locally...
                    </span>
                  )}
                </div>
                <div className="flex space-x-1">
                  <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="block w-full resize-none border-0 bg-transparent p-3 focus:outline-none focus:ring-0 sm:text-sm"
                placeholder={autoRouting ? "Message AI (ML-powered routing enabled)..." : `Message ${currentModel}...`}
                style={{ minHeight: '44px', maxHeight: '200px' }}
              />
            </div>
            <div className="flex px-3 py-2 space-x-2">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
              >
                <Smile className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isResponding}
                className={`rounded-full p-1 ${
                  input.trim() && !isResponding
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            {autoRouting ? 
              `AI automatically selects the best model using ML intent classification` :
              `Chatting with ${currentModel} model`}
            {localModelStatus.isReady && (
              <span className="ml-2">• Local Model ready ({localModelStatus.model} on {localModelStatus.deviceType})</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInterface;