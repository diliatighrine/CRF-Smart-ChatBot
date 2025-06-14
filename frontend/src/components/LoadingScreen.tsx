import { useEffect, useState } from 'react';
import { Brain, Cpu, CheckCircle, Loader } from 'lucide-react';

interface LoadingScreenProps {
  mlStatus: { isReady: boolean; isLoading: boolean };
  localModelStatus: { isReady: boolean; isLoading: boolean; model: string | null };
  mlProgress?: number;
  localProgress?: number;
}

const LoadingScreen = ({ mlStatus, localModelStatus, mlProgress = 0, localProgress = 0 }: LoadingScreenProps) => {
  const [dots, setDots] = useState('');
  
  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const mlReady = mlStatus.isReady;
  const localReady = localModelStatus.isReady;
  const allReady = mlReady && localReady;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Intelligent AI Chatbot
          </h1>
          <p className="text-gray-600">
            {allReady ? 'Ready to chat!' : `Initializing AI models${dots}`}
          </p>
        </div>

        <div className="space-y-6">
          {/* ML Classifier Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Brain className={`h-6 w-6 ${mlReady ? 'text-green-500' : 'text-indigo-500'}`} />
                <div>
                  <h3 className="font-semibold text-gray-800">Intent Classifier</h3>
                  <p className="text-sm text-gray-600">Zero-shot ML model</p>
                </div>
              </div>
              {mlReady ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Loader className="h-5 w-5 text-indigo-500 animate-spin" />
              )}
            </div>
            {!mlReady && (
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${mlProgress || 30}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Loading BART Large MNLI (~400MB)</p>
              </div>
            )}
          </div>

          {/* Local Model Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Cpu className={`h-6 w-6 ${localReady ? 'text-green-500' : 'text-purple-500'}`} />
                <div>
                  <h3 className="font-semibold text-gray-800">Local Model</h3>
                  <p className="text-sm text-gray-600">
                    {localModelStatus.model || 'On-device AI'}
                  </p>
                </div>
              </div>
              {localReady ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Loader className="h-5 w-5 text-purple-500 animate-spin" />
              )}
            </div>
            {!localReady && (
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${localProgress || 20}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Downloading model for offline use
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Features preview */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            What you can do:
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <span className="text-gray-600">Ask questions</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <span className="text-gray-600">Generate images</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <span className="text-gray-600">Analyze documents</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <span className="text-gray-600">Get help</span>
            </div>
          </div>
        </div>

        {/* Status message */}
        <div className="mt-6 text-center">
          {allReady ? (
            <div className="animate-pulse">
              <p className="text-green-600 font-semibold">All systems ready!</p>
              <p className="text-sm text-gray-500 mt-1">Starting chat interface...</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              First time setup - models will be cached for instant access next time
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;