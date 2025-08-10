import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
    Brain, 
    Target, 
    TrendingUp, 
    CheckCircle, 
    AlertCircle, 
    Lightbulb, 
    Star, 
    FileText,
    Loader2,
    RefreshCw,
    Award,
    Zap,
    Trophy
} from 'lucide-react';
import useGenAI from '@/hooks/useGenAI';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

const ResumeTipsGenerator = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Get data from custom hook
    const {
        getResumeTips,
        resumeTipsData,
        isResumeTipsLoading,
        resumeTipsError,
        clearResumeTipsData,
        isLoggedIn
    } = useGenAI();

    // Get user data from Redux
    const { user } = useSelector((store) => store.auth);

    // Safely get tips data with defensive programming
    const getTipsData = () => {
        // Return empty array if no data or tips is not an array
        if (!resumeTipsData || !resumeTipsData.tips) {
            return [];
        }
        
        // If tips is already an array, return it
        if (Array.isArray(resumeTipsData.tips)) {
            return resumeTipsData.tips;
        }
        
        // If tips is a string, try to parse it
        if (typeof resumeTipsData.tips === 'string') {
            try {
                const parsed = JSON.parse(resumeTipsData.tips);
                return Array.isArray(parsed) ? parsed : [{ suggestion: resumeTipsData.tips, category: 'General' }];
            } catch (e) {
                // If not JSON, split by common delimiters
                return resumeTipsData.tips
                    .split(/\n\n|\n-|\n\d+\.|\n•/)
                    .map((tip, index) => ({
                        id: index + 1,
                        category: 'General',
                        suggestion: tip.trim().replace(/^\d+\.\s*|\-\s*|•\s*/, ''),
                        priority: 'medium'
                    }))
                    .filter(tip => tip.suggestion.length > 0);
            }
        }
        
        // If tips is an object, try to extract relevant fields
        if (typeof resumeTipsData.tips === 'object') {
            return [resumeTipsData.tips];
        }
        
        // Fallback to empty array
        return [];
    };

    // Safe way to get tips array
    const tipsArray = getTipsData();

    // Handle generate resume tips
    const handleGenerateResumeTips = async () => {
        if (!isLoggedIn) {
            toast.error('Please login to get resume tips');
            return;
        }
        
        setIsDialogOpen(true);
        await getResumeTips();
    };

    // Handle dialog close
    const handleDialogClose = () => {
        setIsDialogOpen(false);
        clearResumeTipsData();
    };

    // Get score color based on score value
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-100 border-green-300';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
        return 'text-red-600 bg-red-100 border-red-300';
    };

    // Get score icon based on score value
    const getScoreIcon = (score) => {
        if (score >= 80) return <Trophy className="h-5 w-5 text-green-600" />;
        if (score >= 60) return <Star className="h-5 w-5 text-yellow-600" />;
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    };

    // Render tip priority badge
    const getPriorityBadge = (priority) => {
        const priorityStyles = {
            high: 'bg-red-100 text-red-700 border-red-300',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            low: 'bg-green-100 text-green-700 border-green-300'
        };
        
        return (
            <Badge className={priorityStyles[priority?.toLowerCase()] || priorityStyles.medium}>
                <Star className="h-3 w-3 mr-1" />
                {priority || 'Medium'} Priority
            </Badge>
        );
    };

    // Get category icon
    const getCategoryIcon = (category) => {
        const icons = {
            'Skills': <Zap className="h-4 w-4" />,
            'Experience': <Trophy className="h-4 w-4" />,
            'Education': <Star className="h-4 w-4" />,
            'General': <Lightbulb className="h-4 w-4" />
        };
        return icons[category] || <Lightbulb className="h-4 w-4" />;
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    onClick={handleGenerateResumeTips}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg transition-all duration-300 transform hover:scale-105"
                    disabled={!isLoggedIn}
                >
                    <Brain className="mr-2 h-4 w-4" />
                    Get Resume Tips
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-5xl w-[95vw] h-[95vh] max-h-[95vh] bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 flex flex-col">
                <DialogHeader className="pb-4 border-b border-blue-200 flex-shrink-0">
                    <DialogTitle className="text-2xl font-bold text-blue-800 flex items-center">
                        <Brain className="mr-3 h-6 w-6 text-blue-600" />
                        AI Resume Analysis & Tips
                        <Star className="ml-2 h-5 w-5 text-yellow-500" />
                    </DialogTitle>
                    <DialogDescription className="text-blue-600">
                        Get personalized recommendations to improve your resume and increase your chances of landing interviews.
                    </DialogDescription>
                    
                    {/* User Info Header */}
                    <div className="mt-4 p-4 bg-white/80 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-blue-800">{user?.fullname}</h3>
                                    <p className="text-sm text-blue-600">{user?.profile?.bio || 'Resume Analysis'}</p>
                                </div>
                            </div>
                            {resumeTipsData?.overallScore && (
                                <div className="flex items-center gap-2">
                                    {getScoreIcon(resumeTipsData.overallScore)}
                                    <Badge className={`${getScoreColor(resumeTipsData.overallScore)} font-semibold`}>
                                        Score: {resumeTipsData.overallScore}/100
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 py-4">
                    {/* Loading State */}
                    {isResumeTipsLoading && (
                        <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                                <Star className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-yellow-500 animate-pulse" />
                            </div>
                            <h3 className="text-lg font-semibold text-blue-800 mb-2">
                                Analyzing Your Resume...
                            </h3>
                            <p className="text-blue-600 text-sm">
                                AI is reviewing your profile and generating personalized recommendations
                            </p>
                            <div className="mt-4 flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 animate-bounce" />
                                <Star className="h-4 w-4 text-yellow-500 animate-bounce delay-100" />
                                <Star className="h-4 w-4 text-yellow-500 animate-bounce delay-200" />
                            </div>
                        </div>
                    )}

                    {/* Generated Tips Content */}
                    {tipsArray.length > 0 && !isResumeTipsLoading && (
                        <div className="space-y-6 h-full">
                            {/* Overall Score Card */}
                            {resumeTipsData?.overallScore && (
                                <div className="bg-white/90 border border-blue-200 rounded-lg p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-semibold text-blue-800 flex items-center">
                                            <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
                                            Overall Resume Score
                                            <Star className="ml-2 h-5 w-5 text-yellow-500" />
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            {getScoreIcon(resumeTipsData.overallScore)}
                                            <div className="text-right">
                                                <div className={`text-2xl font-bold ${getScoreColor(resumeTipsData.overallScore).split(' ')[0]}`}>
                                                    {resumeTipsData.overallScore}/100
                                                </div>
                                                <div className="text-sm text-blue-600 flex items-center gap-1">
                                                    {resumeTipsData.overallScore >= 80 ? (
                                                        <>
                                                            <Star className="h-3 w-3 text-yellow-500" />
                                                            Excellent
                                                        </>
                                                    ) : resumeTipsData.overallScore >= 60 ? (
                                                        <>
                                                            <Star className="h-3 w-3 text-yellow-500" />
                                                            Good
                                                        </>
                                                    ) : (
                                                        'Needs Improvement'
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Score Progress Bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div 
                                            className={`h-3 rounded-full transition-all duration-1000 ${
                                                resumeTipsData.overallScore >= 80 ? 'bg-green-500' :
                                                resumeTipsData.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${resumeTipsData.overallScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Tips Section */}
                            <div className="bg-white/90 border border-blue-200 rounded-lg p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-blue-800 flex items-center">
                                        <Lightbulb className="mr-2 h-6 w-6 text-blue-600" />
                                        Personalized Recommendations
                                        <Star className="ml-2 h-5 w-5 text-yellow-500" />
                                    </h3>
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                        <Star className="h-3 w-3 mr-1" />
                                        {tipsArray.length} Tips Found
                                    </Badge>
                                </div>

                                <div className="grid gap-4">
                                    {tipsArray.map((tip, index) => (
                                        <div 
                                            key={tip.id || index}
                                            className="border border-blue-100 rounded-lg p-4 hover:shadow-md transition-shadow duration-300 bg-white/50"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-blue-600 font-semibold text-sm">
                                                            {index + 1}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-semibold text-blue-800 text-lg flex items-center gap-2">
                                                        {getCategoryIcon(tip.category)}
                                                        {tip.category || `Tip ${index + 1}`}
                                                    </h4>
                                                </div>
                                                
                                                {tip.priority && getPriorityBadge(tip.priority)}
                                            </div>
                                            
                                            <div className="ml-11 space-y-2">
                                                <p className="text-gray-700 leading-relaxed">
                                                    {tip.suggestion || tip.description || tip.content || (typeof tip === 'string' ? tip : 'No suggestion available')}
                                                </p>
                                                
                                                {tip.examples && Array.isArray(tip.examples) && tip.examples.length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                                                            <Star className="h-3 w-3" />
                                                            Examples:
                                                        </p>
                                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                                                            {tip.examples.map((example, exIndex) => (
                                                                <li key={exIndex}>{example}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                
                                                {tip.impact && (
                                                    <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                                                        <p className="text-sm text-green-700 flex items-center gap-1">
                                                            <TrendingUp className="h-4 w-4" />
                                                            <strong>Impact:</strong> {tip.impact}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 pt-4 border-t border-blue-200">
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => getResumeTips()}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                        disabled={isResumeTipsLoading}
                                    >
                                        {isResumeTipsLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                        )}
                                        Refresh Analysis
                                    </Button>
                                    <Button
                                        onClick={handleDialogClose}
                                        variant="outline"
                                        className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                                    >
                                        Close
                                    </Button>
                                </div>
                                
                                <div className="text-center text-sm text-blue-600 bg-blue-50 p-3 rounded-lg flex items-center justify-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <strong>Pro Tip:</strong> Implement these suggestions one by one and track your application success rate!
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {(resumeTipsError || (!tipsArray.length && resumeTipsData && !isResumeTipsLoading)) && (
                        <div className="text-center py-12 h-full flex flex-col justify-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-red-800 mb-2">
                                Failed to Analyze Resume
                            </h3>
                            <p className="text-red-600 text-sm mb-4 px-4">
                                {resumeTipsError || 'No tips could be generated. Please check your profile data.'}
                            </p>
                            <Button
                                onClick={() => getResumeTips()}
                                className="bg-blue-600 hover:bg-blue-700 text-white mx-auto"
                                disabled={isResumeTipsLoading}
                            >
                                {isResumeTipsLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Initial State */}
                    {!tipsArray.length && !isResumeTipsLoading && !resumeTipsError && !resumeTipsData && (
                        <div className="text-center py-12 h-full flex flex-col justify-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                                <Brain className="h-8 w-8 text-blue-600" />
                                <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center justify-center gap-2">
                                Ready to Analyze Your Resume
                                <Star className="h-5 w-5 text-yellow-500" />
                            </h3>
                            <p className="text-blue-600 text-sm mb-4 px-4">
                                Our AI will review your profile and provide personalized recommendations to improve your resume.
                            </p>
                            <Button
                                onClick={() => getResumeTips()}
                                className="bg-blue-600 hover:bg-blue-700 text-white mx-auto"
                                disabled={isResumeTipsLoading}
                            >
                                {isResumeTipsLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Brain className="mr-2 h-4 w-4" />
                                )}
                                Start Analysis
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ResumeTipsGenerator;