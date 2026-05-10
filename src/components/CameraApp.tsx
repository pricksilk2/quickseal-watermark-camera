import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Download, Zap, Info, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CameraApp() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [watermarkTime, setWatermarkTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate random time between 20:50 and 21:30
  const generateRandomTime = useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const startDecimal = 20 * 60 + 50;
    const endDecimal = 21 * 60 + 30;
    const randomDecimal = Math.floor(Math.random() * (endDecimal - startDecimal + 1)) + startDecimal;
    
    const hours = Math.floor(randomDecimal / 60);
    const minutes = randomDecimal % 60;
    
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return `${year}-${month}-${day} ${timeStr}`;
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setIsCameraReady(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const applyWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const randomTime = generateRandomTime();
    setWatermarkTime(randomTime);

    // Update font style: white, non-italic, with location pin
    const fontSize = Math.floor(width / 24);
    ctx.font = `900 ${fontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'; 
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = width / 500;
    
    const padding = width / 20;
    const address = "太原天美杉杉奥特莱斯";
    const watermarkText = `${address} 📍 ${randomTime}`;
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;
    
    ctx.strokeText(watermarkText, padding, height - padding);
    ctx.fillText(watermarkText, padding, height - padding);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      applyWatermark(context, canvas.width, canvas.height);

      setIsFlashActive(true);
      setTimeout(() => setIsFlashActive(false), 150);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          applyWatermark(context, canvas.width, canvas.height);
          setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const downloadPhoto = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `watermark_${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-natural-bg flex flex-col items-center p-6 sm:p-8 font-sans text-natural-ink">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-natural-olive rounded-full flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-white rounded-full"></div>
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-natural-ink">InstantMark PWA</h1>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 bg-natural-soft-gray px-4 py-2 rounded-full text-[10px] font-semibold text-natural-olive uppercase tracking-wider">
          <div className="w-1.5 h-1.5 bg-natural-olive rounded-full"></div>
          Auto-Window: 20:50 - 21:30
        </div>
      </header>

      {/* Viewfinder Container */}
      <div className="relative w-full flex-1 min-h-0 bg-natural-soft-gray rounded-[32px] overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] border border-natural-soft-gray">
        {!capturedImage ? (
          <div className="w-full h-full relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
              <div className="w-[80%] h-[60%] border-[0.5px] border-natural-ink relative">
                <div className="absolute top-0 left-1/3 bottom-0 border-l border-natural-ink"></div>
                <div className="absolute top-0 left-2/3 bottom-0 border-l border-natural-ink"></div>
                <div className="absolute left-0 top-1/3 right-0 border-t border-natural-ink"></div>
                <div className="absolute left-0 top-2/3 right-0 border-t border-natural-ink"></div>
              </div>
            </div>
            
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-white font-bold">Live</span>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={capturedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full bg-natural-ink"
            >
              <img
                src={capturedImage}
                className="w-full h-full object-contain"
                alt="Result"
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Flash Effect */}
        <AnimatePresence>
          {isFlashActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-natural-bg/90 px-10 text-center z-10 backdrop-blur-sm">
            <div className="space-y-4">
              <p className="text-sm text-natural-olive font-medium">{error}</p>
              <button 
                onClick={startCamera}
                className="px-6 py-2 bg-natural-olive text-white text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg hover:opacity-90 active:scale-95 transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls panel */}
      <div className="w-full h-40 flex items-center justify-center gap-12 sm:gap-16">
        {!capturedImage ? (
          <>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-natural-paper flex items-center justify-center shadow-sm border border-natural-soft-gray text-natural-olive hover:bg-zinc-50 active:scale-90 transition-all"
            >
              <Upload size={20} />
            </button>
            
            <button
              onClick={capturePhoto}
              className="w-24 h-24 rounded-full border-[3px] border-natural-olive flex items-center justify-center transition-transform active:scale-90"
            >
              <div className="w-[72px] h-[72px] rounded-full bg-natural-olive shadow-lg hover:opacity-90 transition-opacity"></div>
            </button>

            <button 
              onClick={startCamera}
              className="w-12 h-12 rounded-full bg-natural-paper flex items-center justify-center shadow-sm border border-natural-soft-gray text-natural-olive hover:bg-zinc-50 active:scale-90 transition-all"
            >
              <RefreshCw size={20} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="flex w-full gap-4">
              <button
                onClick={() => setCapturedImage(null)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-natural-paper border border-natural-soft-gray text-natural-ink rounded-full font-sans text-[11px] font-semibold uppercase tracking-widest shadow-sm hover:bg-zinc-50 active:scale-95 transition-all"
              >
                <X size={16} className="text-natural-olive" /> Discard
              </button>
              <button
                onClick={downloadPhoto}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-natural-olive text-white rounded-full font-sans text-[11px] font-bold uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all"
              >
                <Download size={16} /> Save photo
              </button>
            </div>
          </div>
        )}
      </div>

      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
