// useGenAI.js - Fixed loading state management

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
    COVER_LETTER_API, 
    RESUME_TIPS_API, 
    RESUME_MATCH_API,
    API_ENDPOINTS 
} from '@/utils/constant';
import {
    generateCoverLetterStart,
    generateCoverLetterSuccess,
    generateCoverLetterFailure,
    clearCoverLetter,
    getResumeTipsStart,
    getResumeTipsSuccess,
    getResumeTipsFailure,
    clearResumeTips,
    matchJobStart,
    matchJobSuccess,
    matchJobFailure,
    clearJobMatch,
    // ✅ Updated chat actions
    sendChatMessageStart,
    sendChatMessageSuccess,
    sendChatMessageFailure,
    fileUploadStart,
    fileUploadSuccess,
    fileUploadFailure,
    clearFileUploadStatus,
    clearChatHistory,
    clearChatError,
    setChatConnectionStatus,
    setBotTyping,
    resetChatLoadingState,  // ✅ NEW action
    clearAllGenAI
} from '@/redux/genaiSlice';

const useGenAI = () => {
    const dispatch = useDispatch();
    
    // ✅ Safer state selection with fallbacks
    const genaiState = useSelector((store) => store.genai) || {};
    const { 
        coverLetter = {}, 
        resumeTips = {}, 
        jobMatcher = {}, 
        chatbot = {} 
    } = genaiState;
    
    const { user } = useSelector((store) => store.auth);

    // ✅ NEW: Reset loading states on mount to prevent stuck loading
    useEffect(() => {
        dispatch(resetChatLoadingState());
    }, [dispatch]);

    // ========== HELPER FUNCTION TO PARSE RESUME TIPS ==========
    const parseResumeTips = (responseData) => {
        console.log('Parsing resume tips from:', responseData);

        // If response is already in the expected format
        if (responseData.success === true && Array.isArray(responseData.tips)) {
            return {
                tips: responseData.tips,
                overallScore: responseData.overallScore || null
            };
        }

        // If response has tips array directly
        if (Array.isArray(responseData.tips)) {
            return {
                tips: responseData.tips,
                overallScore: responseData.overallScore || responseData.overall_score || responseData.score || null
            };
        }

        // If response has resume_tips array
        if (Array.isArray(responseData.resume_tips)) {
            return {
                tips: responseData.resume_tips,
                overallScore: responseData.overallScore || responseData.overall_score || responseData.score || null
            };
        }

        // If response is a direct array
        if (Array.isArray(responseData)) {
            return {
                tips: responseData,
                overallScore: null
            };
        }

        // If response is a string (AI-generated tips as text)
        if (typeof responseData === 'string') {
            // Try to parse if it's JSON string
            try {
                const parsed = JSON.parse(responseData);
                if (Array.isArray(parsed)) {
                    return {
                        tips: parsed,
                        overallScore: null
                    };
                } else if (parsed.tips && Array.isArray(parsed.tips)) {
                    return {
                        tips: parsed.tips,
                        overallScore: parsed.overallScore || parsed.overall_score || null
                    };
                }
            } catch (e) {
                console.log('Parsing plain text response');
            }

            // Split string into individual tips
            const tips = responseData
                .split(/\n\n|\n-|\n\d+\.|\n•/)
                .map(tip => tip.trim())
                .filter(tip => tip.length > 0)
                .map((tip, index) => ({
                    id: index + 1,
                    category: 'General',
                    suggestion: tip.replace(/^\d+\.\s*|\-\s*|•\s*/, '').trim(),
                    priority: 'medium'
                }));

            return {
                tips: tips.length > 0 ? tips : [{ 
                    id: 1, 
                    category: 'General', 
                    suggestion: responseData, 
                    priority: 'medium' 
                }],
                overallScore: null
            };
        }

        // If response has a tips property that's a string
        if (responseData.tips && typeof responseData.tips === 'string') {
            const tips = responseData.tips
                .split(/\n\n|\n-|\n\d+\.|\n•/)
                .map(tip => tip.trim())
                .filter(tip => tip.length > 0)
                .map((tip, index) => ({
                    id: index + 1,
                    category: 'General',
                    suggestion: tip.replace(/^\d+\.\s*|\-\s*|•\s*/, '').trim(),
                    priority: 'medium'
                }));

            return {
                tips: tips.length > 0 ? tips : [{ 
                    id: 1, 
                    category: 'General', 
                    suggestion: responseData.tips, 
                    priority: 'medium' 
                }],
                overallScore: responseData.overallScore || responseData.overall_score || null
            };
        }

        // Fallback: create a single tip from whatever we received
        return {
            tips: [{
                id: 1,
                category: 'General',
                suggestion: 'Resume analysis completed. Please check your profile data.',
                priority: 'medium'
            }],
            overallScore: null
        };
    };

    // ========== COVER LETTER GENERATOR ==========
    const generateCoverLetter = async (jobId) => {
        if (!user?._id) {
            toast.error('Please login to generate cover letter');
            return;
        }

        try {
            dispatch(generateCoverLetterStart({ jobId }));
            
            const apiUrl = `${COVER_LETTER_API}/`;
            
            console.log('Making request to:', apiUrl);
            console.log('With params:', { user_id: user._id, job_id: jobId });
            
            const response = await axios.get(apiUrl, {
                params: {
                    user_id: user._id,
                    job_id: jobId
                },
                timeout: 30000
            });

            console.log('API Response:', response.data);

            if (response.data.cover_letter) {
                dispatch(generateCoverLetterSuccess({
                    content: response.data.cover_letter
                }));
                toast.success('Cover letter generated successfully!');
                return { content: response.data.cover_letter };
            } else {
                throw new Error('No cover letter content in response');
            }
        } catch (error) {
            console.error('Cover Letter Generation Error:', error);
            
            let errorMessage = 'Something went wrong';
            
            if (error.response?.status === 404) {
                errorMessage = 'API endpoint not found. Please check if your backend server is running correctly.';
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error occurred while generating cover letter.';
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
                errorMessage = 'Cannot connect to server. Please ensure your backend is running on port 8000.';
            } else {
                errorMessage = error.response?.data?.message || error.message;
            }
            
            dispatch(generateCoverLetterFailure(errorMessage));
            toast.error(errorMessage);
        }
    };

    // ========== UPDATE COVER LETTER ==========
    const updateCoverLetter = async (jobId, content) => {
        if (!user?._id) {
            toast.error('Please login to update cover letter');
            return;
        }

        try {
            const apiUrl = `${COVER_LETTER_API}/update/`;
            
            const response = await axios.get(apiUrl, {
                params: {
                    user_id: user._id,
                    job_id: jobId,
                    content: content
                },
                timeout: 15000
            });

            if (response.data.success) {
                dispatch(generateCoverLetterSuccess({
                    content: content
                }));
                toast.success('Cover letter updated successfully!');
                return { success: true };
            } else {
                throw new Error(response.data.message || 'Failed to update cover letter');
            }
        } catch (error) {
            console.error('Cover Letter Update Error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update cover letter';
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // ========== RESUME TIPS GENERATOR ==========
    const getResumeTips = async () => {
        if (!user?._id) {
            toast.error('Please login to get resume tips');
            return;
        }

        try {
            dispatch(getResumeTipsStart());
            
            const apiUrl = RESUME_TIPS_API;
            
            console.log('Making Resume Tips request to:', apiUrl);
            console.log('With params:', { user_id: user._id });
            
            const response = await axios.get(apiUrl, {
                params: {
                    user_id: user._id
                },
                timeout: 30000
            });

            console.log('Resume Tips API Response:', response.data);

            if (!response.data && response.data !== '') {
                throw new Error('No data received from server');
            }

            const parsedData = parseResumeTips(response.data);
            
            console.log('Parsed resume tips data:', parsedData);

            if (!Array.isArray(parsedData.tips)) {
                console.error('Parsed tips is not an array:', parsedData.tips);
                throw new Error('Invalid tips format received from server');
            }

            dispatch(getResumeTipsSuccess({
                tips: parsedData.tips,
                overallScore: parsedData.overallScore
            }));
            
            toast.success('Resume analysis completed!');

        } catch (error) {
            console.error('Resume Tips Error:', error);
            
            let errorMessage = 'Something went wrong while analyzing your resume';
            
            if (error.response?.status === 404) {
                errorMessage = 'Resume tips API endpoint not found.';
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error occurred while analyzing resume.';
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Invalid request.';
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
                errorMessage = 'Cannot connect to server.';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timed out.';
            } else {
                errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
            }
            
            dispatch(getResumeTipsFailure(errorMessage));
            toast.error(errorMessage);
        }
    };

    // ========== RESUME + JOB MATCHER ==========
    const matchResumeWithJob = async (jobId) => {
        if (!user?._id) {
            toast.error('Please login to check job match');
            return;
        }

        try {
            dispatch(matchJobStart());

            console.log(`Making job match request to: ${RESUME_MATCH_API}`);
            console.log('With params:', { job_id: jobId, user_id: user._id });

            const response = await axios.get(RESUME_MATCH_API, {
                params: {
                    job_id: jobId,
                    user_id: user._id
                },
                timeout: 30000
            });

            console.log('Job Match API Response:', response.data);

            let matchData = {};

            if (response.data.success && response.data.data) {
                const data = response.data.data;
                matchData = {
                    matchScore: data.score || 0,
                    matchingSkills: Array.isArray(data.strengths) ? data.strengths : [],
                    missingSkills: Array.isArray(data.gaps) ? data.gaps : [],
                    recommendations: Array.isArray(data.recommendations) ? data.recommendations : []
                };
            } else if (response.data.matchScore !== undefined || response.data.match_score !== undefined) {
                matchData = {
                    matchScore: response.data.matchScore || response.data.match_score || 0,
                    matchingSkills: response.data.matchingSkills || response.data.matching_skills || [],
                    missingSkills: response.data.missingSkills || response.data.missing_skills || [],
                    recommendations: response.data.recommendations || response.data.suggestions || []
                };
            } else if (typeof response.data === 'string') {
                try {
                    const parsed = JSON.parse(response.data);
                    matchData = {
                        matchScore: parsed.matchScore || parsed.match_score || 0,
                        matchingSkills: parsed.matchingSkills || parsed.matching_skills || [],
                        missingSkills: parsed.missingSkills || parsed.missing_skills || [],
                        recommendations: parsed.recommendations || parsed.suggestions || []
                    };
                } catch (e) {
                    throw new Error('Invalid response format from job match API');
                }
            } else {
                throw new Error('Unexpected response format from job match API');
            }

            // Ensure arrays are properly formatted
            matchData.matchingSkills = Array.isArray(matchData.matchingSkills) ? matchData.matchingSkills : [];
            matchData.missingSkills = Array.isArray(matchData.missingSkills) ? matchData.missingSkills : [];
            matchData.recommendations = Array.isArray(matchData.recommendations) ? matchData.recommendations : [];

            console.log('Processed match data:', matchData);

            dispatch(matchJobSuccess(matchData));
            toast.success('Job match analysis completed!');

        } catch (error) {
            console.error('Job Match Error:', error);

            let errorMessage = 'Something went wrong while analyzing job match';

            if (error.response?.status === 404) {
                errorMessage = 'Job match API endpoint not found.';
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error occurred while analyzing job match.';
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Invalid request.';
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
                errorMessage = 'Cannot connect to server.';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timed out.';
            } else {
                errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
            }

            dispatch(matchJobFailure(errorMessage));
            toast.error(errorMessage);
        }
    };

    // ========== CHATBOT FUNCTIONS - ✅ FIXED FOR LOADING STATE ISSUES ==========
    
    // ✅ Main chat function - handles both text and file uploads with proper loading state management
    const sendChatMessage = async (message, file = null) => {
        if (!user?._id) {
            toast.error('Please login to use chat');
            return;
        }

        if (!message.trim() && !file) {
            toast.error('Please enter a message or upload a file');
            return;
        }

        try {
            // ✅ FIRST: Reset any stuck loading states
            dispatch(resetChatLoadingState());
            
            // ✅ THEN: Start the chat message process
            dispatch(sendChatMessageStart({ 
                message: message.trim(),
                hasFile: !!file,
                fileName: file?.name || null
            }));

            // If file is being uploaded, show file upload status
            if (file) {
                dispatch(fileUploadStart());
            }

            const apiUrl = API_ENDPOINTS.CHAT.SEND;
            
            console.log('Sending chat message to:', apiUrl);
            console.log('Message data:', { message: message.trim(), user_id: user._id, file: file?.name || 'none' });

            // ✅ Create FormData to match your backend expectations
            const formData = new FormData();
            formData.append('message', message.trim());
            formData.append('user_id', user._id);
            
            // Add file if provided
            if (file) {
                formData.append('file', file);
            }

            const response = await axios.post(apiUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 45000 // 45 seconds for AI processing
            });

            console.log('Chat API Response:', response.data);

            // Handle file upload success
            if (file) {
                dispatch(fileUploadSuccess());
            }

            // Handle different response formats from your backend
            let botResponse = '';
            let fileUploaded = false;

            if (response.data.success) {
                botResponse = response.data.message || 'Message received successfully';
                fileUploaded = response.data.file_uploaded || false;
            } else {
                throw new Error(response.data.error || 'Unexpected response format');
            }

            // ✅ Dispatch success with bot response (this will set loading to false)
            dispatch(sendChatMessageSuccess({
                message: botResponse,
                file_uploaded: fileUploaded
            }));

            // Set connection status
            dispatch(setChatConnectionStatus(true));
            
            return { success: true, response: botResponse };

        } catch (error) {
            console.error('Chat Message Error:', error);

            // Handle file upload failure
            if (file) {
                dispatch(fileUploadFailure(error.response?.data?.message || error.message));
            }

            let errorMessage = 'Failed to send message';

            if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Invalid request format';
            } else if (error.response?.status === 404) {
                errorMessage = 'Chat endpoint not found. Please check your backend.';
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error occurred while processing your message.';
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
                errorMessage = 'Cannot connect to server. Please ensure your backend is running.';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timed out. The AI is taking longer than expected.';
            } else {
                errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
            }

            // ✅ Dispatch failure (this will set loading to false)
            dispatch(sendChatMessageFailure(errorMessage));
            dispatch(setChatConnectionStatus(false));
            
            toast.error(errorMessage);
            
            return { success: false, error: errorMessage };
        }
    };

    // ✅ Clear Chat History
    const clearChatHistoryData = async () => {
        if (!user?._id) {
            toast.error('Please login to clear chat history');
            return;
        }

        try {
            const apiUrl = API_ENDPOINTS.CHAT.CLEAR;
            
            // ✅ Create FormData for consistency with your backend
            const formData = new FormData();
            formData.append('user_id', user._id);

            await axios.post(apiUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 10000
            });

            // ✅ This will clear messages AND reset loading states
            dispatch(clearChatHistory());
            toast.success('Chat history cleared successfully');
            
            return { success: true };

        } catch (error) {
            console.error('Clear Chat History Error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to clear chat history';
            toast.error(errorMessage);
            
            return { success: false, error: errorMessage };
        }
    };

    // ✅ Check Chat Status
    const checkChatStatus = async () => {
        try {
            const apiUrl = API_ENDPOINTS.CHAT.HEALTH;
            
            const response = await axios.get(apiUrl, {
                timeout: 5000
            });

            const isHealthy = response.data.status === 'healthy';
            dispatch(setChatConnectionStatus(isHealthy));

            return { 
                success: true, 
                status: response.data.status || 'connected',
                timestamp: response.data.timestamp || new Date().toISOString()
            };

        } catch (error) {
            console.error('Chat Status Check Error:', error);
            dispatch(setChatConnectionStatus(false));
            return { 
                success: false, 
                status: 'disconnected',
                error: error.message 
            };
        }
    };

    // ✅ Clear Chat Error
    const clearChatErrorData = () => {
        dispatch(clearChatError());
        // ✅ Also reset loading state in case it's stuck
        dispatch(resetChatLoadingState());
    };

    // ✅ Clear File Upload Status
    const clearFileUploadStatusData = () => {
        dispatch(clearFileUploadStatus());
    };

    // ✅ NEW: Reset loading states manually
    const resetLoadingStates = () => {
        dispatch(resetChatLoadingState());
    };

    // ========== CLEAR FUNCTIONS ==========
    const clearCoverLetterData = () => {
        dispatch(clearCoverLetter());
    };

    const clearResumeTipsData = () => {
        dispatch(clearResumeTips());
    };

    const clearJobMatchData = () => {
        dispatch(clearJobMatch());
    };

    const clearAllGenAIData = () => {
        dispatch(clearAllGenAI());
    };

    // ========== RETURN ALL FUNCTIONS AND STATE ==========
    return {
        // Cover Letter Functions
        generateCoverLetter,
        updateCoverLetter,
        coverLetterData: coverLetter,
        isCoverLetterLoading: coverLetter?.loading || false,
        coverLetterError: coverLetter?.error || null,
        clearCoverLetterData,

        // Resume Tips Functions
        getResumeTips,
        resumeTipsData: resumeTips,
        isResumeTipsLoading: resumeTips?.loading || false,
        resumeTipsError: resumeTips?.error || null,
        clearResumeTipsData,

        // Job Match Functions
        matchResumeWithJob,
        jobMatchData: jobMatcher,
        isJobMatchLoading: jobMatcher?.loading || false,
        jobMatchError: jobMatcher?.error || null,
        clearJobMatchData,

        // ✅ UPDATED: Chatbot Functions (with loading state fixes)
        sendChatMessage,
        clearChatHistoryData,
        checkChatStatus,
        clearChatErrorData,
        clearFileUploadStatusData,
        resetLoadingStates,  // ✅ NEW function
        
        // ✅ UPDATED: Chatbot Data (with proper fallbacks)
        chatbotData: chatbot,
        chatMessages: chatbot?.messages || [],
        isChatLoading: chatbot?.loading === true,  // ✅ Explicit boolean check
        chatError: chatbot?.error || null,
        isChatConnected: chatbot?.isConnected || false,
        lastMessageTime: chatbot?.lastMessageTime || null,
        botTyping: chatbot?.botTyping || false,  // ✅ NEW state
        
        // ✅ NEW: File upload status (with proper fallbacks)
        fileUploadStatus: chatbot?.fileUploadStatus || { uploading: false, error: null, success: false },
        isFileUploading: chatbot?.fileUploadStatus?.uploading === true,  // ✅ Explicit boolean check
        fileUploadError: chatbot?.fileUploadStatus?.error || null,

        // Global Functions
        clearAllGenAIData,
        isLoggedIn: !!user?._id
    };
};

export default useGenAI;