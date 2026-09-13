"use client";

import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, Image as ImageIcon, Trash2, Play, RefreshCw, AlertCircle, FileCheck } from "lucide-react";

interface ImageUploaderProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  onRunDetection: () => void;
  isDetecting: boolean;
  statusText?: string;
}

export function ImageUploader({
  selectedFile,
  previewUrl,
  onFileSelect,
  onClear,
  onRunDetection,
  isDetecting,
  statusText,
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
          onFileSelect(file);
        } else {
          alert("Please upload a valid image file (.jpg, .jpeg, .png, etc.)");
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        onFileSelect(file);
      } else {
        alert("Please upload an image file.");
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Preloaded sample images for one-click testing
  const loadSampleImage = async (name: string, url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], name, { type: blob.type || "image/jpeg" });
      onFileSelect(file);
    } catch {
      console.warn("Could not fetch sample image:", url);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl shadow-black/40 backdrop-blur-md flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-amber-400" />
          Image Upload &amp; Input
        </h3>
        {selectedFile && (
          <span className="text-xs text-slate-400 font-mono">
            {formatFileSize(selectedFile.size)}
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        id="image-file-input"
      />

      {/* Dropzone area */}
      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 min-h-[240px] flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center ${
            isDragOver
              ? "border-amber-400 bg-amber-500/10 scale-[0.99]"
              : "border-slate-700/80 hover:border-slate-500 bg-slate-950/40 hover:bg-slate-950/70"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-slate-200">
            Drag and drop construction image here
          </p>
          <p className="text-xs text-slate-400 mt-1">
            or <span className="text-amber-400 underline font-medium">browse files</span> from your computer
          </p>
          <p className="text-[11px] text-slate-500 mt-3">
            Supports JPG, PNG, WEBP (Standard OSHA / site photography)
          </p>

          {/* Quick sample image buttons */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Or try a preloaded demo image:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => loadSampleImage("sample_worker_ppe.jpg", "/samples/sample_worker_ppe.jpg")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-md border border-slate-700/70 transition-colors"
              >
                👷 Worker with Helmet &amp; Vest
              </button>
              <button
                type="button"
                onClick={() => loadSampleImage("sample_workers_crew.jpg", "/samples/sample_workers_crew.jpg")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-md border border-slate-700/70 transition-colors"
              >
                👥 Construction Crew
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* File details banner */}
          <div className="flex items-center justify-between bg-slate-950/60 rounded-xl p-3 border border-slate-800 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                  {selectedFile?.name || "Uploaded Image"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {selectedFile ? formatFileSize(selectedFile.size) : "Ready"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isDetecting}
                title="Choose a different image"
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={onClear}
                disabled={isDetecting}
                title="Remove image"
                className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-lg border border-rose-900/30 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick thumbnail preview */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center max-h-56 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected inspection preview"
              className="max-h-56 w-auto object-contain"
            />
            {isDetecting && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                <p className="text-sm font-semibold text-white">Running RT-DETR Model...</p>
                <p className="text-xs text-slate-400 mt-1 text-center">
                  {statusText || "Predicting bounding boxes & confidence scores..."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center gap-3">
        <button
          type="button"
          onClick={onRunDetection}
          disabled={!selectedFile || isDetecting}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
        >
          {isDetecting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Detecting PPE...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Detection</span>
            </>
          )}
        </button>

        {selectedFile && (
          <button
            type="button"
            onClick={onClear}
            disabled={isDetecting}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-700/60 transition-colors disabled:opacity-40"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
