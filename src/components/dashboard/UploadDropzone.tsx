'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { processUpload } from '@/app/actions/upload';

export function UploadDropzone() {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const validateFile = (file: File) => {
        // Only accept .xls or .xlsx
        if (!file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
            toast.error('Invalid file format', { description: 'Please upload an Excel file (.xls / .xlsx)' });
            return false;
        }
        return true;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (validateFile(droppedFile)) {
                setFile(droppedFile);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (validateFile(selectedFile)) {
                setFile(selectedFile);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await processUpload(formData);

            if (result.success) {
                setFile(null);
                toast.success('Upload Successful', { description: result.message });
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                toast.error('Upload Failed', { description: result.error || 'Unknown error occurred.' });
            }
        } catch {
            toast.error('Upload Failed', { description: 'Server error occurred during upload.' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Batch Upload Sales Report</CardTitle>
                <CardDescription>
                    Drag and drop legacy Pawoon <b>.xls</b> sales report here to update inventory stocks and trigger PO generation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!file ? (
                    <div
                        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors ${isDragging
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                            : 'border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                    >
                        <UploadCloud className={`mb-4 h-10 w-10 ${isDragging ? 'text-indigo-500' : 'text-slate-400'}`} />
                        <p className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Excel files (.xls) up to 10MB
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="h-8 w-8 text-indigo-500" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{file.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            </div>
                            {!isUploading && (
                                <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="text-slate-500">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setFile(null)} disabled={isUploading}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpload} disabled={isUploading} className="bg-indigo-600 hover:bg-indigo-700">
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Evaluating...
                                    </>
                                ) : (
                                    'Process Report'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
