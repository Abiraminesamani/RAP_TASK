"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ImageUploader } from "@/components/ImageUploader";
import { ImageViewer } from "@/components/ImageViewer";
import { DetectionSummary } from "@/components/DetectionSummary";
import { DetectionTable } from "@/components/DetectionTable";
import { ReasoningPanel } from "@/components/ReasoningPanel";
import { ErrorMessage } from "@/components/ErrorMessage";
import {
  detectPPE,
  reasonPPE,
  Detection,
  DetectResponse,
  ReasonResponse,
} from "@/lib/api";
import { Shield, Sparkles, Terminal, HardHat } from "lucide-react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Detection state
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectResult, setDetectResult] = useState<DetectResponse | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  // Reasoning state
  const [isReasoning, setIsReasoning] = useState<boolean>(false);
  const [reasonResult, setReasonResult] = useState<ReasonResponse | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  // Hover highlighting state between table and canvas
  const [highlightedDetection, setHighlightedDetection] =
    useState<Detection | null>(null);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);

    // Reset previous run data
    setDetectResult(null);
    setReasonResult(null);
    setDetectionError(null);
    setReasonError(null);
    setHighlightedDetection(null);
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectResult(null);
    setReasonResult(null);
    setDetectionError(null);
    setReasonError(null);
    setHighlightedDetection(null);
  };

  const handleRunDetection = async () => {
    if (!selectedFile) return;

    setIsDetecting(true);
    setDetectionError(null);
    try {
      const result = await detectPPE(selectedFile);
      setDetectResult(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during detection.";
      setDetectionError(message);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAskQuestion = async (question: string) => {
    if (!selectedFile) {
      setReasonError("Please upload an image before asking a question.");
      return;
    }

    setIsReasoning(true);
    setReasonError(null);
    try {
      const result = await reasonPPE(selectedFile, question);
      setReasonResult(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during reasoning.";
      setReasonError(message);
    } finally {
      setIsReasoning(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Hero />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Global Error Alerts */}
        <ErrorMessage
          message={detectionError || reasonError}
          onDismiss={() => {
            setDetectionError(null);
            setReasonError(null);
          }}
        />

        {/* Section 1: Upload & Initial Summary */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Upload Left Column */}
          <div className="lg:col-span-5 h-full">
            <ImageUploader
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              onFileSelect={handleFileSelect}
              onClear={handleClear}
              onRunDetection={handleRunDetection}
              isDetecting={isDetecting}
            />
          </div>

          {/* Detection Summary & Table Right Column */}
          <div className="lg:col-span-7 space-y-4">
            {detectResult ? (
              <>
                <DetectionSummary
                  detections={detectResult.detections}
                  count={detectResult.count}
                />
                <DetectionTable
                  detections={detectResult.detections}
                  onHighlightDetection={setHighlightedDetection}
                />
              </>
            ) : (
              <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-amber-400/80 mb-3">
                  <HardHat className="w-7 h-7" />
                </div>
                <h4 className="text-base font-semibold text-slate-300">
                  Ready for Inspection
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                  Upload an image from a job site and click{" "}
                  <strong className="text-amber-400 font-medium">
                    &quot;Run Detection&quot;
                  </strong>{" "}
                  to view detected PPE categories, workers, confidence scores,
                  and compliance metrics.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Visualizer (Canvas Bounding Boxes) */}
        {previewUrl && (
          <section className="animate-in fade-in duration-300">
            <ImageViewer
              imageUrl={previewUrl}
              detections={detectResult?.detections || []}
              originalWidth={detectResult?.image_width || 0}
              originalHeight={detectResult?.image_height || 0}
              highlightedDetection={highlightedDetection}
            />
          </section>
        )}

        {/* Section 3: Reasoning Layer */}
        <section className="animate-in fade-in duration-300">
          <ReasoningPanel
            onAskQuestion={handleAskQuestion}
            isLoading={isReasoning}
            reasonResult={reasonResult}
            hasImage={!!selectedFile}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-amber-500" />
            <span className="text-slate-300 font-semibold font-mono">
              PPE Safety AI
            </span>
            <span>&bull;</span>
            <span>RT-DETR-L Construction Safety Monitoring</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>11 Classes Monitored</span>
            <span>&bull;</span>
            <span>Handwritten Router</span>
            <span>&bull;</span>
            <span>0.50 Confidence Guardrail</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
