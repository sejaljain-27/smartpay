import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, ChevronRight, Zap, Search, Shield, Info, Mic, Volume2, Square } from "lucide-react";
import { sendChatMessage } from "../services/api";
import ReactMarkdown from 'react-markdown';
import { useVoice } from "../hooks/useVoice";

const QuickAction = ({ icon: Icon, label, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center space-x-3 border rounded-2xl px-5 py-3 text-sm transition-all whitespace-nowrap 
            ${disabled
                ? "bg-white/5 border-white/5 text-white/30 cursor-not-allowed"
                : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-emerald-500/30 text-white/90 shadow-lg shadow-black/20 hover:scale-105 active:scale-95"
            }`}
    >
        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Icon className={`w-3.5 h-3.5 ${disabled ? "text-white/30" : "text-emerald-400"}`} />
        </div>
        <span className="font-medium">{label}</span>
    </button>
);

export default function ChatPage() {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: "bot",
            text: "Welcome. I am your **Financial Analyst**.\n\nI can analyze your spending patterns, identify recurring charges, or project your savings goals. \n\nHow can I assist you today?"
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Voice Hook
    const {
        isListening,
        isSpeaking,
        transcript,
        startListening,
        stopListening,
        speak,
        cancelSpeech,
        setTranscript
    } = useVoice();

    // Sync Voice Transcript to Input
    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        const userMsg = { id: Date.now(), sender: "user", text };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setTranscript(""); // Clear voice transcript
        setLoading(true);

        try {
            const res = await sendChatMessage(text);
            const replyText = res.data.reply;
            const botMsg = { id: Date.now() + 1, sender: "bot", text: replyText };
            setMessages(prev => [...prev, botMsg]);

            // Optional: Auto-speak response if voice was used? 
            // For now, let's keep it manual or auto if user prefers.
            // Let's settle on: Manual Play button is safest.
        } catch (err) {
            const errorMsg = { id: Date.now() + 1, sender: "bot", text: "I am unable to retrieve that information at the moment. Please try again." };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: "Spending Breakdown", icon: Search, query: "Where is my spending going?" },
        { label: "Goal Projection", icon: Info, query: "How am I doing on my goals?" },
        { label: "Identify Recurring Charges", icon: Shield, query: "Find hidden money leaks" },
        { label: "Credit Health Analysis", icon: Zap, query: "What is a credit score and how to improve it?" },
    ];

    return (
        <div className="relative z-10 min-h-screen py-24 px-4 md:px-8 max-w-6xl mx-auto flex flex-col">
            {/* Header */}
            <div className="text-center mb-10 w-full animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="inline-flex items-center space-x-2 text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                    <Zap className="w-4 h-4" />
                    <span>Live Analyst</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4" style={{ fontFamily: "serif" }}>
                    Financial Insights
                </h1>
                <p className="text-white/40 max-w-lg mx-auto text-lg">
                    Real-time analysis of your transaction history powered by financial intelligence models.
                </p>
            </div>

            {/* Chat Container */}
            <div className="flex-1 bg-zinc-900/80 border border-white/10 rounded-[2.5rem] backdrop-blur-2xl overflow-hidden flex flex-col relative">

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-start space-x-5 ${msg.sender === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${msg.sender === "user"
                                    ? "bg-white text-black border-white shadow-lg"
                                    : "bg-white/5 text-white/60 border-white/5"
                                    }`}
                            >
                                {msg.sender === "user" ? <User className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                            </div>

                            <div className="group relative max-w-[85%] md:max-w-[70%]">
                                <div
                                    className={`p-6 rounded-[1.5rem] text-sm md:text-[15px] leading-7 ${msg.sender === "user"
                                        ? "bg-white text-black font-medium shadow-md"
                                        : "bg-white/5 text-slate-300 border border-white/5"
                                        }`}
                                >
                                    {msg.sender === "user" ? (
                                        msg.text
                                    ) : (
                                        <div className="prose prose-invert prose-p:leading-relaxed prose-a:text-emerald-400 prose-strong:text-white max-w-none">
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>

                                {/* Read Aloud Button (Only for Bot) */}
                                {msg.sender === 'bot' && (
                                    <button
                                        onClick={() => isSpeaking ? cancelSpeech() : speak(msg.text.replace(/[*#]/g, ''))} // Simple markdown strip
                                        className="absolute -right-8 top-2 p-1.5 rounded-full text-white/20 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                                        title="Read Aloud"
                                    >
                                        {isSpeaking ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-start space-x-5 animate-pulse">
                            <div className="w-10 h-10 rounded-xl bg-white/5 text-white/40 border border-white/5 flex items-center justify-center shrink-0">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/5 flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 md:p-8 bg-black/20 border-t border-white/5 backdrop-blur-3xl">
                    {/* Quick Actions */}
                    <div className="flex space-x-3 overflow-x-auto pb-6 scrollbar-hide mask-fade-right">
                        {quickActions.map((action, i) => (
                            <QuickAction
                                key={i}
                                icon={action.icon}
                                label={action.label}
                                onClick={() => handleSend(action.query)}
                                disabled={loading}
                            />
                        ))}
                    </div>

                    <div className={`relative flex items-center bg-white/5 border rounded-[2rem] transition-all group focus-within:bg-white/10 focus-within:border-white/20 hover:border-white/10 ${isListening ? 'border-red-500/50 bg-red-500/5' : 'border-white/5'}`}>

                        {/* Voice Input Button */}
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`ml-3 p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                            title="Voice Input"
                        >
                            {isListening ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
                            placeholder={isListening ? "Listening..." : "Type your query..."}
                            className="flex-1 bg-transparent border-none text-white placeholder:text-white/20 px-4 py-5 focus:ring-0 text-base font-medium"
                            disabled={loading}
                            autoFocus
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className="p-3 mr-3 bg-white text-black rounded-2xl hover:bg-zinc-200 disabled:opacity-0 disabled:pointer-events-none transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="text-center mt-4 flex items-center justify-center space-x-2 opacity-20">
                        <Shield className="w-3 h-3" />
                        <span className="text-[10px] uppercase tracking-widest font-semibold">Financial Intelligence • Secure & Private</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
