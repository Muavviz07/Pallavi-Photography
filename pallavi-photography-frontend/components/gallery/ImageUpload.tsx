"use client";

import { useState, useRef } from "react";
import { Upload, X, FileImage, CheckCircle, AlertCircle } from "lucide-react";

interface ImageUploadProps {
  slug: string;
  token: string;
  onUploadSuccess: () => void;
}

export default function ImageUpload({ slug, token, onUploadSuccess }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndAddFiles = (files: FileList) => {
    const validFiles: File[] = [];
    const newErrors: string[] = [];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type)) {
        newErrors.push(`${file.name}: Invalid file format. Only JPG, PNG, and WebP are allowed.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        newErrors.push(`${file.name}: File is too large. Max size is 50MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (newErrors.length > 0) {
      setErrors((prev) => [...prev, ...newErrors]);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setSuccess(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || uploading) return;

    setUploading(true);
    setErrors([]);
    setSuccess(false);

    // Initialize progress
    const newProgress: Record<string, number> = {};
    selectedFiles.forEach((file) => {
      newProgress[file.name] = 0;
    });
    setProgress(newProgress);

    let uploadFailed = false;

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.split(".")[0]);
      formData.append("alt_text", `Client uploaded ${file.name}`);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const val = prev[file.name] || 0;
          if (val >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [file.name]: val + 15 };
        });
      }, 100);

      try {
        const res = await fetch(`${apiUrl}/api/client-galleries/${slug}/images/upload`, {
          method: "POST",
          headers: {
            // Let the browser handle boundary header for FormData
            "X-Gallery-Token": token,
          },
          body: formData,
        });

        clearInterval(progressInterval);

        if (!res.ok) {
          uploadFailed = true;
          const data = await res.json();
          setErrors((prev) => [...prev, `Failed to upload ${file.name}: ${data.detail || "Server error."}`]);
          setProgress((prev) => ({ ...prev, [file.name]: 0 }));
        } else {
          setProgress((prev) => ({ ...prev, [file.name]: 100 }));
        }
      } catch (err) {
        clearInterval(progressInterval);
        uploadFailed = true;
        setErrors((prev) => [...prev, `Network error uploading ${file.name}.`]);
        setProgress((prev) => ({ ...prev, [file.name]: 0 }));
      }
    }

    setUploading(false);
    
    if (!uploadFailed) {
      setSuccess(true);
      setSelectedFiles([]);
      onUploadSuccess();
    }
  };

  return (
    <div className="bg-[#FAF8F5] border border-[#DCD0C0]/40 rounded-md p-8 shadow-xs max-w-xl space-y-6">
      <div className="flex items-center space-x-2.5 text-[#C4A484] mb-2">
        <Upload className="w-4 h-4" />
        <h3 className="text-xs uppercase tracking-widest font-semibold text-[#2C2623]">
          Upload Photos
        </h3>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`border-2 border-dashed rounded-sm p-10 text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? "border-[#C4A484] bg-[#F5EFEB]/30"
            : "border-[#DCD0C0]/50 hover:border-[#C4A484]/50"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
        <Upload className="w-8 h-8 text-[#C4A484] mx-auto opacity-70 mb-3" />
        <p className="text-xs text-[#2C2623] font-medium tracking-wide">
          Drag & drop images here, or <span className="text-[#C4A484] underline">browse files</span>
        </p>
        <p className="text-[10px] text-[#6E635F] font-light mt-1.5">
          JPG, PNG, or WebP up to 50MB per file
        </p>
      </div>

      {/* Errors list */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 text-xs text-red-700 space-y-1">
          <div className="flex items-center space-x-1.5 font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Upload Warning</span>
          </div>
          <ul className="list-disc pl-4 space-y-0.5 font-light">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Notification */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-xs text-green-700 p-4 rounded-sm flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <span>All files uploaded and optimized successfully!</span>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] uppercase tracking-wider text-[#6E635F] font-medium">
            Files to Upload ({selectedFiles.length})
          </h4>
          <div className="max-h-48 overflow-y-auto border border-[#DCD0C0]/20 rounded-sm p-3 bg-white space-y-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-[#EAE4DC]/50 last:border-b-0">
                <div className="flex items-center space-x-2.5 truncate pr-4">
                  <FileImage className="w-4 h-4 text-[#C4A484]" />
                  <span className="truncate font-light text-[#2C2623]" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-[10px] text-stone-400 font-light">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                
                {uploading ? (
                  <span className="text-[10px] text-[#C4A484] font-medium font-mono shrink-0">
                    {progress[file.name] || 0}%
                  </span>
                ) : (
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-stone-400 hover:text-red-500 cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full inline-flex items-center justify-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] py-3 rounded-sm font-medium transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span>Start Uploading</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
