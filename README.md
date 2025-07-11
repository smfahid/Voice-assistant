# 🎙️ Ishan's IELTS Speaking Tutor

A modern, AI-powered voice assistant designed specifically for IELTS speaking practice. This application provides real-time conversation practice with intelligent feedback and cost tracking for your learning sessions.

![Voice Assistant Screenshot](https://via.placeholder.com/800x400?text=Voice+Assistant+Interface)

## ✨ Features

### 🗣️ Voice Interaction

- **Continuous Speech Recognition**: Natural conversation flow with pause detection
- **Real-time Transcription**: Live display of your speech as you talk
- **Text-to-Speech Responses**: AI responses are automatically spoken back
- **Smart Silence Detection**: Automatically processes speech after 2 seconds of silence
- **Cross-browser Support**: Works with Chrome, Edge, Safari, and other modern browsers

### 🤖 AI-Powered Tutoring

- **OpenAI GPT-4o Integration**: Advanced conversational AI for natural interactions
- **IELTS-Specific Training**: Designed specifically for IELTS speaking test preparation
- **Contextual Conversations**: AI maintains context throughout your session
- **Professional Feedback**: Constructive guidance on language learning

### 💰 Cost Tracking

- **Real-time Cost Calculation**: Track your AI usage costs in real-time
- **Bangladeshi Taka (৳) Display**: Costs shown in local currency
- **Token Usage Breakdown**: Detailed view of input/output tokens
- **Exchange Rate Integration**: USD to BDT conversion (₹110 = $1)

### 🎨 Modern UI/UX

- **Responsive Design**: Works seamlessly on desktop and mobile
- **Beautiful Animations**: Smooth transitions and visual feedback
- **Accessibility**: Screen reader friendly and keyboard navigation
- **Dark/Light Mode**: Comfortable viewing in any lighting condition

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Modern web browser with Web Speech API support
- OpenAI API key
- HTTPS connection (required for microphone access)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd voice-assistant
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-your-openai-api-key

# Optional (with defaults)
NEXT_PUBLIC_USD_TO_BDT_RATE=110
```

### Cost Calculation Settings

The application uses the following pricing for GPT-4o:

- **Input tokens**: $0.005 per 1K tokens
- **Output tokens**: $0.015 per 1K tokens
- **Exchange rate**: $1 = ৳110 (configurable)

## 📱 Usage

### Starting a Conversation

1. **Grant Microphone Permission**: Allow browser access to your microphone
2. **Click the Green Microphone Button**: Start speaking when you see "🎤 Listening"
3. **Speak Naturally**: Take pauses, use filler words - it's part of learning!
4. **Automatic Processing**: The AI responds after you finish speaking

### Voice Controls

- **🎤 Green Button**: Start listening
- **🔴 Red Button**: Stop listening and process speech
- **🔊 Volume Icon**: Manually replay any AI response
- **⏹️ Stop Button**: Stop current AI speech

### Cost Management

- **View Real-time Costs**: See your spending in the green cost card
- **Clear Chat**: Reset both conversation and cost tracking
- **Token Breakdown**: Monitor input vs output token usage

## 🛠️ Technical Stack

### Frontend

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component library
- **Lucide Icons**: Beautiful icon system

### Backend

- **Next.js API Routes**: Serverless API endpoints
- **OpenAI SDK**: AI model integration
- **Vercel AI SDK**: Streamlined AI interactions

### Browser APIs

- **Web Speech API**: Speech recognition and synthesis
- **SpeechRecognition**: Voice input processing
- **SpeechSynthesis**: Text-to-speech output

## 📁 Project Structure

```
voice-assistant/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # OpenAI API integration
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # App layout
│   └── page.tsx                 # Main voice assistant component
├── components/
│   └── ui/                      # Reusable UI components
├── hooks/                       # Custom React hooks
├── lib/
│   └── utils.ts                 # Utility functions
├── public/                      # Static assets
├── styles/                      # Additional styles
├── types/                       # TypeScript type definitions
├── .env.local                   # Environment variables (create this)
├── .gitignore                   # Git ignore rules
├── LICENSE                      # MIT License
├── README.md                    # This file
├── components.json              # Component configuration
├── next.config.mjs             # Next.js configuration
├── package.json                # Dependencies and scripts
├── postcss.config.mjs          # PostCSS configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## 🎯 IELTS Speaking Features

### Assessment Criteria

The AI tutor evaluates based on official IELTS criteria:

1. **Fluency and Coherence** (0-9): Speech flow and logical sequencing
2. **Lexical Resource** (0-9): Vocabulary range and accuracy
3. **Grammatical Range and Accuracy** (0-9): Sentence structures and grammar
4. **Pronunciation** (0-9): Based on word choices and patterns

### Practice Areas

- **Part 1**: Personal questions and familiar topics
- **Part 2**: Individual long turn (2-minute speech)
- **Part 3**: Discussion and abstract topics
- **General Conversation**: Free-form English practice

## 🔒 Security & Privacy

- **Local Processing**: Speech recognition happens in your browser
- **Secure API Calls**: All communications are encrypted
- **No Audio Storage**: Voice data is not stored or transmitted
- **Privacy First**: Only text transcripts are sent to OpenAI

## 🌐 Browser Support

| Browser | Speech Recognition | Speech Synthesis | Status          |
| ------- | ------------------ | ---------------- | --------------- |
| Chrome  | ✅                 | ✅               | Fully Supported |
| Edge    | ✅                 | ✅               | Fully Supported |
| Safari  | ✅                 | ✅               | Fully Supported |
| Firefox | ❌                 | ✅               | Limited Support |

## 📊 Performance

- **Response Time**: < 2 seconds for most queries
- **Token Efficiency**: Optimized prompts for cost-effectiveness
- **Memory Usage**: Lightweight client-side processing
- **Bandwidth**: Minimal data transfer (text only)

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Maintain accessibility standards
- Add proper error handling
- Include relevant tests

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 🐛 Troubleshooting

### Common Issues

**Microphone not working**

- Ensure HTTPS connection
- Check browser permissions
- Try refreshing the page

**No voice response**

- Check speaker volume
- Verify browser audio support
- Look for console errors

**API errors**

- Verify OpenAI API key
- Check internet connection
- Monitor API rate limits

**Cost calculation errors**

- Confirm environment variables
- Check exchange rate settings
- Verify API response format

### Debug Mode

Enable debug logging by opening browser console (F12) to see detailed operation logs.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for the GPT-4o model
- **Vercel** for the AI SDK
- **Radix UI** for accessible components
- **Tailwind CSS** for the styling system
- **Web Speech API** for browser voice capabilities

## 📞 Support

For support, email your-email@example.com or create an issue in the GitHub repository.

## 🔮 Roadmap

- [ ] Multiple language support
- [ ] Advanced IELTS scoring algorithms
- [ ] Voice analysis and pronunciation feedback
- [ ] Progress tracking and analytics
- [ ] Mobile app development
- [ ] Offline mode support

---

**Made with ❤️ for IELTS learners worldwide**
