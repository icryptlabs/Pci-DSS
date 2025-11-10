import React, { useState, useRef, useEffect, useCallback } from 'react';
// Fix: Removed unexported 'LiveSession' type.
import { GoogleGenAI, Modality, LiveServerMessage, Blob as GenaiBlob } from "@google/genai";
import { ChatMessage } from '../types';
import { askWithGrounding } from '../services/geminiService';
import { AgentIcon, SendIcon, MicrophoneIcon, StopIcon, XCircleIcon } from './icons';
import { decode, encode, decodeAudioData } from '../utils/audio';

type ChatMode = 'text' | 'voice';

const Chatbot: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [useGrounding, setUseGrounding] = useState(true);
    const [mode, setMode] = useState<ChatMode>('text');
    const [isListening, setIsListening] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Fix: Changed 'LiveSession' to 'any' as it is not an exported type.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<{in: AudioContext, out: AudioContext} | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    
    const [transcription, setTranscription] = useState({ user: '', model: '' });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, transcription]);

    const handleTextSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending) return;

        const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsSending(true);

        const { text, sources } = await askWithGrounding(input, useGrounding);
        
        const modelMessage: ChatMessage = { id: crypto.randomUUID(), role: 'model', text, sources };
        setMessages(prev => [...prev, modelMessage]);
        setIsSending(false);
    };
    
    // --- Live API Voice Chat Logic ---

    const stopListening = useCallback(() => {
        setIsListening(false);
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.in.close();
            audioContextRef.current.out.close();
            audioContextRef.current = null;
        }
    }, []);

    const startListening = async () => {
        if (isListening) {
            stopListening();
            return;
        }
        
        setIsListening(true);
        setTranscription({ user: '', model: '' });
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
        // Fix: Cast window to 'any' to allow access to legacy 'webkitAudioContext'.
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        // Fix: Cast window to 'any' to allow access to legacy 'webkitAudioContext'.
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = { in: inputAudioContext, out: outputAudioContext };
        
        let nextStartTime = 0;
        const sources = new Set<AudioBufferSourceNode>();

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: async () => {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const source = inputAudioContext.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob: GenaiBlob = {
                            data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromiseRef.current?.then((session) => {
                           session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContext.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                        const sourceNode = outputAudioContext.createBufferSource();
                        sourceNode.buffer = audioBuffer;
                        sourceNode.connect(outputAudioContext.destination);
                        sourceNode.addEventListener('ended', () => sources.delete(sourceNode));
                        sourceNode.start(nextStartTime);
                        nextStartTime += audioBuffer.duration;
                        sources.add(sourceNode);
                    }
                    
                    if (message.serverContent?.inputTranscription) {
                        setTranscription(prev => ({...prev, user: prev.user + message.serverContent.inputTranscription.text}));
                    }
                    if (message.serverContent?.outputTranscription) {
                        setTranscription(prev => ({...prev, model: prev.model + message.serverContent.outputTranscription.text}));
                    }
                    if (message.serverContent?.turnComplete) {
                        const userText = transcription.user + (message.serverContent?.inputTranscription?.text || '');
                        const modelText = transcription.model + (message.serverContent?.outputTranscription?.text || '');
                        if(userText.trim()) {
                             setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: userText.trim()}]);
                        }
                        if(modelText.trim()) {
                             setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: modelText.trim()}]);
                        }
                        setTranscription({ user: '', model: '' });
                    }

                    if (message.serverContent?.interrupted) {
                        sources.forEach(s => s.stop());
                        sources.clear();
                        nextStartTime = 0;
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live API Error:', e);
                    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: 'Sorry, a connection error occurred.'}]);
                    stopListening();
                },
                onclose: (e: CloseEvent) => {
                    // This can be triggered by stopListening, so check state.
                    if(isListening) stopListening();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                },
            },
        });
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => stopListening();
    }, [stopListening]);


    return (
        <div className="fixed bottom-24 right-6 w-[calc(100%-3rem)] max-w-lg h-[70vh] max-h-[600px] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <AgentIcon className="w-8 h-8 text-cyan-400" />
                    <h2 className="text-xl font-bold">Compliance Assistant</h2>
                </div>
                <div className="flex items-center bg-gray-900 rounded-full p-1 text-sm">
                    <button onClick={() => setMode('text')} className={`px-3 py-1 rounded-full ${mode === 'text' ? 'bg-cyan-500 text-white' : 'text-gray-400'}`}>Text</button>
                    <button onClick={() => setMode('voice')} className={`px-3 py-1 rounded-full ${mode === 'voice' ? 'bg-cyan-500 text-white' : 'text-gray-400'}`}>Voice</button>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white"><XCircleIcon className="w-7 h-7" /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <AgentIcon className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />}
                        <div className={`w-full max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-cyan-800/50' : 'bg-gray-700'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-gray-600">
                                    <h4 className="text-xs font-semibold text-gray-400 mb-1">Sources:</h4>
                                    <ul className="text-xs space-y-1">
                                        {msg.sources.map(source => (
                                            <li key={source.uri}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block">{source.title}</a></li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                 {(transcription.user || transcription.model) && (
                     <>
                        <div className="flex gap-3 justify-end">
                            <div className="w-full max-w-md p-3 rounded-lg bg-cyan-800/50 text-gray-400 italic">
                                {transcription.user}...
                            </div>
                        </div>
                        <div className="flex gap-3">
                             <AgentIcon className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
                            <div className="w-full max-w-md p-3 rounded-lg bg-gray-700 text-gray-400 italic">
                                {transcription.model}...
                            </div>
                        </div>
                     </>
                 )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {mode === 'text' ? (
                <form onSubmit={handleTextSubmit} className="p-4 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about compliance, security, or recent events..."
                            className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <button type="submit" disabled={isSending} className="bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-md disabled:bg-gray-600">
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <label className="flex items-center mt-2 text-xs text-gray-400 gap-2 cursor-pointer">
                        <input type="checkbox" checked={useGrounding} onChange={(e) => setUseGrounding(e.target.checked)} className="rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600" />
                        Use Google Search for up-to-date answers
                    </label>
                </form>
            ) : (
                <div className="p-4 border-t border-gray-700 flex flex-col items-center justify-center">
                    <button 
                        onClick={startListening}
                        className={`flex items-center gap-2 font-bold py-2 px-6 rounded-full transition-colors ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-500 hover:bg-cyan-600'}`}
                    >
                        {isListening ? <> <StopIcon className="w-5 h-5"/> Stop Conversation</> : <><MicrophoneIcon className="w-5 h-5"/> Start Conversation</>}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">{isListening ? "Listening... speak into your microphone." : "Click to start a real-time voice chat."}</p>
                </div>
            )}
        </div>
    );
};

export default Chatbot;