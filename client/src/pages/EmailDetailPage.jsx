// src/pages/EmailDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    emailsAPI,
    aiAPI,
    joinEmailRoom,
    leaveEmailRoom,
    subscribeSocketEvent,
    getStatusColor,
    getPriorityColor
} from '../services/api';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    ArrowLeft,
    Mail,
    User,
    Clock,
    AlertCircle,
    CheckCircle,
    Send,
    Edit,
    Bot,
    RefreshCw,
    Download,
    Printer,
    Forward,
    Reply,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';
import { toast } from 'sonner';

const EmailDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [editedResponse, setEditedResponse] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (id) {
            fetchEmail();
        }
    }, [id]);

    useEffect(() => {
        if (!id) {
            return undefined;
        }

        joinEmailRoom(id);

        const handleEmailUpdate = (data) => {
            const updatedEmailId = data?.data?.emailId || data?.emailId || data?.email?._id;
            if (updatedEmailId === id) {
                fetchEmail(); // Refresh when this email updates
            }
        };

        const unsubscribe = subscribeSocketEvent('email:updated', handleEmailUpdate, localStorage.getItem('token'));

        return () => {
            unsubscribe();
            leaveEmailRoom(id);
        };
    }, [id]);

    const fetchEmail = async () => {
        try {
            setLoading(true);
            const response = await emailsAPI.getEmail(id);
            setEmail(response.data.email);

            // If email has draft, use it
            if (response.data.email.draftText) {
                setEditedResponse(response.data.email.draftText);
            }

            // Auto-generate AI response for NEW emails
            if (response.data.email.status === 'NEW' || !response.data.email.draftText) {
                generateAIResponse();
            }
        } catch (error) {
            toast.error('Failed to load email');
            console.error('Error fetching email:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateAIResponse = async () => {
        try {
            setAiLoading(true);

            // Get AI analysis
            const analysisRes = await aiAPI.analyzeEmail(id);
            setAiAnalysis(analysisRes.data);

            // Generate reply
            const replyRes = await aiAPI.generateReply(id, 'professional');
            const aiDraft = replyRes.data.draft;

            setAiResponse(aiDraft);
            setEditedResponse(aiDraft);

            // Auto-save as draft
            await emailsAPI.updateDraft(id, {
                draftText: aiDraft,
                category: analysisRes.data.category
            });

            toast.success('AI response generated and saved as draft');
        } catch (error) {
            toast.error('Failed to generate AI response');
            console.error('AI error:', error);
        } finally {
            setAiLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        try {
            await emailsAPI.updateDraft(id, {
                draftText: editedResponse,
                category: email.category
            });
            toast.success('Draft saved successfully');
            setIsEditing(false);
            fetchEmail(); // Refresh email data
        } catch (error) {
            toast.error('Failed to save draft');
        }
    };

    const handleApprove = async () => {
        try {
            await emailsAPI.approveEmail(id);
            toast.success('Email approved for sending');
            fetchEmail();
        } catch (error) {
            toast.error('Failed to approve email');
        }
    };

    const handleSend = async () => {
        try {
            setSending(true);
            await emailsAPI.sendEmail(id);
            toast.success('Email queued for sending');
            fetchEmail();
        } catch (error) {
            toast.error('Failed to send email');
        } finally {
            setSending(false);
        }
    };

    const handleReply = async () => {
        navigate(`/app/email/${id}/reply`);
    };

    const handleForward = async () => {
        navigate(`/app/email/${id}/forward`);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderTextWithLinks = (text) => {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
        const lines = String(text).split('\n');

        return lines.map((line, lineIndex) => {
            const parts = line.split(urlRegex);
            return (
                <React.Fragment key={`line-${lineIndex}`}>
                    {parts.map((part, partIndex) => {
                        const isUrl = urlRegex.test(part);
                        urlRegex.lastIndex = 0;

                        if (!isUrl) {
                            return <React.Fragment key={`part-${lineIndex}-${partIndex}`}>{part}</React.Fragment>;
                        }

                        const href = part.startsWith('http') ? part : `https://${part}`;
                        return (
                            <a
                                key={`part-${lineIndex}-${partIndex}`}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline break-all hover:text-blue-800"
                            >
                                {part}
                            </a>
                        );
                    })}
                    {lineIndex < lines.length - 1 && <br />}
                </React.Fragment>
            );
        });
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading email details...</p>
            </div>
        );
    }

    if (!email) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                        <h3 className="mt-4 text-lg font-semibold">Email not found</h3>
                        <Button className="mt-4" onClick={() => navigate('/app/inbox')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Inbox
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => navigate('/app/inbox')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Inbox
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Email Details</h1>
                        <p className="text-gray-600">Manage and respond to this email</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleReply}>
                        <Reply className="h-4 w-4 mr-2" />
                        Reply
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleForward}>
                        <Forward className="h-4 w-4 mr-2" />
                        Forward
                    </Button>
                    <Button variant="outline" size="sm">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Email Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Email Header Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl break-words">{email.subject || '(No Subject)'}</CardTitle>
                                    <CardDescription className="mt-2">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            <span className="font-medium">From:</span>
                                            <span className="break-all">{email.fromAddress}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <User className="h-4 w-4" />
                                            <span className="font-medium">To:</span>
                                            <span className="break-all">{email.toAddress}</span>
                                        </div>
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <Badge className={`${getStatusColor(email.status)} text-sm`}>
                                        {email.status}
                                    </Badge>
                                    <div className="text-sm text-gray-500 mt-1">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        {formatDate(email.createdAt)}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {/* Metadata */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Category</p>
                                    <Badge variant="outline" className="mt-1">
                                        {email.category || 'Uncategorized'}
                                    </Badge>
                                    {email.confidence && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {Math.round(email.confidence * 100)}% confident
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Priority</p>
                                    <Badge
                                        variant="outline"
                                        className={`mt-1 ${getPriorityColor(email.priority)}`}
                                    >
                                        {email.priority || 'MEDIUM'}
                                    </Badge>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Sentiment</p>
                                    <Badge
                                        variant="outline"
                                        className={`mt-1 ${email.sentiment === 'POSITIVE'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : email.sentiment === 'NEGATIVE'
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}
                                    >
                                        {(email.sentiment || 'NEUTRAL').toLowerCase()}
                                    </Badge>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Assigned To</p>
                                    <p className="font-medium mt-1">
                                        {email.assignedUserId?.name || 'Unassigned'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Response Time</p>
                                    <p className="font-medium mt-1">
                                        {email.sentAt ? 'Responded' : 'Pending'}
                                    </p>
                                </div>
                            </div>

                            {/* Email Body */}
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <div className="prose max-w-none">
                                    <div className="whitespace-pre-wrap break-words">
                                        {renderTextWithLinks(email.bodyText)}
                                    </div>
                                </div>

                                {email.attachments?.length > 0 && (
                                    <div className="mt-6 pt-6 border-t">
                                        <h4 className="font-medium mb-3">Attachments</h4>
                                        <div className="space-y-2">
                                            {email.attachments.map((att, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-white border rounded">
                                                    <div className="flex items-center">
                                                        <Download className="h-4 w-4 mr-2 text-gray-500" />
                                                        <span>{att.filename}</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm">
                                                        Download
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Response & Draft Editor */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Response Draft</CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={generateAIResponse}
                                        disabled={aiLoading}
                                    >
                                        {aiLoading ? (
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Bot className="h-4 w-4 mr-2" />
                                        )}
                                        Regenerate AI Response
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(!isEditing)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        {isEditing ? 'Preview' : 'Edit'}
                                    </Button>
                                </div>
                            </div>
                            <CardDescription>
                                AI-generated response ready for review and editing
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            {aiAnalysis && (
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-blue-700">Category</p>
                                            <p className="font-medium">{aiAnalysis.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-700">Confidence</p>
                                            <p className="font-medium">{Math.round(aiAnalysis.confidence * 100)}%</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-700">Sentiment</p>
                                            <p className="font-medium">{aiAnalysis.sentiment}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-700">Urgency</p>
                                            <p className="font-medium">{aiAnalysis.urgency}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isEditing ? (
                                <Textarea
                                    value={editedResponse}
                                    onChange={(e) => setEditedResponse(e.target.value)}
                                    className="min-h-[300px] font-mono"
                                    placeholder="Edit the response draft here..."
                                />
                            ) : (
                                <div className="border rounded-lg p-4 bg-white">
                                    <div className="prose max-w-none">
                                        <p className="whitespace-pre-wrap">{editedResponse}</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                                <Bot className="h-4 w-4" />
                                <span>AI-generated response. Review and edit before sending.</span>
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-between">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleSaveDraft}
                                    disabled={!editedResponse.trim()}
                                >
                                    Save as Draft
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleApprove}
                                    disabled={email.status === 'APPROVED' || email.status === 'SENT'}
                                >
                                    {email.status === 'APPROVED' ? 'Approved' : 'Approve'}
                                </Button>
                            </div>

                            <Button
                                onClick={handleSend}
                                disabled={email.status !== 'APPROVED' || sending}
                                className="gap-2"
                            >
                                {sending ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                {sending ? 'Sending...' : 'Send Email'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Right Column - Actions & Info */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => emailsAPI.bulkAction({
                                    emailIds: [id],
                                    action: 'assign',
                                    data: { userId: 'current-user-id' }
                                })}
                            >
                                <User className="h-4 w-4 mr-2" />
                                Assign to me
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => navigate(`/app/email/${id}/forward`)}
                            >
                                <Forward className="h-4 w-4 mr-2" />
                                Forward
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => emailsAPI.bulkAction({
                                    emailIds: [id],
                                    action: 'change-status',
                                    data: { status: 'DRAFTED' }
                                })}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Mark for Review
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={generateAIResponse}
                                disabled={aiLoading}
                            >
                                <Bot className="h-4 w-4 mr-2" />
                                {aiLoading ? 'Generating...' : 'AI Regenerate'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Email Status Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Status Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="flex flex-col items-center mr-4">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                                    </div>
                                    <div>
                                        <p className="font-medium">Email Received</p>
                                        <p className="text-sm text-gray-500">{formatDate(email.createdAt)}</p>
                                    </div>
                                </div>

                                {email.processedAt && (
                                    <div className="flex items-start">
                                        <div className="flex flex-col items-center mr-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Bot className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                                        </div>
                                        <div>
                                            <p className="font-medium">AI Processed</p>
                                            <p className="text-sm text-gray-500">{formatDate(email.processedAt)}</p>
                                            <p className="text-sm">Category: {email.category}</p>
                                        </div>
                                    </div>
                                )}

                                {email.draftText && (
                                    <div className="flex items-start">
                                        <div className="flex flex-col items-center mr-4">
                                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                                <Edit className="h-4 w-4 text-yellow-600" />
                                            </div>
                                            <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                                        </div>
                                        <div>
                                            <p className="font-medium">Draft Created</p>
                                            <p className="text-sm text-gray-500">
                                                {email.updatedAt ? formatDate(email.updatedAt) : 'Recently'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {email.sentAt && (
                                    <div className="flex items-start">
                                        <div className="flex flex-col items-center mr-4">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                <Send className="h-4 w-4 text-green-600" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-medium">Email Sent</p>
                                            <p className="text-sm text-gray-500">{formatDate(email.sentAt)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Feedback */}
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Feedback</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Rate the AI's response quality:
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                    <ThumbsUp className="h-4 w-4 mr-2" />
                                    Good
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1">
                                    <ThumbsDown className="h-4 w-4 mr-2" />
                                    Needs Work
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EmailDetailPage;
