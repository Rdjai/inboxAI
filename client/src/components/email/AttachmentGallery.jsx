import React, { useEffect, useMemo, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    ExternalLink,
    File,
    FileImage,
    FileText,
    Paperclip,
    X
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'];
const PDF_EXTENSIONS = ['pdf'];

const formatFileSize = (attachment) => {
    const sizeBytes = Number(
        attachment?.sizeBytes
        || attachment?.size
        || attachment?.fileSize
        || 0
    );

    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
        return 'Unknown size';
    }

    if (sizeBytes < 1024) {
        return `${sizeBytes} B`;
    }

    if (sizeBytes < 1024 * 1024) {
        return `${(sizeBytes / 1024).toFixed(1)} KB`;
    }

    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFilename = (attachment, fallbackIndex) => (
    attachment?.filename
    || attachment?.name
    || attachment?.originalname
    || `Attachment ${fallbackIndex + 1}`
);

const getExtension = (filename) => {
    const segments = String(filename || '').split('.');
    return segments.length > 1 ? segments.pop().toLowerCase() : '';
};

const resolveAttachmentUrl = (attachment) => {
    const rawUrl = attachment?.url || attachment?.downloadUrl || attachment?.path;

    if (rawUrl) {
        if (/^https?:\/\//i.test(rawUrl)) {
            return rawUrl;
        }

        if (rawUrl.startsWith('/')) {
            return `${ASSET_BASE_URL}${rawUrl}`;
        }

        return `${ASSET_BASE_URL}/${rawUrl}`;
    }

    if (attachment?.storageKey) {
        return `${ASSET_BASE_URL}/uploads/${attachment.storageKey}`;
    }

    return null;
};

const getAttachmentKind = (attachment, filename) => {
    const mimeType = String(attachment?.mimeType || attachment?.contentType || '').toLowerCase();
    const extension = getExtension(filename);

    if (mimeType.startsWith('image/') || IMAGE_EXTENSIONS.includes(extension)) {
        return 'image';
    }

    if (mimeType === 'application/pdf' || PDF_EXTENSIONS.includes(extension)) {
        return 'pdf';
    }

    if (
        mimeType.includes('document')
        || mimeType.includes('sheet')
        || mimeType.includes('presentation')
        || ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'].includes(extension)
    ) {
        return 'document';
    }

    return 'file';
};

const AttachmentGallery = ({ attachments = [], title = 'Attachments' }) => {
    const [activePreviewIndex, setActivePreviewIndex] = useState(null);

    const normalizedAttachments = useMemo(() => (
        attachments.map((attachment, index) => {
            const filename = getFilename(attachment, index);
            const kind = getAttachmentKind(attachment, filename);
            const url = resolveAttachmentUrl(attachment);

            return {
                ...attachment,
                __galleryId: attachment?._id || attachment?.id || `${filename}-${index}`,
                filename,
                kind,
                url,
                sizeLabel: formatFileSize(attachment),
                extension: getExtension(filename)
            };
        })
    ), [attachments]);

    const previewableAttachments = useMemo(
        () => normalizedAttachments.filter((attachment) => attachment.url && (attachment.kind === 'image' || attachment.kind === 'pdf')),
        [normalizedAttachments]
    );

    const activeAttachment = activePreviewIndex === null
        ? null
        : previewableAttachments[activePreviewIndex] || null;

    useEffect(() => {
        if (!activeAttachment) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setActivePreviewIndex(null);
                return;
            }

            if (event.key === 'ArrowRight' && previewableAttachments.length > 1) {
                setActivePreviewIndex((current) => ((current ?? 0) + 1) % previewableAttachments.length);
            }

            if (event.key === 'ArrowLeft' && previewableAttachments.length > 1) {
                setActivePreviewIndex((current) => ((current ?? 0) - 1 + previewableAttachments.length) % previewableAttachments.length);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeAttachment, previewableAttachments.length]);

    if (!normalizedAttachments.length) {
        return null;
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h4 className="font-medium text-slate-900">{title}</h4>
                        <p className="text-sm text-slate-500">
                            Preview images instantly and open other files in a cleaner gallery.
                        </p>
                    </div>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                        {normalizedAttachments.length} file{normalizedAttachments.length === 1 ? '' : 's'}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {normalizedAttachments.map((attachment) => {
                        const isPreviewable = previewableAttachments.some((item) => item.__galleryId === attachment.__galleryId);
                        const previewIndex = previewableAttachments.findIndex((item) => item.__galleryId === attachment.__galleryId);

                        return (
                            <div
                                key={attachment.__galleryId}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="relative">
                                    {attachment.kind === 'image' && attachment.url ? (
                                        <button
                                            type="button"
                                            onClick={() => setActivePreviewIndex(previewIndex)}
                                            className="block h-40 w-full overflow-hidden bg-slate-100"
                                        >
                                            <img
                                                src={attachment.url}
                                                alt={attachment.filename}
                                                className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                                            />
                                        </button>
                                    ) : (
                                        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-800 text-white">
                                            <div className="text-center">
                                                {attachment.kind === 'pdf' && <FileText className="mx-auto h-10 w-10" />}
                                                {attachment.kind === 'document' && <File className="mx-auto h-10 w-10" />}
                                                {attachment.kind === 'file' && <Paperclip className="mx-auto h-10 w-10" />}
                                                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                                                    {attachment.kind}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute left-3 top-3">
                                        <Badge className="border-white/20 bg-white/85 text-slate-800 backdrop-blur">
                                            {attachment.kind === 'image' ? <FileImage className="mr-1 h-3 w-3" /> : null}
                                            {attachment.extension ? attachment.extension.toUpperCase() : attachment.kind.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-3 p-4">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-slate-900">{attachment.filename}</p>
                                        <p className="text-sm text-slate-500">{attachment.sizeLabel}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {isPreviewable && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setActivePreviewIndex(previewIndex)}
                                                className="rounded-xl"
                                            >
                                                Preview
                                            </Button>
                                        )}

                                        {attachment.url && (
                                            <Button asChild variant="outline" size="sm" className="rounded-xl">
                                                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Open
                                                </a>
                                            </Button>
                                        )}

                                        {attachment.url && (
                                            <Button asChild size="sm" className="rounded-xl">
                                                <a href={attachment.url} download={attachment.filename}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {activeAttachment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
                    <button
                        type="button"
                        onClick={() => setActivePreviewIndex(null)}
                        className="absolute inset-0 cursor-default"
                        aria-label="Close preview"
                    />

                    <div className="relative z-10 flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-slate-950 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 text-white md:px-6">
                            <div className="min-w-0">
                                <p className="truncate text-base font-semibold">{activeAttachment.filename}</p>
                                <p className="text-sm text-slate-300">{activeAttachment.sizeLabel}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button asChild variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                                    <a href={activeAttachment.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Open
                                    </a>
                                </Button>
                                <Button asChild size="sm" className="bg-white text-slate-950 hover:bg-slate-100">
                                    <a href={activeAttachment.url} download={activeAttachment.filename}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </a>
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setActivePreviewIndex(null)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black">
                            {previewableAttachments.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setActivePreviewIndex((current) => ((current ?? 0) - 1 + previewableAttachments.length) % previewableAttachments.length)}
                                        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActivePreviewIndex((current) => ((current ?? 0) + 1) % previewableAttachments.length)}
                                        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </>
                            )}

                            {activeAttachment.kind === 'image' ? (
                                <img
                                    src={activeAttachment.url}
                                    alt={activeAttachment.filename}
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <iframe
                                    src={activeAttachment.url}
                                    title={activeAttachment.filename}
                                    className="h-full w-full border-0 bg-white"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AttachmentGallery;
