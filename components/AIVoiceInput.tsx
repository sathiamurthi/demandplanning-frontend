"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, Send } from "lucide-react";

interface AIVoiceInputProps {
  context: "items" | "sales";
  onProcessed: (data: any[]) => void;
  placeholder?: string;
}

export default function AIVoiceInput({ context, onProcessed, placeholder }: AIVoiceInputProps) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        // We can set lang to 'en-IN' or 'ta-IN' but generally English captures tanglish alright, 
        // or we can leave it to default. Let's use 'en-IN' which is good at Indian accents and Tanglish.
        recognitionRef.current.lang = 'en-IN';

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setText(prev => prev + " " + currentTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setText(""); // optionally clear on new listen
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleProcess = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/ai-parse-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context })
      });
      const json = await res.json();
      if (json.success && json.data) {
        onProcessed(json.data);
        setText("");
      } else {
        alert("Failed to parse items: " + json.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Sparkles className="w-4 h-4 text-purple-500" />
          AI Voice Assistant (English / Tanglish)
        </div>
        <button
          type="button"
          onClick={toggleListen}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            isListening
              ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
              : "bg-blue-100 text-blue-600 hover:bg-blue-200"
          }`}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          {isListening ? "Stop Listening" : "Tap to Speak"}
        </button>
      </div>
      
      <div className="p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder || "Dictate or type your items here line by line..."}
          className="w-full h-24 p-2 text-sm text-gray-700 bg-transparent border-0 resize-none focus:ring-0 placeholder-gray-400"
        />
      </div>

      <div className="p-2 border-t border-gray-100 bg-gray-50 flex justify-end">
        <button
          type="button"
          onClick={handleProcess}
          disabled={!text.trim() || isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            "Processing AI..."
          ) : (
            <>
              Parse & Add Items <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
