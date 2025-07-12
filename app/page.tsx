"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Volume2, Loader2, Award, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface CostCalculation {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCostUSD: number;
  totalCostBDT: number;
}

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [hasSpokenContent, setHasSpokenContent] = useState(false);
  const [costs, setCosts] = useState<CostCalculation>({
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    totalCostUSD: 0,
    totalCostBDT: 0,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const finalTranscriptRef = useRef<string>("");

  // OpenAI GPT-4o pricing (per 1K tokens)
  const PROMPT_TOKEN_COST = 0.005; // $0.005 per 1K tokens
  const COMPLETION_TOKEN_COST = 0.015; // $0.015 per 1K tokens
  const USD_TO_BDT_RATE = 110; // Approximate exchange rate

  const calculateCost = (usage: TokenUsage) => {
    const promptCost = (usage.promptTokens / 1000) * PROMPT_TOKEN_COST;
    const completionCost =
      (usage.completionTokens / 1000) * COMPLETION_TOKEN_COST;
    const totalCostUSD = promptCost + completionCost;
    const totalCostBDT = totalCostUSD * USD_TO_BDT_RATE;

    setCosts((prev) => ({
      totalPromptTokens: prev.totalPromptTokens + usage.promptTokens,
      totalCompletionTokens:
        prev.totalCompletionTokens + usage.completionTokens,
      totalTokens: prev.totalTokens + usage.totalTokens,
      totalCostUSD: prev.totalCostUSD + totalCostUSD,
      totalCostBDT: prev.totalCostBDT + totalCostBDT,
    }));
  };

  const resetCosts = () => {
    setCosts({
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      totalCostUSD: 0,
      totalCostBDT: 0,
    });
  };

  useEffect(() => {
    // Access browser's SpeechRecognition API
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      recognitionRef.current = new SpeechRecognitionCtor();

      if (recognitionRef.current) {
        const recognition = recognitionRef.current;

        // Enhanced settings for natural speech detection
        recognition.continuous = true; // Keep listening for natural speech flow
        recognition.interimResults = true; // Show interim results
        recognition.lang = "en-US";
        // TypeScript doesn't know about maxAlternatives, so we'll use type assertion
        (recognition as any).maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setError("");
          finalTranscriptRef.current = "";
          setHasSpokenContent(false);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Update display with interim results
          setTranscript(
            finalTranscriptRef.current + finalTranscript + interimTranscript
          );

          // If we have final results, add to our final transcript
          if (finalTranscript) {
            finalTranscriptRef.current += finalTranscript;
            setHasSpokenContent(true);

            // Clear any existing silence timer
            if (silenceTimer) {
              clearTimeout(silenceTimer);
            }

            // Set a timer to process speech after 3 seconds of silence (more realistic)
            const newTimer = setTimeout(() => {
              if (finalTranscriptRef.current.trim() && hasSpokenContent) {
                handleUserInput(finalTranscriptRef.current.trim());
                finalTranscriptRef.current = "";
                setHasSpokenContent(false);
              }
            }, 3000); // Wait 3 seconds after final speech for natural pauses

            setSilenceTimer(newTimer);
          }

          // If we have interim results, it means the user is still speaking
          if (interimTranscript && silenceTimer) {
            clearTimeout(silenceTimer);
            setSilenceTimer(null);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.log("Speech recognition error:", event.error);

          // Don't stop on network errors or no-speech errors, just continue
          if (event.error === "network" || event.error === "no-speech") {
            return;
          }

          // For other errors, show message but try to restart
          if (event.error !== "aborted") {
            setError(`Speech recognition error: ${event.error}`);
            // Try to restart after a brief delay
            setTimeout(() => {
              if (isListening) {
                startListening();
              }
            }, 1000);
          }
        };

        recognition.onend = () => {
          // If we're supposed to be listening, restart recognition
          if (isListening && !isProcessing) {
            setTimeout(() => {
              if (recognitionRef.current && isListening) {
                try {
                  recognitionRef.current.start();
                } catch (error) {
                  console.log("Error restarting recognition:", error);
                }
              }
            }, 100);
          }
        };
      }
    } else {
      setError("Sorry, your browser doesn't support Speech Recognition.");
    }

    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, [isListening, isProcessing, silenceTimer, hasSpokenContent]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      setError("");
      finalTranscriptRef.current = "";
      setHasSpokenContent(false);

      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log("Error starting recognition:", error);
        setError("Could not start speech recognition. Please try again.");
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }

    // Process any remaining transcript
    if (finalTranscriptRef.current.trim()) {
      handleUserInput(finalTranscriptRef.current.trim());
      finalTranscriptRef.current = "";
    }
    setHasSpokenContent(false);
  };

  const handleUserInput = async (input: string) => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsProcessing(true);
    setTranscript("");

    try {
      console.log("Sending message to API:", input);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          conversationHistory: updatedMessages.slice(0, -1),
          requestType: "normal",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from assistant");
      }

      const data = await response.json();
      console.log("Received response from API:", data.response);

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Calculate and update costs
      if (data.usage) {
        calculateCost(data.usage);
      }

      // Ensure voice plays after a small delay to let the UI update
      setTimeout(() => {
        console.log("Attempting to speak response:", data.response);
        speakText(data.response);
      }, 100);
    } catch (error) {
      setError("Failed to process your request. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const requestIELTSScore = async () => {
    if (messages.length === 0) {
      setError(
        "Please have a conversation first before requesting an IELTS score."
      );
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "",
          conversationHistory: messages,
          requestType: "ielts_score",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get IELTS score");
      }

      const data = await response.json();

      const scoreMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, scoreMessage]);

      // Calculate and update costs
      if (data.usage) {
        calculateCost(data.usage);
      }

      // Ensure voice plays after a small delay
      setTimeout(() => {
        console.log("Attempting to speak IELTS score:", data.response);
        speakText(data.response);
      }, 100);
    } catch (error) {
      setError("Failed to get IELTS score. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    console.log("speakText called with:", text);

    if (!text || !text.trim()) {
      console.log("No text to speak");
      return;
    }

    if (!synthRef.current) {
      console.log("Speech synthesis not available");
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    console.log("Creating speech utterance...");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85; // Slightly slower for learning
    utterance.pitch = 1;
    utterance.volume = 1;

    // Wait for voices to load if they haven't loaded yet
    const setVoiceAndSpeak = () => {
      if (!synthRef.current) return;

      const availableVoices = synthRef.current.getVoices();
      console.log("Available voices:", availableVoices.length);

      if (availableVoices.length === 0) {
        console.log("No voices available, speaking with default voice");
      } else {
        // Find a good English voice
        const preferredVoice = availableVoices.find(
          (voice) =>
            voice.name.includes("Samantha") ||
            voice.name.includes("Alex") ||
            voice.name.includes("Karen") ||
            voice.name.includes("Daniel") ||
            voice.name.includes("Fiona") ||
            (voice.lang.includes("en-US") &&
              voice.name.toLowerCase().includes("female")) ||
            (voice.lang.includes("en-GB") &&
              voice.name.toLowerCase().includes("female")) ||
            voice.lang.includes("en-US") ||
            voice.lang.includes("en-GB") ||
            voice.lang.startsWith("en")
        );

        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log("Using preferred voice:", preferredVoice.name);
        } else if (availableVoices.length > 0) {
          // Fallback to first available voice
          utterance.voice = availableVoices[0];
          console.log("Using fallback voice:", availableVoices[0].name);
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log("Started speaking:", text.substring(0, 50) + "...");
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        console.log("Finished speaking");
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        console.error("Speech error:", event);
      };

      try {
        console.log("Calling speechSynthesis.speak()");
        if (synthRef.current) {
          synthRef.current.speak(utterance);
          console.log("Speech synthesis started successfully");
        }
      } catch (error) {
        console.error("Error speaking:", error);
        setIsSpeaking(false);
      }
    };

    // Check if voices are already loaded
    const initialVoices = synthRef.current.getVoices();
    if (initialVoices.length > 0) {
      console.log("Voices already loaded, speaking immediately");
      setVoiceAndSpeak();
    } else {
      console.log("Waiting for voices to load...");
      // Wait for voices to load
      const handleVoicesChanged = () => {
        console.log("Voices loaded, now speaking");
        setVoiceAndSpeak();
        if (synthRef.current) {
          synthRef.current.removeEventListener(
            "voiceschanged",
            handleVoicesChanged
          );
        }
      };

      synthRef.current.addEventListener("voiceschanged", handleVoicesChanged);

      // Fallback: try again after a short delay
      setTimeout(() => {
        if (synthRef.current) {
          const fallbackVoices = synthRef.current.getVoices();
          if (fallbackVoices.length > 0) {
            console.log("Voices loaded after timeout, speaking now");
            setVoiceAndSpeak();
          } else {
            console.log("Still no voices after timeout, trying anyway");
            setVoiceAndSpeak();
          }
        }
      }, 1000);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Ishan's IELTS Speaking Tutor
          </h1>
          <p className="text-slate-600">
            Your AI-powered English conversation partner
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {messages.length > 0 && (
              <>
                <Button
                  onClick={() => {
                    setMessages([]);
                    resetCosts();
                  }}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Chat
                </Button>
                {/* <Button
                  onClick={requestIELTSScore}
                  variant="default"
                  size="sm"
                  disabled={isProcessing}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Get IELTS Score
                </Button> */}
              </>
            )}
          </div>
        </div>

        {/* Cost Display Section */}
        {costs.totalTokens > 0 && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">
                💰 Conversation Cost
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-slate-600 mb-1">Total Tokens</p>
                  <p className="text-xl font-bold text-blue-600">
                    {costs.totalTokens.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-slate-600 mb-1">Input Tokens</p>
                  <p className="text-lg font-semibold text-green-600">
                    {costs.totalPromptTokens.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-slate-600 mb-1">Output Tokens</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {costs.totalCompletionTokens.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-slate-600 mb-1">Total Cost</p>
                  <p className="text-xl font-bold text-red-600">
                    ৳{costs.totalCostBDT.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">
                    ${costs.totalCostUSD.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <p>
                  Rate: Input ৳
                  {(PROMPT_TOKEN_COST * USD_TO_BDT_RATE).toFixed(3)}/1K tokens •
                  Output ৳{(COMPLETION_TOKEN_COST * USD_TO_BDT_RATE).toFixed(3)}
                  /1K tokens
                </p>
                <p>Exchange Rate: $1 = ৳{USD_TO_BDT_RATE}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Main Interface */}
        <Card className="p-8 mb-6 bg-white/90 backdrop-blur-sm shadow-xl">
          <div className="text-center">
            {/* Voice Control Button */}
            <div className="mb-6">
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                size="lg"
                className={cn(
                  "w-28 h-28 rounded-full transition-all duration-300 shadow-lg text-white font-semibold",
                  isListening
                    ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-red-200"
                    : "bg-green-500 hover:bg-green-600 shadow-green-200",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin mb-1" />
                    <span className="text-xs">Processing</span>
                  </div>
                ) : isListening ? (
                  <div className="flex flex-col items-center">
                    <MicOff className="w-8 h-8 mb-1" />
                    <span className="text-xs">Stop</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Mic className="w-8 h-8 mb-1" />
                    <span className="text-xs">Start</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Status */}
            <div className="mb-4">
              {isListening && (
                <div className="text-center">
                  <p className="text-green-600 font-medium animate-pulse text-lg">
                    🎤 Listening...
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Take your time, I'll wait for natural pauses in your speech
                  </p>
                </div>
              )}
              {isProcessing && (
                <p className="text-orange-600 font-medium">
                  🤔 Processing your speech...
                </p>
              )}
              {isSpeaking && (
                <div className="flex items-center justify-center gap-2">
                  <Volume2 className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-600 font-medium">🗣️ Speaking...</p>
                  <Button
                    onClick={stopSpeaking}
                    variant="outline"
                    size="sm"
                    className="ml-2 bg-transparent"
                  >
                    Stop
                  </Button>
                </div>
              )}
              {!isListening && !isProcessing && !isSpeaking && (
                <div className="text-center">
                  <p className="text-slate-600 text-lg">
                    Ready to practice English conversation!
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Click the microphone and speak naturally - I'll detect when
                    you're done
                  </p>
                </div>
              )}
            </div>

            {/* Live Transcript */}
            {transcript && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 italic text-left">"{transcript}"</p>
                {isListening && (
                  <p className="text-xs text-blue-600 mt-2">
                    Continue speaking naturally... I'll process after you pause
                  </p>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Conversation History */}
        {messages.length > 0 && (
          <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-xl">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Conversation History
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3 p-4 rounded-lg",
                    message.role === "user"
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-green-50 border border-green-200"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={cn(
                          "font-medium text-sm px-2 py-1 rounded",
                          message.role === "user"
                            ? "text-blue-700 bg-blue-100"
                            : "text-green-700 bg-green-100"
                        )}
                      >
                        {message.role === "user" ? "🎓 You" : "👨‍🏫 Tutor"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                  {message.role === "assistant" && (
                    <Button
                      onClick={() => speakText(message.content)}
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      disabled={isSpeaking}
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-slate-600 bg-white/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">
            How to use your IELTS Speaking Tutor:
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div>
              <p>
                • <strong>Natural Speech:</strong> Take your time, hesitate
                naturally - it's part of learning
              </p>
              <p>
                • <strong>Smart Pauses:</strong> I allow for natural pauses and
                process after you finish
              </p>
            </div>
            <div>
              <p>
                • <strong>IELTS Scoring:</strong> Click "Get IELTS Score" for
                detailed feedback
              </p>
              <p>
                • <strong>Practice Topics:</strong> Ask me about IELTS topics or
                general conversation
              </p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-500">
              💡 I wait 3 seconds after you stop speaking to process your
              response - perfect for natural conversation flow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
