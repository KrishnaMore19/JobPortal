import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
    MessageCircle, 
    Send, 
    Bot, 
    User, 
    X, 
    Loader2, 
    Sparkles, 
    Star,
    Clock,
    AlertCircle,
    Zap,
    Copy,
    WifiOff,
    RefreshCw,
    FileUp,
    Trash2,
    Maximize2,
    Minimize2
} from 'lucide-react';
import useGenAI from '@/hooks/useGenAI';
import { toast } from 'sonner';

const ChatbotGenerator = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [connectionError, setConnectionError] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    
    // Enhanced thinking state management - FIXED
    const [isThinking, setIsThinking] = useState(false);
    const [shouldShowAnimation, setShouldShowAnimation] = useState(false);
    const [animationStartTime, setAnimationStartTime] = useState(null);
    const [hasMessageBeenSent, setHasMessageBeenSent] = useState(false); // NEW: Track if user has sent a message
    
    // Refs
    const messagesEndRef = React.useRef(null);
    const messageInputRef = React.useRef(null);
    const fileInputRef = React.useRef(null);
    const animationTimeoutRef = React.useRef(null);

    // Get data from custom hook
    const {
        sendChatMessage,
        clearChatHistoryData,
        clearChatErrorData,
        clearFileUploadStatusData,
        resetLoadingStates,
        chatMessages,
        isChatLoading,
        chatError,
        isChatConnected,
        lastMessageTime,
        isFileUploading,
        fileUploadError,
        fileUploadStatus,
        botTyping,
        isLoggedIn
    } = useGenAI();

    // Reset loading states when component mounts or dialog opens - FIXED
    React.useEffect(() => {
        if (isDialogOpen) {
            resetLoadingStates?.();
            // Don't reset animation states here, let them be controlled by actual loading states
        }
    }, [isDialogOpen, resetLoadingStates]);

    // Auto scroll to bottom when new messages arrive
    React.useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    // Monitor connection errors
    React.useEffect(() => {
        if (chatError) {
            if (chatError.includes('404') || chatError.includes('Network Error') || chatError.includes('401')) {
                setConnectionError(true);
            }
        } else {
            setConnectionError(false);
        }
    }, [chatError]);

    // FIXED: Enhanced loading state management - show animation for 2-3 seconds
    React.useEffect(() => {
        const isLoading = (isChatLoading || botTyping || isFileUploading) && hasMessageBeenSent;
        
        if (isLoading) {
            setIsThinking(true);
            setShouldShowAnimation(true);
            if (!animationStartTime) {
                setAnimationStartTime(Date.now());
            }
            
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        } else if (hasMessageBeenSent) {
            // Always show animation for minimum 2.5-3 seconds regardless of actual loading time
            const currentTime = Date.now();
            const animationDuration = animationStartTime ? currentTime - animationStartTime : 0;
            const minimumDuration = 2500 + Math.random() * 500; // 2.5-3 seconds random duration
            
            if (animationDuration < minimumDuration && animationStartTime) {
                const remainingTime = minimumDuration - animationDuration;
                
                animationTimeoutRef.current = setTimeout(() => {
                    setIsThinking(false);
                    setShouldShowAnimation(false);
                    setAnimationStartTime(null);
                }, remainingTime);
            } else {
                setIsThinking(false);
                setShouldShowAnimation(false);
                setAnimationStartTime(null);
            }
        } else {
            // If no message has been sent, ensure animation is off
            setIsThinking(false);
            setShouldShowAnimation(false);
            setAnimationStartTime(null);
        }

        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, [isChatLoading, botTyping, isFileUploading, animationStartTime, hasMessageBeenSent]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Clean response text to remove ONLY problematic asterisks while preserving good formatting
    const cleanResponse = (text) => {
        if (!text) return text;
        
        let cleanedText = text;
        
        // Only remove problematic asterisks while preserving structure
        cleanedText = cleanedText
            // Convert markdown bold to HTML-like formatting for better display
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Convert bullet points with asterisks to proper bullets
            .replace(/^\s*\*\s+/gm, '• ')
            // Remove standalone asterisks that aren't part of formatting
            .replace(/(?<!\*)\*(?!\*)/g, '')
            // Clean up any orphaned asterisks
            .replace(/\*{3,}/g, '')
            // Preserve line breaks and structure
            .replace(/\n\s*\n/g, '\n\n')
            // Clean up excessive spaces but preserve intentional spacing
            .replace(/[ \t]+/g, ' ')
            .trim();

        return cleanedText;
    };

    // Format text for display with proper HTML rendering
    const formatTextForDisplay = (text) => {
        if (!text) return text;
        
        const cleaned = cleanResponse(text);
        
        // Convert our formatted text to JSX elements
        return cleaned.split('\n').map((line, index) => {
            // Handle bold text
            if (line.includes('<strong>')) {
                const parts = line.split(/(<strong>.*?<\/strong>)/g);
                return (
                    <div key={index} className="mb-2">
                        {parts.map((part, partIndex) => {
                            if (part.startsWith('<strong>') && part.endsWith('</strong>')) {
                                const boldText = part.replace(/<\/?strong>/g, '');
                                return <strong key={partIndex} className="font-semibold">{boldText}</strong>;
                            }
                            return part;
                        })}
                    </div>
                );
            }
            
            // Handle bullet points
            if (line.startsWith('• ')) {
                return (
                    <div key={index} className="flex items-start gap-2 mb-1">
                        <span className="text-purple-500 font-bold mt-0.5">•</span>
                        <span>{line.substring(2)}</span>
                    </div>
                );
            }
            
            // Handle headers (lines that end with :)
            if (line.endsWith(':') && line.length < 50) {
                return (
                    <div key={index} className="font-semibold text-purple-700 mb-2 mt-3">
                        {line}
                    </div>
                );
            }
            
            // Regular paragraphs
            if (line.trim()) {
                return (
                    <div key={index} className="mb-2">
                        {line}
                    </div>
                );
            }
            
            // Empty lines for spacing
            return <div key={index} className="mb-2"></div>;
        });
    };

    // Enhanced send message with improved animation handling - FIXED
    const handleSendMessage = async () => {
        if (!isLoggedIn) {
            toast.error('Please login to use chat');
            return;
        }

        if (!message.trim() && !selectedFile) {
            toast.error('Please enter a message or select a file');
            return;
        }

        if (message.length > 1000) {
            toast.error('Message is too long. Please keep it under 1000 characters.');
            return;
        }

        if (selectedFile) {
            const maxFileSize = 10 * 1024 * 1024;
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            
            if (selectedFile.size > maxFileSize) {
                toast.error('File size must be less than 10MB');
                return;
            }

            if (!allowedTypes.includes(selectedFile.type)) {
                toast.error('Only images, PDFs, and document files are allowed');
                return;
            }
        }

        // FIXED: Set message sent flag and ensure proper animation timing
        setHasMessageBeenSent(true);
        setIsThinking(true);
        setShouldShowAnimation(true);
        setAnimationStartTime(Date.now());

        try {
            const result = await sendChatMessage(message.trim(), selectedFile);
            
            if (result?.success) {
                setMessage('');
                setSelectedFile(null);
                setRetryCount(0);
                setConnectionError(false);
                
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                
                // Apply text cleaning if the result contains message content
                if (result.data && result.data.message) {
                    result.data.message = cleanResponse(result.data.message);
                }
                
                scrollToBottom();
                toast.success('Message sent successfully!');
            } else {
                throw new Error(result?.error || 'Failed to send message');
            }

        } catch (error) {
            console.error('Error sending message:', error);
            
            // Stop animation on error
            setIsThinking(false);
            setShouldShowAnimation(false);
            setAnimationStartTime(null);
            
            if (error.response?.status === 422) {
                toast.error('Invalid message format. Please check your input and try again.');
            } else if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
            } else if (error.response?.status === 404) {
                toast.error('Chat service is currently unavailable. Please try again later.');
                setConnectionError(true);
            } else if (error.message?.includes('Network Error')) {
                toast.error('Network connection issue. Please check your internet connection.');
                setConnectionError(true);
            } else {
                toast.error(error.message || 'Failed to send message. Please try again.');
            }
            
            setRetryCount(prev => prev + 1);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            clearFileUploadStatusData?.();
            toast.success(`File "${file.name}" selected`);
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        clearFileUploadStatusData?.();
        toast.info('File removed');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleRetryConnection = async () => {
        setConnectionError(false);
        clearChatErrorData?.();
        setRetryCount(0);
        resetLoadingStates?.();
        setIsThinking(false);
        setShouldShowAnimation(false);
        setAnimationStartTime(null);
        toast.info('Reconnecting...');
    };

    const handleClearChat = async () => {
        try {
            const result = await clearChatHistoryData();
            if (result?.success) {
                toast.success('Chat history cleared');
                resetLoadingStates?.();
                setIsThinking(false);
                setShouldShowAnimation(false);
                setAnimationStartTime(null);
                setHasMessageBeenSent(false); // FIXED: Reset message sent flag
            }
        } catch (error) {
            toast.error('Failed to clear chat history');
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return '';
        }
    };

    const copyToClipboard = async (text) => {
        try {
            // Clean the text before copying to remove any remaining asterisks
            const cleanText = cleanResponse(text);
            await navigator.clipboard.writeText(cleanText);
            toast.success('Message copied to clipboard');
        } catch (error) {
            const textArea = document.createElement('textarea');
            textArea.value = cleanResponse(text);
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                toast.success('Message copied to clipboard');
            } catch (fallbackError) {
                toast.error('Failed to copy message');
            }
            document.body.removeChild(textArea);
        }
    };

    const getConnectionStatus = () => {
        if (connectionError) return { status: 'error', text: 'Connection Error', color: 'bg-red-100 text-red-700 border-red-300' };
        if (isChatConnected) return { status: 'connected', text: 'Online', color: 'bg-green-100 text-green-700 border-green-300' };
        return { status: 'disconnected', text: 'Offline', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
    };

    const connectionStatus = getConnectionStatus();

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isAnyLoading = isChatLoading || isFileUploading || botTyping || isThinking;

    // FIXED: AI Thinking Animation Component - only show when appropriate
    const AIThinkingAnimation = () => {
        const [currentThought, setCurrentThought] = useState(0);
        const [writingText, setWritingText] = useState('');
        const [showCursor, setShowCursor] = useState(true);
        const [animationPhase, setAnimationPhase] = useState('thinking');

        const thoughtMessages = [
            "Analyzing your question...",
            "Searching knowledge base...",
            "Processing information...",
            "Formulating response...",
            "Optimizing answer...",
            "Nearly ready..."
        ];

        const writingMessages = [
            "Analyzing your request carefully...",
            "Gathering the most relevant information...",
            "Crafting a personalized response...",
            "Structuring helpful insights...",
            "Finalizing comprehensive answer...",
            "Preparing actionable guidance..."
        ];

        const processingSteps = [
            { icon: "🧠", text: "Understanding context...", color: "text-purple-600" },
            { icon: "🔍", text: "Analyzing requirements...", color: "text-blue-600" },
            { icon: "💡", text: "Generating insights...", color: "text-green-600" },
            { icon: "✨", text: "Polishing response...", color: "text-yellow-600" },
            { icon: "🎯", text: "Finalizing answer...", color: "text-pink-600" }
        ];

        React.useEffect(() => {
            if (!shouldShowAnimation) return;
            
            const interval = setInterval(() => {
                setCurrentThought(prev => (prev + 1) % thoughtMessages.length);
                
                const progress = currentThought / thoughtMessages.length;
                if (progress < 0.3) setAnimationPhase('thinking');
                else if (progress < 0.7) setAnimationPhase('processing');
                else setAnimationPhase('finalizing');
                
            }, 1500);
            
            return () => clearInterval(interval);
        }, [shouldShowAnimation, currentThought]);

        React.useEffect(() => {
            if (!shouldShowAnimation) return;
            
            let currentMessageIndex = 0;
            let currentCharIndex = 0;
            let isDeleting = false;
            
            const typewriterInterval = setInterval(() => {
                const currentMessage = writingMessages[currentMessageIndex];
                
                if (!isDeleting && currentCharIndex < currentMessage.length) {
                    setWritingText(currentMessage.slice(0, currentCharIndex + 1));
                    currentCharIndex++;
                } else if (!isDeleting && currentCharIndex === currentMessage.length) {
                    setTimeout(() => {
                        isDeleting = true;
                    }, 1000);
                } else if (isDeleting && currentCharIndex > 0) {
                    setWritingText(currentMessage.slice(0, currentCharIndex - 1));
                    currentCharIndex--;
                } else if (isDeleting && currentCharIndex === 0) {
                    isDeleting = false;
                    currentMessageIndex = (currentMessageIndex + 1) % writingMessages.length;
                }
            }, isDeleting ? 50 : 80);
            
            return () => clearInterval(typewriterInterval);
        }, [shouldShowAnimation]);

        React.useEffect(() => {
            const cursorInterval = setInterval(() => {
                setShowCursor(prev => !prev);
            }, 500);
            
            return () => clearInterval(cursorInterval);
        }, []);

        // FIXED: Only render if we should show animation AND user has sent a message
        if (!shouldShowAnimation || !hasMessageBeenSent) return null;

        return (
            <div className="flex gap-3 justify-start animate-fade-in">
                <div className="relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ${
                        animationPhase === 'thinking' ? 'bg-gradient-to-r from-purple-600 to-violet-600 animate-pulse' :
                        animationPhase === 'processing' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 animate-bounce' :
                        'bg-gradient-to-r from-green-600 to-emerald-600 animate-spin-slow'
                    }`}>
                        <Bot className={`h-4 w-4 text-white ${
                            animationPhase === 'thinking' ? 'animate-pulse' :
                            animationPhase === 'processing' ? 'animate-bounce' :
                            'animate-spin'
                        }`} />
                    </div>
                    
                    <div className="absolute inset-0 rounded-full border-2 border-purple-300 animate-ping"></div>
                    <div className="absolute -inset-1 rounded-full border border-purple-200 animate-pulse-ring"></div>
                    
                    <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-bounce ${
                        animationPhase === 'thinking' ? 'bg-purple-400' :
                        animationPhase === 'processing' ? 'bg-blue-400' :
                        'bg-green-400'
                    }`}></div>
                    <div className={`absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full animate-bounce delay-300 ${
                        animationPhase === 'thinking' ? 'bg-violet-400' :
                        animationPhase === 'processing' ? 'bg-indigo-400' :
                        'bg-emerald-400'
                    }`}></div>
                </div>

                <div className="bg-white border border-purple-100 rounded-2xl px-4 py-3 shadow-xl max-w-md animate-bubble-bounce">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 border-b border-purple-50 pb-2">
                            <div className="flex gap-1">
                                <div className={`w-2 h-2 rounded-full animate-bounce-custom ${
                                    animationPhase === 'thinking' ? 'bg-purple-500' :
                                    animationPhase === 'processing' ? 'bg-blue-500' :
                                    'bg-green-500'
                                }`}></div>
                                <div className={`w-2 h-2 rounded-full animate-bounce-custom delay-100 ${
                                    animationPhase === 'thinking' ? 'bg-purple-500' :
                                    animationPhase === 'processing' ? 'bg-blue-500' :
                                    'bg-green-500'
                                }`}></div>
                                <div className={`w-2 h-2 rounded-full animate-bounce-custom delay-200 ${
                                    animationPhase === 'thinking' ? 'bg-purple-500' :
                                    animationPhase === 'processing' ? 'bg-blue-500' :
                                    'bg-green-500'
                                }`}></div>
                            </div>
                            <span className={`text-sm font-semibold ${
                                animationPhase === 'thinking' ? 'text-purple-600' :
                                animationPhase === 'processing' ? 'text-blue-600' :
                                'text-green-600'
                            }`}>
                                {isFileUploading ? '📄 Analyzing Document...' : 
                                 animationPhase === 'thinking' ? '🤔 Thinking...' :
                                 animationPhase === 'processing' ? '⚡ Processing...' :
                                 '✨ Finalizing...'}
                            </span>
                        </div>

                        <div className="min-h-[24px] flex items-center">
                            <span className={`text-sm font-mono ${
                                animationPhase === 'thinking' ? 'text-purple-700' :
                                animationPhase === 'processing' ? 'text-blue-700' :
                                'text-green-700'
                            }`}>
                                {writingText}
                                <span className={`transition-opacity duration-100 ${
                                    showCursor ? 'opacity-100' : 'opacity-0'
                                } ${
                                    animationPhase === 'thinking' ? 'text-purple-500' :
                                    animationPhase === 'processing' ? 'text-blue-500' :
                                    'text-green-500'
                                }`}>|</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${
                                    animationPhase === 'thinking' ? 'bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600 w-1/3' :
                                    animationPhase === 'processing' ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 w-2/3' :
                                    'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 w-full'
                                } animate-pulse`}></div>
                            </div>
                            <span className={`text-xs font-medium ${
                                animationPhase === 'thinking' ? 'text-purple-500' :
                                animationPhase === 'processing' ? 'text-blue-500' :
                                'text-green-500'
                            }`}>
                                {animationPhase === 'thinking' ? '33%' :
                                 animationPhase === 'processing' ? '67%' :
                                 '99%'}
                            </span>
                        </div>

                        <div className={`text-xs animate-text-fade ${
                            animationPhase === 'thinking' ? 'text-purple-600' :
                            animationPhase === 'processing' ? 'text-blue-600' :
                            'text-green-600'
                        }`}>
                            {processingSteps[Math.min(currentThought, processingSteps.length - 1)].icon}{' '}
                            {thoughtMessages[currentThought]}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                            <div className="flex items-center gap-1">
                                <span className={`animate-bounce ${
                                    animationPhase === 'thinking' ? '🤖' :
                                    animationPhase === 'processing' ? '⚡' :
                                    '✨'
                                }`}></span>
                                <span className={`${
                                    animationPhase === 'thinking' ? 'text-purple-500' :
                                    animationPhase === 'processing' ? 'text-blue-500' :
                                    'text-green-500'
                                }`}>
                                    {animationPhase === 'thinking' ? 'Thinking Mode' :
                                     animationPhase === 'processing' ? 'Processing Mode' :
                                     'Finalizing Mode'}
                                </span>
                            </div>
                            <span className="text-gray-400">
                                {new Date().toLocaleTimeString().split(':').slice(0,2).join(':')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Floating Chatbot Button */}
            <div className="fixed bottom-6 right-6 z-50 floating-chatbot-container">
                <div className="relative group">
                    {/* Beautiful pulsing background glow */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-violet-400 opacity-30 blur-xl animate-pulse-glow scale-150"></div>
                    
                    {/* Main Floating Button with Single Beautiful Animation */}
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        disabled={!isLoggedIn}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-2xl border-4 border-white transition-all duration-500 transform hover:scale-110 animate-float p-0 relative overflow-hidden group"
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        
                        {/* Single Message Icon with Beautiful Animation */}
                        <MessageCircle size={28} className="animate-gentle-pulse" />
                        
                        {/* Message Count Indicator (without bouncing) */}
                        {chatMessages.length > 0 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-400 to-pink-500 rounded-full text-xs font-bold flex items-center justify-center text-white shadow-lg animate-scale-in border-2 border-white">
                                {chatMessages.length > 99 ? '99+' : chatMessages.length}
                            </div>
                        )}
                        
                        {/* Beautiful Status Indicator */}
                        <div className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full border-3 border-white shadow-lg ${
                            connectionStatus.status === 'connected' ? 'bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse-success' :
                            connectionStatus.status === 'error' ? 'bg-gradient-to-r from-red-400 to-rose-500 animate-pulse-error' :
                            'bg-gradient-to-r from-yellow-400 to-amber-500 animate-pulse-warning'
                        }`}>
                            <div className={`absolute inset-1 rounded-full ${
                                connectionStatus.status === 'connected' ? 'bg-green-300 animate-pulse' :
                                connectionStatus.status === 'error' ? 'bg-red-300 animate-pulse' :
                                'bg-yellow-300 animate-pulse'
                            }`}></div>
                        </div>
                        
                        {/* Floating particles effect */}
                        <div className="absolute inset-0 rounded-full">
                            <div className="absolute top-1 left-2 w-1 h-1 bg-white/60 rounded-full animate-float-particle-1"></div>
                            <div className="absolute top-3 right-1 w-1.5 h-1.5 bg-white/40 rounded-full animate-float-particle-2"></div>
                            <div className="absolute bottom-2 left-1 w-1 h-1 bg-white/50 rounded-full animate-float-particle-3"></div>
                        </div>
                    </Button>
                </div>
            </div>

            {/* Chat Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent 
                    className={`${isMaximized ? 'max-w-[95vw] w-[95vw] h-[95vh]' : 'max-w-4xl w-[90vw] h-[85vh]'} max-h-[95vh] bg-gradient-to-br from-purple-50 via-white to-violet-50 border-purple-200 flex flex-col p-0 transition-all duration-300`}
                >
                    {/* Header */}
                    <DialogHeader className="px-6 py-4 border-b border-purple-200 bg-white/90 backdrop-blur-sm flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full flex items-center justify-center shadow-lg animate-pulse-slow">
                                        <Bot className="h-6 w-6 text-white" />
                                    </div>
                                    {connectionStatus.status === 'connected' && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                    )}
                                    {connectionStatus.status === 'error' && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                                            <WifiOff className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-purple-800 flex items-center">
                                        AI Career Assistant
                                        <Sparkles className="ml-2 h-5 w-5 text-amber-500 animate-twinkle" />
                                    </DialogTitle>
                                    <DialogDescription className="text-purple-600 flex items-center gap-2">
                                        <Star className="h-4 w-4 text-amber-500" />
                                        Your intelligent career companion
                                        {connectionError && (
                                            <span className="text-red-600 text-xs">• Connection issues detected</span>
                                        )}
                                    </DialogDescription>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Badge className={`${connectionStatus.color} transition-all duration-300`}>
                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                        connectionStatus.status === 'connected' ? 'bg-green-500 animate-pulse' : 
                                        connectionStatus.status === 'error' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500 animate-pulse'
                                    }`}></div>
                                    {connectionStatus.text}
                                </Badge>

                                {connectionError && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRetryConnection}
                                        className="border-yellow-300 text-yellow-600 hover:bg-yellow-50 transition-all duration-300"
                                        disabled={isAnyLoading}
                                    >
                                        <RefreshCw className={`h-4 w-4 mr-1 ${isAnyLoading ? 'animate-spin' : ''}`} />
                                        Retry
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsMaximized(!isMaximized)}
                                    className="border-purple-300 text-purple-600 hover:bg-purple-50 transition-all duration-300"
                                >
                                    {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </Button>

                                {chatMessages.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClearChat}
                                        className="border-red-300 text-red-600 hover:bg-red-50 transition-all duration-300"
                                        disabled={isAnyLoading}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Connection Error Banner */}
                    {connectionError && (
                        <div className="bg-red-50 border-b border-red-200 px-6 py-3 animate-slide-down">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-red-700">
                                    <WifiOff className="h-4 w-4 animate-pulse" />
                                    <span className="text-sm font-medium">Connection Error</span>
                                    <span className="text-xs">Chat service is temporarily unavailable</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRetryConnection}
                                    className="text-red-600 hover:bg-red-100"
                                    disabled={isAnyLoading}
                                >
                                    <RefreshCw className={`h-3 w-3 mr-1 ${isAnyLoading ? 'animate-spin' : ''}`} />
                                    Retry
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* File Upload Error Banner */}
                    {fileUploadError && (
                        <div className="bg-orange-50 border-b border-orange-200 px-6 py-3 animate-slide-down">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-orange-700">
                                    <AlertCircle className="h-4 w-4 animate-pulse" />
                                    <span className="text-sm font-medium">File Upload Error</span>
                                    <span className="text-xs">{fileUploadError}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFileUploadStatusData}
                                    className="text-orange-600 hover:bg-orange-100"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Chat Messages Area */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Messages Container */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-25 via-white to-violet-25">
                            {/* Welcome Message - FIXED: Only show when no messages and no animation */}
                            {chatMessages.length === 0 && !shouldShowAnimation && !hasMessageBeenSent && (
                                <div className="text-center py-12 animate-fade-in">
                                    <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce-gentle">
                                        <Bot className="h-10 w-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-purple-800 mb-3 flex items-center justify-center gap-2">
                                        Welcome to AI Career Chat!
                                        <Sparkles className="h-6 w-6 text-amber-500 animate-twinkle" />
                                    </h3>
                                    <p className="text-purple-600 mb-6 max-w-md mx-auto">
                                        I'm your intelligent career assistant. Ask me anything about your resume, job applications, interview preparation, or upload files for analysis!
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                                        {[
                                            "📝 Review my resume",
                                            "💼 Interview tips please",
                                            "📄 Cover letter help",
                                            "🎯 Career guidance",
                                            "📊 Job market insights"
                                        ].map((suggestion, index) => (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setMessage(suggestion.replace(/📝|💼|📄|🎯|📊/, '').trim())}
                                                className="border-purple-300 text-purple-600 hover:bg-purple-50 transition-all duration-300 hover:scale-105 hover:shadow-md"
                                                disabled={connectionError || isAnyLoading}
                                            >
                                                {suggestion}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Chat Messages */}
                            {chatMessages.map((msg, index) => (
                                <div
                                    key={msg.id || index}
                                    className={`flex gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'} animate-message-slide-in`}
                                >
                                    {/* Bot Avatar */}
                                    {!msg.isUser && (
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg animate-avatar-glow">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                    )}

                                    {/* Message Content */}
                                    <div className={`max-w-[70%] ${msg.isUser ? 'order-first' : ''}`}>
                                        <div
                                            className={`rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                                                msg.isUser
                                                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white ml-auto message-bubble-user'
                                                    : 'bg-white border border-purple-100 text-gray-800 message-bubble-bot'
                                            }`}
                                        >
                                            {/* File indicator */}
                                            {msg.hasFile && (
                                                <div className={`flex items-center gap-2 mb-2 text-xs ${
                                                    msg.isUser ? 'text-white/80' : 'text-purple-600'
                                                }`}>
                                                    <FileUp className="h-3 w-3 animate-pulse" />
                                                    File: {msg.fileName}
                                                </div>
                                            )}

                                            {/* File uploaded indicator */}
                                            {msg.fileUploaded && (
                                                <div className="flex items-center gap-2 mb-2 text-xs text-green-600">
                                                    <FileUp className="h-3 w-3 animate-bounce" />
                                                    File processed successfully
                                                </div>
                                            )}

                                            {/* Message Text - Clean any asterisks from display */}
                                            <div className="whitespace-pre-wrap leading-relaxed">
                                                {cleanResponse(msg.message)}
                                            </div>

                                            {/* Message Footer */}
                                            <div className={`flex items-center justify-between mt-2 text-xs ${
                                                msg.isUser ? 'text-white/70' : 'text-gray-500'
                                            }`}>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTimestamp(msg.timestamp)}
                                                    {msg.processing_time && (
                                                        <span>• {msg.processing_time}ms</span>
                                                    )}
                                                </div>
                                                
                                                {!msg.isUser && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(msg.message)}
                                                        className="h-6 w-6 p-0 hover:bg-purple-100 transition-all duration-200"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* User Avatar */}
                                    {msg.isUser && (
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg animate-avatar-glow">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* AI Thinking Animation - FIXED: Only show when conditions are met */}
                            <AIThinkingAnimation />

                            {/* Error Message */}
                            {chatError && !connectionError && (
                                <div className="flex justify-center animate-shake">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 shadow-lg">
                                        <AlertCircle className="h-4 w-4 animate-pulse" />
                                        <span className="text-sm">{chatError}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearChatErrorData}
                                            className="text-red-600 hover:bg-red-100 h-6 w-6 p-0"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-purple-200 flex-shrink-0">
                            {/* Selected File Display */}
                            {selectedFile && (
                                <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between animate-slide-up">
                                    <div className="flex items-center gap-2">
                                        <FileUp className="h-4 w-4 text-purple-600 animate-bounce" />
                                        <span className="text-sm text-purple-700 font-medium">{selectedFile.name}</span>
                                        <span className="text-xs text-purple-500">({formatFileSize(selectedFile.size)})</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={removeSelectedFile}
                                        className="text-red-600 hover:bg-red-100 h-6 w-6 p-0 transition-all duration-200"
                                        disabled={isAnyLoading}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}

                            {/* Input Row */}
                            <div className="flex gap-3">
                                {/* File Upload Button */}
                                <div className="relative">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={handleFileSelect}
                                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                        className="hidden"
                                        disabled={isAnyLoading || connectionError}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isAnyLoading || connectionError}
                                        className="border-purple-300 text-purple-600 hover:bg-purple-50 h-12 px-3 transition-all duration-300 hover:scale-105"
                                    >
                                        <FileUp className={`h-5 w-5 ${isFileUploading ? 'animate-bounce' : ''}`} />
                                    </Button>
                                </div>

                                {/* Message Input */}
                                <div className="flex-1 relative">
                                    <textarea
                                        ref={messageInputRef}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={connectionError ? "Reconnect to send messages..." : "Ask me anything about your career, resume, or upload a file for analysis..."}
                                        className="w-full resize-none border border-purple-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white min-h-[48px] max-h-32 transition-all duration-300 placeholder-purple-400"
                                        rows={1}
                                        disabled={isAnyLoading || connectionError}
                                        maxLength={1000}
                                    />
                                    
                                    {/* Character Count */}
                                    <div className={`absolute bottom-1 right-12 text-xs transition-colors duration-300 ${
                                        message.length > 900 ? 'text-red-400' : 'text-gray-400'
                                    }`}>
                                        {message.length}/1000
                                    </div>
                                </div>

                                {/* Send Button */}
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={(!message.trim() && !selectedFile) || isAnyLoading || connectionError}
                                    className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-3 h-auto shadow-lg disabled:opacity-50 transition-all duration-300 hover:scale-105 relative overflow-hidden group"
                                >
                                    {/* Button shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    
                                    {isAnyLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span className="text-sm">Sending...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Send className="h-5 w-5" />
                                            <span className="text-sm font-medium">Send</span>
                                        </div>
                                    )}
                                </Button>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center justify-between mt-3 text-xs text-purple-600">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <Zap className="h-3 w-3 animate-pulse" />
                                        Press Enter to send • Shift+Enter for new line
                                    </span>
                                    {retryCount > 0 && (
                                        <span className="text-yellow-600 animate-pulse">
                                            Retries: {retryCount}
                                        </span>
                                    )}
                                    {fileUploadStatus?.success && (
                                        <span className="text-green-600 animate-bounce">
                                            File uploaded successfully
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {lastMessageTime && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Last: {formatTimestamp(lastMessageTime)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* File Upload Instructions */}
                            <div className="mt-2 text-xs text-gray-500 text-center">
                                Supported files: PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)
                            </div>
                        </div>
                    </div>

                    {/* Status Footer */}
                    <div className="px-6 py-2 bg-white/70 backdrop-blur-sm border-t border-purple-200 flex-shrink-0">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                                        connectionStatus.status === 'connected' ? 'bg-green-500' : 
                                        connectionStatus.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}></div>
                                    {connectionStatus.status === 'connected' ? 'Service Online' : 
                                     connectionStatus.status === 'error' ? 'Service Unavailable' : 'Connecting...'}
                                </span>
                                {chatMessages.length > 0 && (
                                    <span>{chatMessages.length} messages</span>
                                )}
                                {shouldShowAnimation && hasMessageBeenSent && (
                                    <span className="text-purple-600 animate-pulse">
                                        AI is thinking...
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {connectionError && (
                                    <span className="text-red-600 animate-pulse">
                                        Check internet connection
                                    </span>
                                )}
                                <span>Powered by AI • Career Assistant</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Enhanced CSS Styles with New Beautiful Animations */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-fade-in { animation: fade-in 0.3s ease-out; }

                @keyframes message-slide-in {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .animate-message-slide-in { animation: message-slide-in 0.4s ease-out; }

                @keyframes slide-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-slide-down { animation: slide-down 0.3s ease-out; }

                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-slide-up { animation: slide-up 0.3s ease-out; }

                @keyframes bounce-custom {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }

                .animate-bounce-custom { animation: bounce-custom 1.4s ease-in-out infinite both; }

                .delay-100 { animation-delay: -1.1s; }
                .delay-200 { animation-delay: -0.9s; }
                .delay-300 { animation-delay: -0.7s; }

                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }

                @keyframes twinkle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.8); }
                }

                .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }

                @keyframes pulse-ring {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }

                .animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }

                @keyframes bubble-bounce {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-2px) scale(1.01); }
                }

                .animate-bubble-bounce { animation: bubble-bounce 3s ease-in-out infinite; }

                @keyframes text-fade {
                    0%, 100% { opacity: 1; transform: translateY(0); }
                    50% { opacity: 0.7; transform: translateY(-2px); }
                }

                .animate-text-fade { animation: text-fade 2s ease-in-out infinite; }

                @keyframes avatar-glow {
                    0%, 100% { box-shadow: 0 0 10px rgba(147, 51, 234, 0.5); }
                    50% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.8); }
                }

                .animate-avatar-glow { animation: avatar-glow 2s ease-in-out infinite; }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                    20%, 40%, 60%, 80% { transform: translateX(2px); }
                }

                .animate-shake { animation: shake 0.5s ease-in-out; }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .animate-spin-slow { animation: spin-slow 3s linear infinite; }

                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }

                /* New Beautiful Animations for Floating Button */
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-4px) rotate(1deg); }
                    50% { transform: translateY(-8px) rotate(0deg); }
                    75% { transform: translateY(-4px) rotate(-1deg); }
                }

                .animate-float { animation: float 6s ease-in-out infinite; }

                @keyframes gentle-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }

                .animate-gentle-pulse { animation: gentle-pulse 3s ease-in-out infinite; }

                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.1); }
                }

                .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }

                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0); }
                    to { opacity: 1; transform: scale(1); }
                }

                .animate-scale-in { animation: scale-in 0.3s ease-out; }

                @keyframes pulse-success {
                    0%, 100% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.5); }
                    50% { box-shadow: 0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.3); }
                }

                .animate-pulse-success { animation: pulse-success 2s ease-in-out infinite; }

                @keyframes pulse-error {
                    0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.5); }
                    50% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.3); }
                }

                .animate-pulse-error { animation: pulse-error 2s ease-in-out infinite; }

                @keyframes pulse-warning {
                    0%, 100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.5); }
                    50% { box-shadow: 0 0 10px rgba(251, 191, 36, 0.8), 0 0 20px rgba(251, 191, 36, 0.3); }
                }

                .animate-pulse-warning { animation: pulse-warning 2s ease-in-out infinite; }

                @keyframes float-particle-1 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
                    25% { transform: translate(2px, -4px) scale(1.2); opacity: 1; }
                    50% { transform: translate(-1px, -8px) scale(0.8); opacity: 0.4; }
                    75% { transform: translate(1px, -4px) scale(1.1); opacity: 0.8; }
                }

                .animate-float-particle-1 { animation: float-particle-1 4s ease-in-out infinite; }

                @keyframes float-particle-2 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                    33% { transform: translate(-3px, -3px) scale(1.3); opacity: 0.9; }
                    66% { transform: translate(2px, -6px) scale(0.9); opacity: 0.6; }
                }

                .animate-float-particle-2 { animation: float-particle-2 5s ease-in-out infinite; }

                @keyframes float-particle-3 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
                    40% { transform: translate(1px, -5px) scale(1.1); opacity: 1; }
                    80% { transform: translate(-2px, -3px) scale(0.7); opacity: 0.3; }
                }

                .animate-float-particle-3 { animation: float-particle-3 6s ease-in-out infinite; }

                /* Message bubbles */
                .message-bubble-user {
                    background: linear-gradient(135deg, #9333ea, #7c3aed);
                    box-shadow: 0 4px 15px rgba(147, 51, 234, 0.3);
                }

                .message-bubble-bot {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 15px rgba(147, 51, 234, 0.1);
                    border: 1px solid rgba(147, 51, 234, 0.2);
                }

                .message-bubble-user:hover,
                .message-bubble-bot:hover {
                    transform: translateY(-2px) scale(1.02);
                    box-shadow: 0 8px 25px rgba(147, 51, 234, 0.4);
                }

                /* Purple gradients */
                .from-purple-25 { --tw-gradient-from: #faf7ff; }
                .to-violet-25 { --tw-gradient-to: #f5f3ff; }

                /* Responsive */
                @media (max-width: 768px) {
                    .floating-chatbot-container {
                        bottom: 1rem !important;
                        right: 1rem !important;
                    }
                    
                    .DialogContent {
                        width: 95vw !important;
                        height: 90vh !important;
                        max-width: 95vw !important;
                    }
                    
                    .message-bubble-user,
                    .message-bubble-bot {
                        max-width: 85% !important;
                    }
                }

                @media (max-width: 480px) {
                    .floating-chatbot-container {
                        bottom: 0.75rem !important;
                        right: 0.75rem !important;
                    }
                }

                /* Scrollbar */
                .overflow-y-auto::-webkit-scrollbar { width: 8px; }
                .overflow-y-auto::-webkit-scrollbar-track { 
                    background: rgba(139, 69, 197, 0.1); 
                    border-radius: 4px; 
                }
                .overflow-y-auto::-webkit-scrollbar-thumb { 
                    background: linear-gradient(135deg, rgba(147, 51, 234, 0.6), rgba(139, 69, 197, 0.8)); 
                    border-radius: 4px; 
                }
                .overflow-y-auto::-webkit-scrollbar-thumb:hover { 
                    background: linear-gradient(135deg, rgba(147, 51, 234, 0.8), rgba(139, 69, 197, 1)); 
                }

                /* Enhanced focus states */
                input:focus, textarea:focus, button:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.2);
                    border-color: #a855f7;
                    transition: all 0.3s ease;
                }

                /* Smooth transitions */
                button, input, textarea, .message-bubble-user, .message-bubble-bot {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .hover\\:scale-105:hover { transform: scale(1.05); }
                .hover\\:scale-110:hover { transform: scale(1.10); }
            `}</style>
        </>
    );
};

export default ChatbotGenerator;