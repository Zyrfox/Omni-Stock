"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function DropzoneUploader() {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
    const [statusMessage, setStatusMessage] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const validateFile = (selectedFile: File) => {
        // Pawoon legacy format (.xls) verification
        const validTypes = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // Also accept modern xlsx just in case
        ];

        if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.xlsx')) {
            toast.error("Invalid File Format", {
                description: "Only Excel files (.xls, .xlsx) from Pawoon are supported.",
            });
            return false;
        }
        return true;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            const selectedFile = droppedFiles[0];
            if (validateFile(selectedFile)) {
                setFile(selectedFile);
                setUploadStatus("idle");
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            const selectedFile = selectedFiles[0];
            if (validateFile(selectedFile)) {
                setFile(selectedFile);
                setUploadStatus("idle");
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setUploadStatus("idle");
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setUploadStatus("idle");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/sales/upload", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setUploadStatus("success");
                setStatusMessage(`Successfully processed ${result.processed_rows} sales records.`);
                toast.success("Upload Successful", {
                    description: `Processed ${result.processed_rows} sales and updated inventory.`,
                });

                // Refresh dashboard data
                setTimeout(() => {
                    handleRemoveFile();
                    router.refresh();
                }, 3000);
            } else {
                setUploadStatus("error");
                setStatusMessage(result.error || "Failed to process the uploaded file.");
                toast.error("Upload Failed", {
                    description: result.error || "An error occurred during file processing.",
                });
            }
        } catch (error) {
            setUploadStatus("error");
            setStatusMessage("Network error or server unavailable.");
            toast.error("Network Error", {
                description: "Failed to communicate with the server.",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col gap-2 mb-6">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-primary" />
                    Smart Batch Uploader
                </h2>
                <p className="text-sm text-secondary-foreground">
                    Upload your Legacy Pawoon Sales Report (<b>.xls</b>) here. The engine will automatically parse rows, match menus, and deduct actual inventory stocks instantly.
                </p>
            </div>

            {!file ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
                        isDragging
                            ? "border-primary bg-primary/5 scale-[1.01]"
                            : "border-border hover:border-primary/50 hover:bg-secondary/30 bg-secondary/10"
                    )}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 gap-3">
                        <div className={cn(
                            "p-3 rounded-full transition-colors",
                            isDragging ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                        )}>
                            <UploadCloud className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-foreground">
                                Click to upload <span className="font-normal text-muted-foreground">or drag and drop</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Excel 97-2003 Legacy (.xls) supported</p>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileChange}
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className={cn(
                        "flex items-center justify-between p-4 border rounded-xl bg-secondary/20",
                        uploadStatus === "success" && "border-green-500/50 bg-green-500/10",
                        uploadStatus === "error" && "border-destructive/50 bg-destructive/10"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-2 rounded-lg",
                                uploadStatus === "success" ? "bg-green-500/20 text-green-500" :
                                    uploadStatus === "error" ? "bg-destructive/20 text-destructive" :
                                        "bg-primary/20 text-primary"
                            )}>
                                {uploadStatus === "success" ? <CheckCircle2 className="w-5 h-5" /> :
                                    uploadStatus === "error" ? <AlertCircle className="w-5 h-5" /> :
                                        <FileSpreadsheet className="w-5 h-5" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                                <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                        </div>

                        {!isUploading && uploadStatus !== "success" && (
                            <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive shrink-0">
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {statusMessage && (
                        <p className={cn(
                            "text-sm font-medium",
                            uploadStatus === "success" ? "text-green-500" : "text-destructive"
                        )}>
                            {statusMessage}
                        </p>
                    )}

                    {!isUploading && uploadStatus !== "success" && (
                        <div className="flex gap-3 justify-end mt-2">
                            <Button variant="outline" onClick={handleRemoveFile} disabled={isUploading}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpload} disabled={isUploading} className="min-w-[120px]">
                                Parse & Evaluate
                            </Button>
                        </div>
                    )}

                    {isUploading && (
                        <div className="flex items-center justify-center gap-2 p-2 mt-2 text-sm font-medium text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            Evaluating Inventory & Extracting Pawoon Rows...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
