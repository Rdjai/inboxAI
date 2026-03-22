import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, Clock, Mail, Paperclip, Send, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiAPI, emailAccountsAPI, emailsAPI } from '../services/api';
import { useEmail } from '../context/EmailContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';

const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' },
    { value: 'empathetic', label: 'Empathetic' }
];

const quickTemplates = [
    {
        title: 'Standard response',
        body: 'Thank you for your email. We will get back to you within 24 hours.'
    },
    {
        title: 'Feedback response',
        body: 'We appreciate your feedback. Our team will review your suggestion.'
    },
    {
        title: 'Issue response',
        body: 'We apologize for the inconvenience. Our team is investigating the issue.'
    }
];

const extractAccounts = (response) => {
    const payload = response?.data || response;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.accounts)) return payload.accounts;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

const EmailComposePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { accounts, selectedAccount } = useEmail();
    const fileInputRef = useRef(null);

    const isReply = location.pathname.includes('/reply');
    const isForward = location.pathname.includes('/forward');
    const isStandaloneCompose = !id;

    const [email, setEmail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [selectedTone, setSelectedTone] = useState('professional');
    const [formData, setFormData] = useState({
        to: '',
        subject: '',
        content: '',
        sendImmediately: false,
        attachments: []
    });

    const goBackPath = useMemo(() => (id ? `/app/email/${id}` : '/app/inbox'), [id]);

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
        if (!id) {
            setLoading(false);
            return;
        }

        const fetchEmail = async () => {
            try {
                setLoading(true);
                const response = await emailsAPI.getEmail(id);
                const currentEmail = response?.data?.email;
                setEmail(currentEmail);

                if (isReply) {
                    setFormData((prev) => ({
                        ...prev,
                        to: currentEmail?.fromAddress || '',
                        subject: `Re: ${currentEmail?.subject || ''}`,
                        content: ''
                    }));
                } else if (isForward) {
                    setFormData((prev) => ({
                        ...prev,
                        subject: `Fwd: ${currentEmail?.subject || ''}`,
                        content: `--- Forwarded message ---\nFrom: ${currentEmail?.fromAddress || ''}\nDate: ${currentEmail?.createdAt ? new Date(currentEmail.createdAt).toLocaleString() : ''}\nSubject: ${currentEmail?.subject || ''}\n\n${currentEmail?.bodyText || ''}\n\n`
                    }));
                }
            } catch (error) {
                toast.error('Failed to load email');
            } finally {
                setLoading(false);
            }
        };

        fetchEmail();
    }, [id, isForward, isReply]);

    const handleGenerateAI = async (tone = selectedTone) => {
        if (isStandaloneCompose) {
            if (!formData.subject.trim()) {
                toast.error('Please write a subject first');
                return;
            }

            setFormData((prev) => ({
                ...prev,
                content: buildComposeDraft(prev.subject, tone)
            }));
            toast.success('AI draft generated from subject');
            return;
        }

        try {
            const response = await aiAPI.generateReply(id || 'compose', tone, {
                subject: formData.subject || '',
                bodyText: formData.content || ''
            });
            const draft = response?.data?.draft || '';

            setFormData((prev) => ({
                ...prev,
                content: draft
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
                navigate(`/app/email/${id}`);
                return;
            }

            if (isForward) {
                await emailsAPI.forwardEmail(id, {
                    toAddress: formData.to,
                    message: formData.content
                });
                toast.success('Email forwarded successfully');
                navigate(`/app/email/${id}`);
                return;
            }

            let availableAccounts = accounts;
            if (!availableAccounts || availableAccounts.length === 0) {
                const accountRes = await emailAccountsAPI.getAccounts();
                availableAccounts = extractAccounts(accountRes);
            }

            const selectedAccountData = availableAccounts.find((account) => account._id === selectedAccount);
            const fallbackAccount = selectedAccountData || availableAccounts[0];
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const fromAddress = fallbackAccount?.email || user?.email;

            if (!fromAddress) {
                throw new Error('Sender email not found. Please select a valid email account.');
            }

            if (!formData.to.trim()) {
                throw new Error('Recipient email is required');
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.to.trim())) {
                throw new Error('Enter a valid recipient email');
            }

            if (!formData.subject.trim()) {
                throw new Error('Subject is required');
            }

            if (!formData.content.trim()) {
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
            navigate('/app/inbox');
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

    const handleFilesSelected = (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            attachments: [...prev.attachments, ...files]
        }));

        event.target.value = '';
    };

    const removeAttachment = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
        }));
    };

    const insertTemplate = (templateBody) => {
        setFormData((prev) => ({
            ...prev,
            content: prev.content ? `${prev.content}\n\n${templateBody}` : templateBody
        }));
    };

    if (loading) {
        return (
            <div className="-m-4 flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950/30 md:-m-6 lg:-m-8">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="-m-4 min-h-[calc(100vh-4rem)] bg-slate-950/35 backdrop-blur-sm md:-m-6 lg:-m-8">
            <div className="flex min-h-[calc(100vh-4rem)] items-stretch justify-center md:p-6">
                <div className="flex w-full flex-col bg-white shadow-2xl md:max-w-6xl md:overflow-hidden md:rounded-[32px]">
                    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur md:px-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                                    <Sparkles className="h-4 w-4" />
                                    Mobile compose sheet
                                </div>
                                <h1 className="mt-2 text-xl font-semibold text-slate-900 md:text-2xl">
                                    {isReply ? 'Reply to Email' : isForward ? 'Forward Email' : 'Compose Email'}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    {isReply
                                        ? 'Send a response to the sender.'
                                        : isForward
                                            ? 'Forward this conversation with context.'
                                            : 'Write and send a new email from a mobile-friendly modal.'}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(goBackPath)}
                                    className="hidden md:inline-flex"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => navigate(goBackPath)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                                    aria-label="Close compose"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="grid gap-6 p-4 md:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.9fr)] md:p-6">
                            <div className="space-y-6">
                                {email && (
                                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                                        <CardHeader className="bg-slate-50">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <Mail className="h-4 w-4 text-sky-600" />
                                                Original Email
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 p-4">
                                            <div>
                                                <Label>From</Label>
                                                <p className="mt-1 font-medium text-slate-900">{email.fromAddress}</p>
                                            </div>
                                            <div>
                                                <Label>Subject</Label>
                                                <p className="mt-1 font-medium text-slate-900">{email.subject}</p>
                                            </div>
                                            <div>
                                                <Label>Received</Label>
                                                <p className="mt-1 flex items-center text-sm text-slate-500">
                                                    <Clock className="mr-1 h-3.5 w-3.5" />
                                                    {new Date(email.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <Label>Content</Label>
                                                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                                                    <p className="whitespace-pre-wrap">{email.bodyText}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <Card className="overflow-hidden border-slate-200 shadow-sm">
                                    <CardHeader className="border-b border-slate-100 bg-white">
                                        <CardTitle className="text-base">
                                            {isReply ? 'Reply' : isForward ? 'Forward' : 'New message'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-5 p-4 md:p-6">
                                        {(isForward || isStandaloneCompose) && (
                                            <div>
                                                <Label htmlFor="to">To</Label>
                                                <Input
                                                    id="to"
                                                    value={formData.to}
                                                    onChange={(event) => setFormData((prev) => ({ ...prev, to: event.target.value }))}
                                                    placeholder="recipient@example.com"
                                                    className="mt-2 h-11 rounded-xl border-slate-200"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input
                                                id="subject"
                                                value={formData.subject}
                                                onChange={(event) => setFormData((prev) => ({ ...prev, subject: event.target.value }))}
                                                placeholder="Write a clear subject"
                                                className="mt-2 h-11 rounded-xl border-slate-200"
                                            />
                                        </div>

                                        <div>
                                            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                                                <Label htmlFor="content">Message</Label>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Select
                                                        value={selectedTone}
                                                        onValueChange={(value) => {
                                                            setSelectedTone(value);
                                                            handleGenerateAI(value);
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-10 w-[160px] rounded-xl border-slate-200 bg-white">
                                                            <SelectValue placeholder="AI tone" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {toneOptions.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleGenerateAI()}
                                                        className="rounded-xl"
                                                    >
                                                        <Bot className="mr-2 h-4 w-4" />
                                                        AI Draft
                                                    </Button>
                                                </div>
                                            </div>
                                            <Textarea
                                                id="content"
                                                value={formData.content}
                                                onChange={(event) => setFormData((prev) => ({ ...prev, content: event.target.value }))}
                                                className="min-h-[280px] rounded-2xl border-slate-200 px-4 py-3 text-sm leading-6 md:min-h-[360px]"
                                                placeholder={isReply ? 'Type your reply here...' : 'Write your message here...'}
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between gap-3">
                                                <Label>Attachments</Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="rounded-xl"
                                                >
                                                    <Paperclip className="mr-2 h-4 w-4" />
                                                    Browse
                                                </Button>
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={handleFilesSelected}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="mt-3 flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-sky-300 hover:bg-sky-50"
                                            >
                                                <Paperclip className="h-7 w-7 text-slate-400" />
                                                <span className="mt-3 text-sm font-medium text-slate-700">Tap to add files</span>
                                                <span className="mt-1 text-xs text-slate-500">Designed for touch-first upload on smaller screens.</span>
                                            </button>

                                            {formData.attachments.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {formData.attachments.map((file, index) => (
                                                        <div
                                                            key={`${file.name}-${index}`}
                                                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate font-medium text-slate-800">{file.name}</p>
                                                                <p className="text-xs text-slate-500">
                                                                    {(file.size / 1024).toFixed(1)} KB
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAttachment(index)}
                                                                className="rounded-full px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {isReply && (
                                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.sendImmediately}
                                                    onChange={(event) => setFormData((prev) => ({
                                                        ...prev,
                                                        sendImmediately: event.target.checked
                                                    }))}
                                                    className="h-4 w-4 rounded border-slate-300"
                                                />
                                                Send immediately after reply is created
                                            </label>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-base">Quick templates</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {quickTemplates.map((template) => (
                                            <button
                                                key={template.title}
                                                type="button"
                                                onClick={() => insertTemplate(template.body)}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm transition hover:border-sky-300 hover:bg-sky-50"
                                            >
                                                <p className="font-medium text-slate-900">{template.title}</p>
                                                <p className="mt-1 text-slate-500">{template.body}</p>
                                            </button>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-base">Compose status</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                                {formData.subject.trim() ? 'Subject ready' : 'Subject missing'}
                                            </Badge>
                                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                                {formData.to.trim() || isReply ? 'Recipient ready' : 'Recipient missing'}
                                            </Badge>
                                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                                {formData.content.trim() ? 'Draft ready' : 'Draft empty'}
                                            </Badge>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                            <p className="font-medium text-slate-900">Mobile layout details</p>
                                            <p className="mt-2 leading-6">
                                                Header actions stay pinned, the composer scrolls independently, and send controls remain reachable at the bottom of the sheet.
                                            </p>
                                        </div>
                                        {email && (
                                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Category</p>
                                                    <p className="mt-1 font-medium text-slate-900">{email.category || 'Uncategorized'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Priority</p>
                                                    <p className="mt-1 font-medium text-slate-900">{email.priority || 'Medium'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Status</p>
                                                    <p className="mt-1 font-medium text-slate-900">{email.status}</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur md:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" onClick={handleSaveDraft} className="rounded-xl">
                                    Save Draft
                                </Button>
                                <Button variant="outline" onClick={() => navigate(goBackPath)} className="rounded-xl">
                                    Cancel
                                </Button>
                            </div>

                            <Button type="button" onClick={handleSend} disabled={sending} className="h-11 rounded-xl px-5">
                                {sending ? (
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {sending ? 'Sending...' : 'Send Email'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailComposePage;
