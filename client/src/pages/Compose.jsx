// src/pages/EmailComposePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { emailsAPI, aiAPI, emailAccountsAPI } from '../services/api';
import { useEmail } from '../context/EmailContext';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../components/ui/select';
import {
    ArrowLeft,
    Send,
    Bot,
    Paperclip,
    User,
    Mail,
    Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmailComposePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isReply = location.pathname.includes('/reply');
    const isForward = location.pathname.includes('/forward');
    const isStandaloneCompose = !id;
    const { accounts, selectedAccount } = useEmail();

    const [email, setEmail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [formData, setFormData] = useState({
        to: '',
        subject: '',
        content: '',
        sendImmediately: false,
        attachments: []
    });
    const fileInputRef = useRef(null);

    const buildComposeDraft = (subject, tone = 'professional') => {
        const cleanSubject = (subject || '').trim();
        const subjectLower = cleanSubject.toLowerCase();

        const introByTone = {
            professional: 'I hope you are doing well.',
            friendly: 'Hope you are doing great.',
            formal: 'I hope this message finds you well.',
            empathetic: 'I hope you are doing well and thank you for your time.'
        };

        if (subjectLower.includes('application') && (subjectLower.includes('sde') || subjectLower.includes('backend'))) {
            return `Dear Hiring Team,

${introByTone[tone] || introByTone.professional}

I am writing to apply for the Software Development Engineer (Backend) role at your organization.

I have hands-on experience with backend development, REST API design, database integration, and building reliable server-side systems. I am comfortable working with Node.js, Express, and modern development workflows, and I focus on writing clean, maintainable, and production-ready code.

I am very interested in this opportunity and would be glad to contribute to your engineering team. Please find my resume attached for your consideration.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,`;
        }

        return `Dear Sir/Madam,

${introByTone[tone] || introByTone.professional}

I am writing regarding "${cleanSubject || 'my concern'}".

I would like to share my concern and request your support on this matter. Please let me know if any additional details are required from my side.

Thank you for your time and assistance.

Best regards,`;
    };

    useEffect(() => {
        if (id) {
            fetchEmail();
        } else {
            setLoading(false);
        }
    }, [id]);

    const fetchEmail = async () => {
        try {
            setLoading(true);
            const response = await emailsAPI.getEmail(id);
            setEmail(response.data.email);

            // Set form data based on action
            if (isReply) {
                setFormData(prev => ({
                    ...prev,
                    to: response.data.email.fromAddress,
                    subject: `Re: ${response.data.email.subject}`,
                    content: ''
                }));
            } else if (isForward) {
                setFormData(prev => ({
                    ...prev,
                    subject: `Fwd: ${response.data.email.subject}`,
                    content: `--- Forwarded message ---\nFrom: ${response.data.email.fromAddress}\nDate: ${new Date(response.data.email.createdAt).toLocaleString()}\nSubject: ${response.data.email.subject}\n\n${response.data.email.bodyText}\n\n`
                }));
            }
        } catch (error) {
            toast.error('Failed to load email');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAI = async () => {
        if (isStandaloneCompose) {
            if (!formData.subject?.trim()) {
                toast.error('Please write a subject first');
                return;
            }

            setFormData(prev => ({
                ...prev,
                content: buildComposeDraft(prev.subject, 'professional')
            }));
            toast.success('AI draft generated from subject');
            return;
        }

        try {
            const response = await aiAPI.generateReply(
                id || 'compose',
                'professional',
                {
                    subject: formData.subject || '',
                    bodyText: formData.content || ''
                }
            );
            const draft = response?.data?.draft || '';
            const prefixedDraft = isStandaloneCompose && formData.subject?.trim()
                ? `Regarding "${formData.subject.trim()}":\n\n${draft}`
                : draft;

            setFormData(prev => ({
                ...prev,
                content: prefixedDraft
            }));
            toast.success('AI response generated');
        } catch (error) {
            toast.error('Failed to generate AI response');
        }
    };

    const handleSend = async () => {
        try {
            setSending(true);

            if (isReply) {
                await emailsAPI.replyToEmail(id, {
                    content: formData.content,
                    sendImmediately: formData.sendImmediately
                });
                toast.success('Reply sent successfully');
            } else if (isForward) {
                await emailsAPI.forwardEmail(id, {
                    toAddress: formData.to,
                    message: formData.content
                });
                toast.success('Email forwarded successfully');
            } else {
                let availableAccounts = accounts;
                if (!availableAccounts || availableAccounts.length === 0) {
                    const accountRes = await emailAccountsAPI.getAccounts();
                    availableAccounts = extractAccounts(accountRes);
                }

                const selectedAccountData = availableAccounts.find(acc => acc._id === selectedAccount);
                const fallbackAccount = selectedAccountData || availableAccounts[0];
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const fromAddress = fallbackAccount?.email || user?.email;

                if (!fromAddress) {
                    throw new Error('Sender email not found. Please select a valid email account.');
                }

                if (!formData.to?.trim()) {
                    throw new Error('Recipient email is required');
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.to.trim())) {
                    throw new Error('Enter a valid recipient email');
                }

                if (!formData.subject?.trim()) {
                    throw new Error('Subject is required');
                }

                if (!formData.content?.trim()) {
                    throw new Error('Message content is required');
                }

                await emailAccountsAPI.testSendEmail({
                    ...(fallbackAccount?._id ? { accountId: fallbackAccount._id } : {}),
                    to: formData.to.trim(),
                    subject: formData.subject.trim(),
                    body: formData.content.trim()
                });

                await emailsAPI.createEmail({
                    fromAddress,
                    toAddress: formData.to.trim(),
                    subject: formData.subject.trim(),
                    bodyText: formData.content.trim()
                });

                toast.success('Email sent successfully');
                navigate('/inbox');
                return;
            }

            navigate(`/email/${id}`);
        } catch (error) {
            toast.error(error?.message || 'Failed to send email');
        } finally {
            setSending(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!id) {
            toast.error('Save draft is available only for an existing email thread');
            return;
        }

        try {
            await emailsAPI.updateDraft(id, {
                draftText: formData.content
            });
            toast.success('Draft saved');
        } catch (error) {
            toast.error('Failed to save draft');
        }
    };

    const handleBrowseFiles = () => {
        fileInputRef.current?.click();
    };

    const handleFilesSelected = (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...files]
        }));

        event.target.value = '';
    };

    const removeAttachment = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
        }));
    };

    const extractAccounts = (response) => {
        const payload = response?.data || response;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.accounts)) return payload.accounts;
        if (Array.isArray(payload?.data)) return payload.data;
        return [];
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
            </div>
        );
    }

    return (
            <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => navigate(id ? `/email/${id}` : '/inbox')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {id ? 'Back to Email' : 'Back to Inbox'}
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {isReply ? 'Reply to Email' : isForward ? 'Forward Email' : 'Compose Email'}
                        </h1>
                        <p className="text-gray-600">
                            {isReply
                                ? 'Send a response to the sender'
                                : isForward
                                    ? 'Forward this email to someone else'
                                    : 'Write and send a new email'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Original Email */}
                <div className="lg:col-span-2">
                    {email && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Original Email
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label>From</Label>
                                    <p className="font-medium">{email.fromAddress}</p>
                                </div>
                                <div>
                                    <Label>Subject</Label>
                                    <p className="font-medium">{email.subject}</p>
                                </div>
                                <div>
                                    <Label>Received</Label>
                                    <p className="text-sm text-gray-600">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        {new Date(email.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <Label>Content</Label>
                                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                                        <p className="whitespace-pre-wrap">{email.bodyText}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    )}

                    {/* Compose Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Compose {isReply ? 'Reply' : isForward ? 'Forward' : 'Email'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(isForward || isStandaloneCompose) && (
                                <div>
                                    <Label htmlFor="to">To</Label>
                                    <Input
                                        id="to"
                                        value={formData.to}
                                        onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                                        placeholder="recipient@example.com"
                                    />
                                </div>
                            )}

                            <div>
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label htmlFor="content">Message</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateAI}
                                    >
                                        <Bot className="h-4 w-4 mr-2" />
                                        AI Generate
                                    </Button>
                                </div>
                                <Textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    className="min-h-[300px]"
                                    placeholder={isReply ? 'Type your reply here...' : 'Add a message before forwarding...'}
                                />
                            </div>

                            <div>
                                <Label>Attachments</Label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleFilesSelected}
                                />
                                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <Paperclip className="h-8 w-8 text-gray-400 mx-auto" />
                                    <p className="mt-2 text-sm text-gray-600">
                                        Drag & drop files here or click to browse
                                    </p>
                                    <Button variant="outline" className="mt-4" size="sm" type="button" onClick={handleBrowseFiles}>
                                        Browse Files
                                    </Button>
                                </div>
                                {formData.attachments.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {formData.attachments.map((file, index) => (
                                            <div key={`${file.name}-${index}`} className="flex items-center justify-between text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2">
                                                <span className="truncate pr-3">{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-between">
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleSaveDraft}>
                                    Save as Draft
                                </Button>
                                <Button variant="outline" onClick={() => navigate(id ? `/email/${id}` : '/inbox')}>
                                    Cancel
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                {isReply && (
                                    <div className="flex items-center gap-2 mr-4">
                                        <input
                                            type="checkbox"
                                            id="sendImmediately"
                                            checked={formData.sendImmediately}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                sendImmediately: e.target.checked
                                            }))}
                                        />
                                        <Label htmlFor="sendImmediately" className="text-sm">
                                            Send immediately
                                        </Label>
                                    </div>
                                )}

                                <Button type="button" onClick={handleSend} disabled={sending} className="gap-2">
                                    {sending ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    {sending ? 'Sending...' : 'Send'}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* Right Column - Quick Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Templates</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left"
                                onClick={() => setFormData(prev => ({
                                    ...prev,
                                    content: 'Thank you for your email. We will get back to you within 24 hours.'
                                }))}
                            >
                                Standard Response
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left"
                                onClick={() => setFormData(prev => ({
                                    ...prev,
                                    content: 'We appreciate your feedback. Our team will review your suggestion.'
                                }))}
                            >
                                Feedback Response
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left"
                                onClick={() => setFormData(prev => ({
                                    ...prev,
                                    content: 'We apologize for the inconvenience. Our team is investigating the issue.'
                                }))}
                            >
                                Issue Response
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>AI Tone</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select onValueChange={async (tone) => {
                                try {
                                    if (isStandaloneCompose) {
                                        if (!formData.subject?.trim()) {
                                            toast.error('Please write a subject first');
                                            return;
                                        }
                                        setFormData(prev => ({
                                            ...prev,
                                            content: buildComposeDraft(prev.subject, tone)
                                        }));
                                        return;
                                    }

                                    const response = await aiAPI.generateReply(
                                        id || 'compose',
                                        tone,
                                        {
                                            subject: formData.subject || '',
                                            bodyText: formData.content || ''
                                        }
                                    );
                                    const draft = response?.data?.draft || '';
                                    const prefixedDraft = isStandaloneCompose && formData.subject?.trim()
                                        ? `Regarding "${formData.subject.trim()}":\n\n${draft}`
                                        : draft;

                                    setFormData(prev => ({
                                        ...prev,
                                        content: prefixedDraft
                                    }));
                                } catch (error) {
                                    toast.error('Failed to generate response');
                                }
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="friendly">Friendly</SelectItem>
                                    <SelectItem value="formal">Formal</SelectItem>
                                    <SelectItem value="empathetic">Empathetic</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {email && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Category</p>
                                <Badge variant="outline">{email.category || 'Uncategorized'}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Priority</p>
                                <p className="font-medium">{email.priority || 'MEDIUM'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <p className="font-medium">{email.status}</p>
                            </div>
                        </CardContent>
                    </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailComposePage;
