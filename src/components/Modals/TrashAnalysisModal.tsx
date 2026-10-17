'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Recycle,
  Check,
  Layers,
  ArrowRight
} from 'lucide-react';

interface TrashAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDiagnosis?: (data: any) => void;
}

export const TrashAnalysisModal: React.FC<TrashAnalysisModalProps> = ({
  isOpen,
  onClose,
  onApplyDiagnosis,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-loaded realistic sample river images for instant hackathon demonstration
  const sampleImages = [
    {
      title: 'Riverbank Plastic Accumulation',
      tag: 'Dense PET / Polystyrene',
      url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Floating Drainage Flotsam',
      tag: 'Urban Canal Debris',
      url: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Ghat Ritual Waste & Bags',
      tag: 'Mixed Organics & Polymers',
      url: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=600&q=80',
    },
  ];

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = async (url: string) => {
    setSelectedImage(url);
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/analyze-trash-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage.startsWith('data:') ? selectedImage : '',
          imageUrl: selectedImage.startsWith('http') ? selectedImage : '',
        }),
      });

      if (!res.ok) {
        throw new Error('Image analysis failed');
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || 'Could not analyze trash photo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-950 rounded-3xl p-5 sm:p-7 shadow-2xl border border-cyan-500/40 my-6 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Google Gemini Vision Trash Inspector</h2>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  MULTIMODAL AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI visual composition analysis, polymer breakdown, and safety hazard ranking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 my-4">
          
          {/* Image Upload Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-400/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-all min-h-[160px]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-cyan-400 mb-2" />
              <p className="text-xs font-bold text-white">Upload Riverbank Photo</p>
              <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, or mobile camera capture</p>
            </div>

            {/* Preview Box */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2 flex flex-col items-center justify-center relative min-h-[160px] overflow-hidden">
              {selectedImage ? (
                <div className="relative w-full h-full min-h-[145px] rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Uploaded River Trash"
                    className="w-full h-36 object-cover rounded-xl"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-cyan-300 font-mono">
                    Ready for Vision AI
                  </div>
                </div>
              ) : (
                <div className="text-center p-3 text-slate-500 text-xs">
                  <Layers className="w-7 h-7 mx-auto mb-1 text-slate-600" />
                  <span>No photo selected yet</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Demo Sample Photos */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Or Try Live Hackathon Samples:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {sampleImages.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSample(sample.url)}
                  className="group rounded-xl border border-slate-800 hover:border-cyan-400 overflow-hidden cursor-pointer bg-slate-900 transition-all"
                >
                  <img
                    src={sample.url}
                    alt={sample.title}
                    className="w-full h-14 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-1.5">
                    <p className="text-[10px] font-bold text-white truncate">{sample.title}</p>
                    <p className="text-[9px] text-slate-400 truncate">{sample.tag}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analyze Trigger */}
          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing with Google Gemini Vision...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Inspect Trash with Gemini Vision</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Vision Inspection Results */}
          {analysisResult && !isLoading && (
            <div className="rounded-2xl p-4 bg-slate-900 border border-cyan-500/40 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Google Gemini Visual Diagnosis</span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    Severity: {analysisResult.severityLevel || 'High'} ({analysisResult.severityScore || '4.0'}/5)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {analysisResult.source || 'Gemini Vision AI'}
                </span>
              </div>

              {/* Composition Breakdown Bars */}
              <div>
                <span className="text-[11px] font-bold text-slate-300 block mb-1">
                  Detected Composition:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-950 p-2 rounded-xl border border-cyan-500/30">
                    <span className="text-cyan-400 font-bold text-base">
                      {analysisResult.composition?.plasticsPct || 75}%
                    </span>
                    <span className="block text-[10px] text-slate-400">Plastics / Polymers</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold text-base">
                      {analysisResult.composition?.organicSiltPct || 18}%
                    </span>
                    <span className="block text-[10px] text-slate-400">Organic Silt / Algae</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-rose-500/30">
                    <span className="text-rose-400 font-bold text-base">
                      {analysisResult.composition?.hazardousChemicalPct || 7}%
                    </span>
                    <span className="block text-[10px] text-slate-400">Hazard / Sludge</span>
                  </div>
                </div>
              </div>

              {/* Pollutants identified tags */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-300">Identified Objects:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(analysisResult.detectedPollutants || []).map((item: string, i: number) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action & PPE recommendation */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                <p className="text-slate-200">
                  <strong className="text-emerald-400">💡 Cleanup Strategy:</strong>{' '}
                  {analysisResult.actionRecommendation}
                </p>
                <p className="text-slate-400 text-[11px]">
                  <strong className="text-cyan-300">♻️ Recyclability:</strong>{' '}
                  {analysisResult.recyclabilityAssessment}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
