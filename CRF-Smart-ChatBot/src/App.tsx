import { useState, useRef, useEffect } from 'react';
import { Send, Image, Zap, Crown, Star, Menu, Smile, Paperclip } from 'lucide-react';

const ChatbotInterface = () => {
    interface Message {
        role: string;
        content: string;
        model?: string;
    }

    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! How can I help you today?', model: 'Best' }
    ]);
    const [input, setInput] = useState('');
    const [currentModel, setCurrentModel] = useState('Best');
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [isResponding, setIsResponding] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const models = [
        { id: 'best', name: 'Best', icon: <Star className="h-5 w-5" /> },
        { id: 'gemini2', name: 'Gemini 2', icon: <Crown className="h-5 w-5" /> },
        { id: 'gemini2flash', name: 'Gemini 2 Flash', icon: <Zap className="h-5 w-5" /> },
        { id: 'pro', name: 'Pro', icon: <Crown className="h-5 w-5 text-yellow-500" /> },
        { id: 'imageGenerator', name: 'Image Generator', icon: <Image className="h-5 w-5" /> },
    ];

    const handleSendMessage = () => {
        if (input.trim() === '') return;

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: input, model: undefined }]);
        setInput('');

        // Simulate response
        setIsResponding(true);
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `This is a response from the ${currentModel} model.`,
                model: currentModel
            }]);
            setIsResponding(false);
        }, 1500);
    };

    const handleKeyDown = (e:any) => {
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
                        <h1 className="text-xl font-semibold text-gray-800">AI Chatbot</h1>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                            className="flex items-center space-x-1 rounded-full bg-white border border-gray-300 py-1 px-3 text-sm hover:bg-gray-50"
                        >
              <span className="flex items-center">
                {currentModelObj.icon}
                  <span className="ml-1">{currentModel}</span>
              </span>
                        </button>

                        {isModelMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
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
                                            {model.name}
                                            {currentModel === model.name && (
                                                <svg className="ml-auto h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
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
                                    <div className="flex items-center text-xs text-gray-500 mb-1">
                                        {models.find(m => m.name === message.model)?.icon}
                                        <span className="ml-1">{message.model}</span>
                                    </div>
                                )}
                                <div>{message.content}</div>
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
                  placeholder={`Message ${currentModel}...`}
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
                                disabled={!input.trim()}
                                className={`rounded-full p-1 ${
                                    input.trim()
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 text-center">
                        {currentModel === 'Image Generator' ?
                            'Image Generator can create images based on text descriptions' :
                            `Chatting with ${currentModel} model`}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatbotInterface;