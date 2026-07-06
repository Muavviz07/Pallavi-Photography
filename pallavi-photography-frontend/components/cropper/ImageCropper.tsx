"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Loader2, X, ShieldAlert, RotateCcw, Crop as CropIcon } from "lucide-react";

interface ImageCropperProps {
  open: boolean;
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (croppedBlob: Blob, title: string, altText: string) => Promise<void>;
  defaultTitle?: string;
  defaultAltText?: string;
  showMetadata?: boolean;
  confirmLabel?: string;
}

function toBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null"));
      },
      "image/jpeg",
      quality
    );
  });
}

async function getCroppedBlob(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  rotation: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // If rotation, draw rotated first
  if (rotation !== 0) {
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const rotW = Math.round(image.naturalWidth * cos + image.naturalHeight * sin);
    const rotH = Math.round(image.naturalWidth * sin + image.naturalHeight * cos);

    const rotCanvas = document.createElement("canvas");
    rotCanvas.width = rotW;
    rotCanvas.height = rotH;
    const rCtx = rotCanvas.getContext("2d")!;
    rCtx.translate(rotW / 2, rotH / 2);
    rCtx.rotate(rad);
    rCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    // Crop from the rotated canvas
    canvas.width = Math.round(pixelCrop.width * scaleX);
    canvas.height = Math.round(pixelCrop.height * scaleY);
    ctx.drawImage(
      rotCanvas,
      Math.round(pixelCrop.x * scaleX),
      Math.round(pixelCrop.y * scaleY),
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
  } else {
    canvas.width = Math.round(pixelCrop.width * scaleX);
    canvas.height = Math.round(pixelCrop.height * scaleY);
    ctx.drawImage(
      image,
      Math.round(pixelCrop.x * scaleX),
      Math.round(pixelCrop.y * scaleY),
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  return toBlob(canvas);
}

export default function ImageCropper({
  open,
  imageSrc,
  onCancel,
  onConfirm,
  defaultTitle = "",
  defaultAltText = "",
  showMetadata = true,
  confirmLabel = "Crop & Save",
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(defaultTitle);
  const [altText, setAltText] = useState(defaultAltText);

  // Reset everything when imageSrc changes
  useEffect(() => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setRotation(0);
    setError("");
    setTitle(defaultTitle);
    setAltText(defaultAltText);
  }, [imageSrc, defaultTitle, defaultAltText]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Start with 100% crop covering full image
    const fullCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 100 }, width / height, width, height),
      width,
      height
    );
    setCrop(fullCrop);
  }, []);

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;
    // If crop width/height is 0, treat as full image
    const px = completedCrop;
    if (px.width === 0 || px.height === 0) return;

    setProcessing(true);
    setError("");
    try {
      const blob = await getCroppedBlob(imgRef.current, px, rotation);
      await onConfirm(blob, title, altText);
    } catch (err: any) {
      setError(err.message || "Crop failed");
      console.error("Crop failed", err);
    } finally {
      setProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div
        className="bg-white border border-[#DCD0C0]/35 rounded-md shadow-2xl flex flex-col"
        style={{ maxWidth: "900px", width: "100%", maxHeight: "95vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 px-5 py-3 shrink-0">
          <div className="flex items-center gap-2 text-[#2C2623]">
            <CropIcon className="w-4 h-4 text-[#C4A484]" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Crop Image</h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-stone-400 font-light hidden sm:block">
              Drag corners or edges to crop · Drag inside to reposition
            </span>
            <button
              onClick={onCancel}
              className="text-[#6E635F] hover:text-[#2C2623] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cropper Canvas — scrollable if image is large */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center bg-[#111] min-h-0"
          style={{ padding: "16px" }}
        >
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            ruleOfThirds
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              crossOrigin="anonymous"
              style={{
                maxWidth: "100%",
                maxHeight: "calc(95vh - 260px)",
                objectFit: "contain",
                display: "block",
                transform: rotation ? `rotate(${rotation}deg)` : undefined,
                transition: "transform 0.2s ease",
              }}
            />
          </ReactCrop>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 border-t border-[#DCD0C0]/20 space-y-4 shrink-0">
          {/* Rotation row */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold w-14">Rotate</span>
            <button
              onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
              className="flex items-center gap-1.5 text-[10px] text-stone-500 hover:text-[#2C2623] border border-[#DCD0C0]/40 rounded-sm px-2 py-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>−90°</span>
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center gap-1.5 text-[10px] text-stone-500 hover:text-[#2C2623] border border-[#DCD0C0]/40 rounded-sm px-2 py-1 cursor-pointer transition-colors"
            >
              <span>+90°</span>
            </button>
            <span className="text-[10px] text-stone-400 font-mono">{rotation}°</span>
            <div className="h-4 w-px bg-stone-200 mx-1" />
            <button
              onClick={() => {
                setRotation(0);
                setCrop(undefined);
                setCompletedCrop(undefined);
                // Re-trigger onImageLoad to reset to full
                if (imgRef.current) {
                  const { width, height } = imgRef.current;
                  const fullCrop = centerCrop(
                    makeAspectCrop({ unit: "%", width: 100 }, width / height, width, height),
                    width,
                    height
                  );
                  setCrop(fullCrop);
                }
              }}
              className="text-[10px] text-stone-400 hover:text-[#2C2623] cursor-pointer uppercase tracking-wider font-medium"
            >
              Reset
            </button>
          </div>

          {/* Metadata */}
          {showMetadata && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-stone-400 font-semibold">
                  Image Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden focus:border-[#C4A484] transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-stone-400 font-semibold">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden focus:border-[#C4A484] transition-colors"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-[10px] text-red-600 font-light bg-red-50 p-2 rounded-sm border border-red-100 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-stone-400 font-light">
              Drag any corner or edge handle to crop • All crops are free-form
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-[#DCD0C0]/40 text-[#6E635F] hover:text-[#2C2623] text-xs rounded-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing || !completedCrop || completedCrop.width === 0}
                className="inline-flex items-center justify-center gap-2 bg-[#2C2623] hover:bg-[#352F2C] text-[#FCFAF7] px-5 py-2 text-xs rounded-sm font-semibold transition-all disabled:opacity-50 min-w-[140px] cursor-pointer"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
