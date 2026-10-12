import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { validateImage, resizeToDataUrl } from '../lib/image';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

export interface ImageUploadProps {
  label?: string;
  helperText?: string;
  aspectRatio: 'square' | '3:1';
  maxSizeMB: number;
  maxWidth: number;
  maxHeight: number;
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  circular?: boolean;
  uploadButtonText?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  helperText,
  aspectRatio,
  maxSizeMB,
  maxWidth,
  maxHeight,
  value,
  onChange,
  circular = false,
  uploadButtonText,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    const validation = validateImage(file, maxSizeMB);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      return;
    }

    setIsProcessing(true);
    try {
      const dataUrl = await resizeToDataUrl(file, maxWidth, maxHeight, 0.8);
      onChange(dataUrl);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error processing image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
      // Reset input value so re-uploading the same file triggers change
      e.target.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMessage(null);
    onChange(undefined);
  };

  const handleTriggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const isSquare = aspectRatio === 'square';

  return (
    <div className="space-y-1.5">
      {(label || helperText) && (
        <div className="flex items-center justify-between">
          {label && <label className="block text-xs font-medium text-white/90">{label}</label>}
          {helperText && <span className="text-[11px] text-[#8d8a9c]">{helperText}</span>}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        // Preview State
        <div
          className={`relative overflow-hidden border border-white/15 bg-[#100f17] group transition-all shrink-0 ${
            circular
              ? 'w-20 h-20 rounded-full'
              : isSquare
              ? 'w-[120px] h-[120px] rounded-2xl'
              : 'w-full aspect-[3/1] rounded-2xl'
          }`}
        >
          <img
            src={value}
            alt={label || 'Uploaded preview'}
            className={`w-full h-full object-cover ${circular ? 'rounded-full' : 'rounded-2xl'}`}
          />

          {/* Action overlay */}
          <div
            className={`absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1 ${
              circular ? 'rounded-full flex-col' : ''
            }`}
          >
            <button
              type="button"
              onClick={handleTriggerBrowse}
              className="p-1 px-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-md"
              title="Replace image"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Replace</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 px-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-md"
              title="Remove image"
            >
              <X className="w-2.5 h-2.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        // Dropzone State
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleTriggerBrowse}
          className={`relative border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shrink-0 ${
            circular
              ? 'w-20 h-20 rounded-full p-2'
              : isSquare
              ? 'w-[120px] h-[120px] rounded-2xl p-4'
              : 'w-full aspect-[3/1] max-h-48 rounded-2xl p-4'
          } ${
            isDragging
              ? 'border-purple-400 bg-purple-950/30'
              : 'border-white/15 hover:border-[#a78bfa]/60 bg-white/5 hover:bg-white/[0.07]'
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-1 text-purple-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[10px] font-medium">Processing…</span>
            </div>
          ) : (
            <>
              <div
                className={`rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform ${
                  circular ? 'w-6 h-6 mb-1' : 'w-8 h-8 mb-1.5'
                }`}
              >
                <UploadCloud className={circular ? 'w-3 h-3' : 'w-4 h-4'} />
              </div>
              <span className={circular ? 'text-[10px] font-semibold text-white/90 leading-tight' : 'text-xs font-semibold text-white/90'}>
                {uploadButtonText || (circular ? 'Upload' : isSquare ? 'Upload logo' : 'Upload banner')}
              </span>
              {!circular && (
                <span className="text-[10px] text-white/40 mt-0.5">
                  Click or drag & drop
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Inline Red Error Text */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-rose-400 text-xs mt-1 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
