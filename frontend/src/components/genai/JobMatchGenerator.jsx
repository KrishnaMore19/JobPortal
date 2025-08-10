import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { 
    Target, 
    TrendingUp, 
    CheckCircle, 
    AlertCircle, 
    Star, 
    Zap,
    Loader2,
    RefreshCw,
    Award,
    Trophy,
    Brain,
    Users,
    Eye,
    ThumbsUp,
    ThumbsDown,
    BookOpen,
    Briefcase
} from 'lucide-react';
import useGenAI from '@/hooks/useGenAI';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

const JobMatchGenerator = ({ jobId }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Get data from custom hook
    const {
        matchResumeWithJob,
        jobMatchData,
        isJobMatchLoading,
        jobMatchError,
        clearJobMatchData,
        isLoggedIn
    } = useGenAI();

    // Get user and job data from Redux
    const { user } = useSelector((store) => store.auth);
    const { singleJob } = useSelector((store) => store.job);

    // Safely get match data with defensive programming
    const getMatchData = () => {
        if (!jobMatchData) {
            return {
                matchScore: null,
                matchingSkills: [],
                missingSkills: [],
                recommendations: []
            };
        }

        return {
            matchScore: jobMatchData.matchScore || null,
            matchingSkills: Array.isArray(jobMatchData.matchingSkills) ? jobMatchData.matchingSkills : [],
            missingSkills: Array.isArray(jobMatchData.missingSkills) ? jobMatchData.missingSkills : [],
            recommendations: Array.isArray(jobMatchData.recommendations) ? jobMatchData.recommendations : []
        };
    };

    const { matchScore, matchingSkills, missingSkills, recommendations } = getMatchData();

    // Handle generate job match analysis
    const handleGenerateJobMatch = async () => {
        if (!isLoggedIn) {
            toast.error('Please login to check job match');
            return;
        }
        
        if (!jobId) {
            toast.error('Job ID not found');
            return;
        }
        
        setIsDialogOpen(true);
        await matchResumeWithJob(jobId);
    };

    // Handle dialog close
    const handleDialogClose = () => {
        setIsDialogOpen(false);
        clearJobMatchData();
    };

    // Get match score color and status
    const getMatchStatus = (score) => {
        if (score >= 80) {
            return {
                color: 'text-green-600',
                bgColor: 'bg-green-100',
                borderColor: 'border-green-300',
                progressColor: 'bg-green-500',
                status: 'Excellent Match',
                icon: <Trophy className="h-5 w-5 text-green-600" />,
                description: 'You are a strong candidate for this position!'
            };
        } else if (score >= 60) {
            return {
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-100',
                borderColor: 'border-yellow-300',
                progressColor: 'bg-yellow-500',
                status: 'Good Match',
                icon: <Star className="h-5 w-5 text-yellow-600" />,
                description: 'You meet most requirements for this role.'
            };
        } else if (score >= 40) {
            return {
                color: 'text-orange-600',
                bgColor: 'bg-orange-100',
                borderColor: 'border-orange-300',
                progressColor: 'bg-orange-500',
                status: 'Partial Match',
                icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
                description: 'Some gaps exist, but you have potential.'
            };
        } else {
            return {
                color: 'text-red-600',
                bgColor: 'bg-red-100',
                borderColor: 'border-red-300',
                progressColor: 'bg-red-500',
                status: 'Low Match',
                icon: <AlertCircle className="h-5 w-5 text-red-600" />,
                description: 'Consider developing more relevant skills.'
            };
        }
    };

    const matchStatus = matchScore !== null ? getMatchStatus(matchScore) : null;

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    onClick={handleGenerateJobMatch}
                    className="bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg transition-all duration-300 transform hover:scale-105"
                    disabled={!isLoggedIn}
                >
                    <Target className="mr-2 h-4 w-4" />
                    Check Job Match
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-5xl w-[95vw] h-[95vh] max-h-[95vh] bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 flex flex-col">
                <DialogHeader className="pb-4 border-b border-purple-200 flex-shrink-0">
                    <DialogTitle className="text-2xl font-bold text-purple-800 flex items-center">
                        <Target className="mr-3 h-6 w-6 text-purple-600" />
                        Job Match Analysis
                        <Star className="ml-2 h-5 w-5 text-yellow-500" />
                    </DialogTitle>
                    <DialogDescription className="text-purple-600">
                        AI-powered analysis of how well your profile matches this job opportunity.
                    </DialogDescription>
                    
                    {/* Job Info Header */}
                    <div className="mt-4 p-4 bg-white/80 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Briefcase className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-purple-800">{singleJob?.title}</h3>
                                    <p className="text-sm text-purple-600">{singleJob?.company?.name}</p>
                                </div>
                            </div>
                            {matchScore !== null && (
                                <div className="flex items-center gap-2">
                                    {matchStatus?.icon}
                                    <Badge className={`${matchStatus?.bgColor} ${matchStatus?.color} ${matchStatus?.borderColor} font-semibold`}>
                                        {matchScore}% Match
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 py-4">
                    {/* Loading State */}
                    {isJobMatchLoading && (
                        <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-4" />
                                <Target className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-yellow-500 animate-pulse" />
                            </div>
                            <h3 className="text-lg font-semibold text-purple-800 mb-2">
                                Analyzing Job Match...
                            </h3>
                            <p className="text-purple-600 text-sm">
                                AI is comparing your profile with job requirements
                            </p>
                            <div className="mt-4 flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 animate-bounce" />
                                <Star className="h-4 w-4 text-yellow-500 animate-bounce delay-100" />
                                <Star className="h-4 w-4 text-yellow-500 animate-bounce delay-200" />
                            </div>
                        </div>
                    )}

                    {/* Match Analysis Results */}
                    {matchScore !== null && !isJobMatchLoading && (
                        <div className="space-y-6 h-full">
                            {/* Overall Match Score Card */}
                            <div className="bg-white/90 border border-purple-200 rounded-lg p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-purple-800 flex items-center">
                                        <Award className="mr-2 h-6 w-6 text-purple-600" />
                                        Match Score
                                        <Star className="ml-2 h-5 w-5 text-yellow-500" />
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        {matchStatus?.icon}
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold ${matchStatus?.color}`}>
                                                {matchScore}%
                                            </div>
                                            <div className="text-sm text-purple-600 flex items-center gap-1">
                                                <Star className="h-3 w-3 text-yellow-500" />
                                                {matchStatus?.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                                    <div 
                                        className={`h-4 rounded-full transition-all duration-1000 ${matchStatus?.progressColor}`}
                                        style={{ width: `${matchScore}%` }}
                                    ></div>
                                </div>
                                
                                <p className="text-purple-700 text-sm">
                                    {matchStatus?.description}
                                </p>
                            </div>

                            {/* Skills Analysis */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Matching Skills */}
                                <div className="bg-white/90 border border-green-200 rounded-lg p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-green-800 flex items-center mb-4">
                                        <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                                        Matching Skills
                                        <Badge className="ml-2 bg-green-100 text-green-700">
                                            {matchingSkills.length}
                                        </Badge>
                                    </h3>
                                    
                                    {matchingSkills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {matchingSkills.map((skill, index) => (
                                                <Badge 
                                                    key={index}
                                                    className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1"
                                                >
                                                    <ThumbsUp className="h-3 w-3" />
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-green-600 text-sm">No matching skills identified.</p>
                                    )}
                                </div>

                                {/* Missing Skills */}
                                <div className="bg-white/90 border border-orange-200 rounded-lg p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-orange-800 flex items-center mb-4">
                                        <AlertCircle className="mr-2 h-5 w-5 text-orange-600" />
                                        Skills to Develop
                                        <Badge className="ml-2 bg-orange-100 text-orange-700">
                                            {missingSkills.length}
                                        </Badge>
                                    </h3>
                                    
                                    {missingSkills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {missingSkills.map((skill, index) => (
                                                <Badge 
                                                    key={index}
                                                    className="bg-orange-100 text-orange-800 border-orange-300 flex items-center gap-1"
                                                >
                                                    <BookOpen className="h-3 w-3" />
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-orange-600 text-sm">No missing skills identified.</p>
                                    )}
                                </div>
                            </div>

                            {/* Recommendations */}
                            {recommendations.length > 0 && (
                                <div className="bg-white/90 border border-purple-200 rounded-lg p-6 shadow-sm">
                                    <h3 className="text-xl font-semibold text-purple-800 flex items-center mb-4">
                                        <Brain className="mr-2 h-6 w-6 text-purple-600" />
                                        AI Recommendations
                                        <Star className="ml-2 h-5 w-5 text-yellow-500" />
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        {recommendations.map((recommendation, index) => (
                                            <div 
                                                key={index}
                                                className="border border-purple-100 rounded-lg p-4 hover:shadow-md transition-shadow duration-300 bg-white/50"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-purple-600 font-semibold text-xs">
                                                            {index + 1}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 leading-relaxed">
                                                        {recommendation.suggestion || recommendation.description || recommendation}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 pt-4 border-t border-purple-200">
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => matchResumeWithJob(jobId)}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                        disabled={isJobMatchLoading}
                                    >
                                        {isJobMatchLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                        )}
                                        Re-analyze Match
                                    </Button>
                                    <Button
                                        onClick={handleDialogClose}
                                        variant="outline"
                                        className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
                                    >
                                        Close
                                    </Button>
                                </div>
                                
                                <div className="text-center text-sm text-purple-600 bg-purple-50 p-3 rounded-lg flex items-center justify-center gap-2">
                                    <Target className="h-4 w-4 text-purple-500" />
                                    <strong>Tip:</strong> Focus on developing the missing skills to improve your match score!
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {jobMatchError && !isJobMatchLoading && (
                        <div className="text-center py-12 h-full flex flex-col justify-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-red-800 mb-2">
                                Failed to Analyze Job Match
                            </h3>
                            <p className="text-red-600 text-sm mb-4 px-4">
                                {jobMatchError}
                            </p>
                            <Button
                                onClick={() => matchResumeWithJob(jobId)}
                                className="bg-purple-600 hover:bg-purple-700 text-white mx-auto"
                                disabled={isJobMatchLoading}
                            >
                                {isJobMatchLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Initial State */}
                    {matchScore === null && !isJobMatchLoading && !jobMatchError && (
                        <div className="text-center py-12 h-full flex flex-col justify-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                                <Target className="h-8 w-8 text-purple-600" />
                                <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center justify-center gap-2">
                                Ready to Analyze Job Match
                                <Star className="h-5 w-5 text-yellow-500" />
                            </h3>
                            <p className="text-purple-600 text-sm mb-4 px-4">
                                Our AI will compare your profile with this job's requirements and provide a detailed match analysis.
                            </p>
                            <Button
                                onClick={() => matchResumeWithJob(jobId)}
                                className="bg-purple-600 hover:bg-purple-700 text-white mx-auto"
                                disabled={isJobMatchLoading}
                            >
                                {isJobMatchLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Target className="mr-2 h-4 w-4" />
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

export default JobMatchGenerator;