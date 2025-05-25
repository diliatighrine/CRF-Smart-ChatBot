# Intelligent Chatbot Router

## Project Structure

```
src/
├── components/
│   └── ChatbotInterface.tsx      # Main React component
├── services/
│   ├── IntentClassifier.js       # Pattern-based classifier
│   ├── MLIntentClassifier.js     # ML-based classifier (Transformers.js)
│   └── IntelligentRouter.js      # Router that uses either classifier
└── types.ts                      # TypeScript type definitions
```

## Why Two Classifier Approaches?

### 1. Pattern-Based Classifier (Default)
- **Pros:**
  - ✅ Instant loading (no model download)
  - ✅ Lightweight (~5KB)
  - ✅ Fast classification (<1ms)
  - ✅ Works offline
  - ✅ Easy to customize and debug
- **Cons:**
  - ❌ Less accurate for complex queries
  - ❌ Requires manual pattern updates
  - ❌ Limited to predefined keywords

### 2. ML-Based Classifier (Optional)
- **Pros:**
  - ✅ More accurate intent detection
  - ✅ Handles complex/ambiguous queries
  - ✅ Zero-shot classification (no training needed)
  - ✅ Better generalization
- **Cons:**
  - ❌ Large model download (~100MB)
  - ❌ Slower initial load
  - ❌ Requires more resources
  - ❌ May not work on all devices

## Installation

### Basic Setup (Pattern-based only)
```bash
npm install lucide-react
```

### Full Setup (Including ML support)
```bash
npm install lucide-react @xenova/transformers
```

## Usage

### Import the components:
```typescript
import ChatbotInterface from './components/ChatbotInterface';
```

### Use in your app:
```tsx
function App() {
  return <ChatbotInterface />;
}
```

## Customization

### Adding New Intents

1. **Pattern-based (IntentClassifier.js):**
```javascript
this.intentPatterns = {
  newIntent: {
    keywords: ['keyword1', 'keyword2'],
    patterns: [/pattern1/i, /pattern2/i],
    priority: 1
  }
}
```

2. **ML-based (MLIntentClassifier.js):**
```javascript
this.intentLabels = [
  'existing intents...',
  'new intent description'
];

this.labelToIntent = {
  'new intent description': 'newIntent'
};
```

### Adding New Models

Update the model mapping in `IntelligentRouter.js`:
```javascript
this.modelMapping = {
  'image': 'Image Generator',
  'document': 'Gemini 2',
  'help': 'Best',
  'simple': 'Best',
  'newIntent': 'New Model'
};
```

## Performance Considerations

### Pattern-based Classifier
- **Memory:** ~50KB
- **CPU:** Minimal
- **Latency:** <1ms per classification

### ML-based Classifier
- **Memory:** ~200MB (including model)
- **CPU:** Moderate (during classification)
- **Latency:** 50-200ms per classification
- **Initial Load:** 5-30 seconds (model download)

## Best Practices

1. **Start with Pattern-based**: Use the lightweight pattern classifier for most use cases
2. **Add ML for Complex Apps**: Enable ML classification only when needed
3. **Cache ML Models**: Models are cached after first download
4. **Monitor Performance**: Use the built-in metrics to track routing performance
5. **Test on Target Devices**: ML models may not work on low-end devices

## Browser Support

- Pattern-based: All modern browsers
- ML-based: Chrome 91+, Firefox 89+, Safari 15+, Edge 91+

## Future Enhancements

- [ ] Custom model fine-tuning
- [ ] Multi-language support
- [ ] Confidence threshold configuration
- [ ] A/B testing framework
- [ ] Analytics dashboard
- [ ] Model performance monitoring