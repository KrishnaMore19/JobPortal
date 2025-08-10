import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Sparkles, Download, Edit3, Loader2, Copy, CheckCircle } from 'lucide-react';
import useGenAI from '@/hooks/useGenAI';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

const CoverLetterGenerator = ({ jobId }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    // NEW: Local state to track the current content (edited or original)
    const [currentContent, setCurrentContent] = useState('');

    // Get data from custom hook
    const {
        generateCoverLetter,
        coverLetterData,
        isCoverLetterLoading,
        clearCoverLetterData,
        isLoggedIn,
        // ADD: If your hook has an update function, use it
        updateCoverLetter // This might not exist in your hook yet
    } = useGenAI();

    // Get job and user data from Redux
    const { singleJob } = useSelector((store) => store.job);
    const { user } = useSelector((store) => store.auth);

    // Handle generate cover letter
    const handleGenerate = async () => {
        if (!isLoggedIn) {
            toast.error('Please login to generate cover letter');
            return;
        }
        
        setIsDialogOpen(true);
        const result = await generateCoverLetter(jobId);
        // Set the current content when generation is complete
        if (result && result.content) {
            setCurrentContent(result.content);
        }
    };

    // Handle edit mode
    const handleEdit = () => {
        setIsEditing(true);
        // Use current content or fallback to coverLetterData.content
        const contentToEdit = currentContent || coverLetterData.content || '';
        setEditedContent(contentToEdit);
    };

    // FIXED: Handle save edited content
    const handleSaveEdit = async () => {
        try {
            // Update the local current content immediately
            setCurrentContent(editedContent);
            setIsEditing(false);
            
            // OPTION 1: If you have an update function in your hook
            if (updateCoverLetter) {
                await updateCoverLetter(jobId, editedContent);
            }
            
            // OPTION 2: If you need to save to backend, make API call here
            // await fetch('/api/cover-letter/update', {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ jobId, content: editedContent })
            // });
            
            toast.success('Cover letter updated successfully!');
        } catch (error) {
            console.error('Error saving cover letter:', error);
            toast.error('Failed to save changes');
            // Revert on error
            setIsEditing(true);
        }
    };

    // FIXED: Handle copy to clipboard
    const handleCopy = async () => {
        // Use currentContent if available, otherwise fall back to original
        const contentToCopy = isEditing 
            ? editedContent 
            : (currentContent || coverLetterData.content);
            
        try {
            await navigator.clipboard.writeText(contentToCopy);
            setIsCopied(true);
            toast.success('Cover letter copied to clipboard!');
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy to clipboard');
        }
    };

    // FIXED: Handle download
    const handleDownload = () => {
        const contentToDownload = isEditing 
            ? editedContent 
            : (currentContent || coverLetterData.content);
            
        const blob = new Blob([contentToDownload], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cover-letter-${singleJob?.title || 'job'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Cover letter downloaded!');
    };

    // Handle dialog close
    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setIsEditing(false);
        setCurrentContent('');
        clearCoverLetterData();
    };

    // FIXED: Get the display content
    const getDisplayContent = () => {
        if (isEditing) return editedContent;
        return currentContent || coverLetterData.content || '';
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    onClick={handleGenerate}
                    className="bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-lg transition-all duration-300 transform hover:scale-105"
                    disabled={!isLoggedIn}
                >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Cover Letter
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl w-[95vw] h-[95vh] max-h-[95vh] bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 flex flex-col">
                <DialogHeader className="pb-4 border-b border-violet-200 flex-shrink-0">
                    <DialogTitle className="text-2xl font-bold text-violet-800 flex items-center">
                        <FileText className="mr-3 h-6 w-6 text-violet-600" />
                        AI Cover Letter Generator
                    </DialogTitle>
                    <DialogDescription className="text-violet-600">
                        Generate a personalized cover letter based on your resume and the job requirements.
                    </DialogDescription>
                    
                    {/* Job Info Header */}
                    <div className="mt-4 p-4 bg-white/80 rounded-lg border border-violet-200">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-violet-800 truncate">{singleJob?.title}</h3>
                                <p className="text-sm text-violet-600 truncate">{singleJob?.company?.name}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Badge className="bg-violet-100 text-violet-700 border-violet-300">
                                    {singleJob?.location}
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                                    {singleJob?.salary} LPA
                                </Badge>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 py-4">
                    {/* Loading State */}
                    {isCoverLetterLoading && (
                        <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-violet-200 rounded-full animate-spin border-t-violet-600 mb-4"></div>
                                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-violet-600 animate-pulse" />
                            </div>
                            <h3 className="text-lg font-semibold text-violet-800 mb-2">
                                Crafting Your Perfect Cover Letter...
                            </h3>
                            <p className="text-violet-600 text-sm">
                                AI is analyzing the job requirements and your profile
                            </p>
                        </div>
                    )}

                    {/* Generated Content */}
                    {(coverLetterData.content || currentContent) && !isCoverLetterLoading && (
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="flex items-center justify-between flex-shrink-0">
                                <h3 className="text-lg font-semibold text-violet-800">
                                    Your AI-Generated Cover Letter
                                    {currentContent && currentContent !== coverLetterData.content && (
                                        <Badge className="ml-2 bg-green-100 text-green-700 border-green-300">
                                            Modified
                                        </Badge>
                                    )}
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleCopy}
                                        size="sm"
                                        variant="outline"
                                        className="border-violet-300 text-violet-600 hover:bg-violet-50"
                                    >
                                        {isCopied ? (
                                            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4 mr-1" />
                                        )}
                                        {isCopied ? 'Copied!' : 'Copy'}
                                    </Button>
                                </div>
                            </div>

                            {/* Content Display/Edit Area */}
                            <div className="bg-white/90 border border-violet-200 rounded-lg p-4 shadow-sm flex-1 min-h-0">
                                {isEditing ? (
                                    <textarea
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        className="w-full h-full min-h-[300px] p-4 border border-violet-300 rounded-lg resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                                        placeholder="Edit your cover letter..."
                                    />
                                ) : (
                                    <div className="h-full overflow-y-auto">
                                        <div className="prose prose-violet max-w-none">
                                            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
                                                {getDisplayContent()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 pt-4 border-t border-violet-200 flex-shrink-0">
                                <div className="flex gap-3">
                                    {isEditing ? (
                                        <>
                                            <Button
                                                onClick={handleSaveEdit}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditedContent('');
                                                }}
                                                variant="outline"
                                                className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={handleEdit}
                                                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                                            >
                                                <Edit3 className="mr-2 h-4 w-4" />
                                                Edit & Customize
                                            </Button>
                                            <Button
                                                onClick={handleDownload}
                                                variant="outline"
                                                className="flex-1 border-violet-300 text-violet-600 hover:bg-violet-50"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* Apply Button */}
                                <Button
                                    onClick={handleDialogClose}
                                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg text-lg py-6"
                                >
                                    Ready to Apply with This Cover Letter
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {coverLetterData.error && !isCoverLetterLoading && (
                        <div className="text-center py-12 h-full flex flex-col justify-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-red-800 mb-2">
                                Failed to Generate Cover Letter
                            </h3>
                            <p className="text-red-600 text-sm mb-4 px-4">
                                {coverLetterData.error}
                            </p>
                            <Button
                                onClick={() => generateCoverLetter(jobId)}
                                className="bg-violet-600 hover:bg-violet-700 text-white mx-auto"
                            >
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Initial State */}
                    {!coverLetterData.content && !currentContent && !isCoverLetterLoading && !coverLetterData.error && (
                        <div className="text-center py-12 h-full flex flex-col justify-center">
                            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="h-8 w-8 text-violet-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-violet-800 mb-2">
                                Ready to Generate Your Cover Letter
                            </h3>
                            <p className="text-violet-600 text-sm mb-4 px-4">
                                Click the button below to create a personalized cover letter for this position.
                            </p>
                            <Button
                                onClick={() => generateCoverLetter(jobId)}
                                className="bg-violet-600 hover:bg-violet-700 text-white mx-auto"
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Cover Letter
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CoverLetterGenerator;