import { useState, useRef, useEffect } from 'react';
import { Send, Image, Zap, Crown, Star, Menu, Smile, Paperclip, FileText, HelpCircle, MessageSquare, Bot, Cpu, Brain } from 'lucide-react';
//@ts-ignore 
import { router } from '../services/IntelligentRouter';
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
  const [useMLClassifier, setUseMLClassifier] = useState(false);
  const [mlLoading, setMlLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const models: Model[] = [
    { id: 'best', name: 'Best', icon: <Star className="h-5 w-5" />, description: 'General purpose AI' },
    { id: 'gemini2', name: 'Gemini 2', icon: <Crown className="h-5 w-5" />, description: 'Document analysis' },
    { id: 'gemini2flash', name: 'Gemini 2 Flash', icon: <Zap className="h-5 w-5" />, description: 'Fast responses' },
    { id: 'pro', name: 'Pro', icon: <Crown className="h-5 w-5 text-yellow-500" />, description: 'Advanced tasks' },
    { id: 'imageGenerator', name: 'Image Generator', icon: <Image className="h-5 w-5" />, description: 'Create images' },
  ];

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'help': return <HelpCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Handle classifier type change
  const handleClassifierChange = async (useML: boolean) => {
    if (useML && !router.isReady()) {
      setMlLoading(true);
      try {
        await router.switchClassifierType(true);
        setUseMLClassifier(true);
      } catch (error) {
        console.error('Failed to load ML model:', error);
        alert('Failed to load ML model. Using pattern-based classifier instead.');
      } finally {
        setMlLoading(false);
      }
    } else {
      await router.switchClassifierType(useML);
      setUseMLClassifier(useML);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = input.trim();
    let selectedModel = currentModel;
    let intent = 'simple';

    // Add user message immediately
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage, 
      timestamp: new Date().toISOString()
    }]);
    setInput('');
    setIsResponding(true);

    try {
      // Use intelligent routing if enabled
      if (autoRouting) {
        const routingResult = await router.route(userMessage, 'user-123');
        selectedModel = routingResult.model;
        intent = routingResult.intent;
        
        // Update current model for future messages if auto-routing
        setCurrentModel(selectedModel);
        
        // Log metrics periodically
        const metrics = router.getMetrics();
        if (metrics.totalRequests % 10 === 0) {
          console.log('📊 Router metrics:', metrics);
        }
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate appropriate response based on intent
      let responseContent = '';
      switch (intent) {
        case 'image':
          responseContent = `I'll generate an image for you: "${userMessage}". The image is being processed and will appear below...`;
          break;
        case 'document':
          responseContent = `Based on your question, I found relevant information in our documentation. Here's what I found about "${userMessage}"...`;
          break;
        case 'help':
          responseContent = `I'd be happy to help you! Here's a guide on ${userMessage}:\n\n1. First step...\n2. Second step...\n3. Third step...`;
          break;
        default:
          responseContent = `I understand you're asking about "${userMessage}". Let me provide you with some information...`;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseContent,
        model: selectedModel,
        intent: intent,
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
            {/* Classifier type selector */}
            <div className="flex items-center space-x-2 border-r pr-4">
              {/* <button
                onClick={() => handleClassifierChange(false)}
                disabled={mlLoading}
                className={`flex items-center space-x-1 px-2 py-1 rounded ${
                  !useMLClassifier ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Cpu className="h-4 w-4" />
                <span className="text-sm">Pattern</span>
              </button> */}
              <button
                onClick={() => handleClassifierChange(true)}
                disabled={mlLoading}
                className={`flex items-center space-x-1 px-2 py-1 rounded ${
                  useMLClassifier ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Brain className="h-4 w-4" />
                <span className="text-sm">ML</span>
              </button>
              {mlLoading && (
                <span className="text-xs text-gray-500 ml-2">Loading model...</span>
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
                        }`}
                        onClick={() => {
                          setCurrentModel(model.name);
                          setIsModelMenuOpen(false);
                        }}
                      >
                        <span className="mr-2">{model.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500">{model.description}</div>
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
                    </div>
                    {message.intent && (
                      <div className="flex items-center text-gray-400">
                        {getIntentIcon(message.intent)}
                        <span className="ml-1">{message.intent}</span>
                      </div>
                    )}
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
                placeholder={autoRouting ? "Message AI (auto-routing enabled)..." : `Message ${currentModel}...`}
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
                onClick={handleSendMessage}
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
              `AI automatically selects the best model (using ${useMLClassifier ? 'ML' : 'pattern'} classifier)` :
              `Chatting with ${currentModel} model`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInterface;