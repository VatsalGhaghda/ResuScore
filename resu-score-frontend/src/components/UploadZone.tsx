// components/UploadZone.tsx
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileText, 
  X, 
  ChevronDown, 
  Sparkles, 
  Info,
  FileQuestion
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UploadZoneProps {
  onFileSelect: (file: File, jobDescription?: string) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

export function UploadZone({
  onFileSelect,
  isUploading = false,
  uploadProgress = 0,
  className,
}: UploadZoneProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [showJobDescription, setShowJobDescription] = useState<boolean>(false);

  const validateFile = useCallback((file: File): boolean => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF or Word document");
      return false;
    }

    if (file.size > maxSize) {
      setError("File size should be less than 5MB");
      return false;
    }

    return true;
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && validateFile(file)) {
        setSelectedFile(file);
        setError(null);
      }
    },
    [validateFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
  });

  const handleUpload = () => {
    if (selectedFile) {
      setState("uploading");
      onFileSelect(selectedFile, jobDescription.trim() || undefined);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setState("idle");
    setError(null);
    setJobDescription("");
    setShowJobDescription(false);
  };

  const stateConfig = {
    idle: {
      title: "Upload Your Resume",
      description: "Drag & drop your resume here, or click to browse",
      icon: <Upload className="w-10 h-10 mb-4 text-muted-foreground" />,
    },
    dragging: {
      title: "Drop it like it's hot!",
      description: "Release to upload your resume",
      icon: <Upload className="w-10 h-10 mb-4 text-primary animate-bounce" />,
    },
    uploading: {
      title: "Analyzing Your Resume...",
      description: "This usually takes just a few seconds",
      icon: <Sparkles className="w-10 h-10 mb-4 text-primary animate-pulse" />,
    },
    success: {
      title: "Analysis Complete!",
      description: "Your resume has been analyzed successfully",
      icon: <FileText className="w-10 h-10 mb-4 text-green-500" />,
    },
    error: {
      title: "Upload Failed",
      description: error || "An error occurred. Please try again.",
      icon: <X className="w-10 h-10 mb-4 text-destructive" />,
    },
  };

  const currentState = stateConfig[state] || stateConfig.idle;

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors bg-card/80",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          state === "uploading" && "cursor-wait",
          state === "success" && "border-green-500/30 bg-green-500/5",
          state === "error" && "border-destructive/30 bg-destructive/5"
        )}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="flex flex-col items-center justify-center">
          {currentState.icon}
          <h3 className="text-xl font-semibold mb-2">{currentState.title}</h3>
          <p className="text-muted-foreground mb-6">{currentState.description}</p>

          {state === "idle" && !selectedFile && (
            <Button type="button" variant="outline">
              Select File
            </Button>
          )}

          {selectedFile && !isUploading && (
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetForm();
                  }}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Job Description Section */}
              <div className="w-full mb-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowJobDescription(!showJobDescription);
                  }}
                  className="w-full flex items-center justify-between text-left mb-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {showJobDescription 
                        ? "Hide Job Description (Optional)"
                        : "Add Job Description (Recommended)"}
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            Adding a job description helps us match your resume with specific job
                            requirements and provide more relevant feedback.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      showJobDescription && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {showJobDescription && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mt-2 space-y-2 text-left">
                        <Textarea
                          placeholder="Paste the job description here to get personalized feedback and ATS optimization..."
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="min-h-[140px] resize-none text-sm focus:ring-2 focus:ring-primary/70 focus:ring-offset-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          We'll analyze the job description to help you tailor your resume for
                          better ATS compatibility.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetForm();
                  }}
                  className="w-full sm:w-40"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  disabled={isUploading}
                  className="w-full sm:w-40 flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  {isUploading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Resume
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          {isUploading && (
            <div className="w-full max-w-md space-y-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {uploadProgress < 100
                  ? "Analyzing your resume..."
                  : "Finalizing analysis..."}
              </p>
            </div>
          )}

          {error && (
            <div className="text-destructive text-sm mt-2">
              <p>{error}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={resetForm}
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="mt-6 text-xs text-muted-foreground">
            <p>Supports: PDF, DOC, DOCX (Max 5MB)</p>
          </div>
        </div>
      </div>

    </div>
  );
}