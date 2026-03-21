"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface LogoUploadProps {
  currentLogo?: string | null;
  onUploadSuccess: (newUrl: string) => void;
}

export const LogoUpload = ({ currentLogo, onUploadSuccess }: LogoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor sube un archivo de imagen válido");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/api/auth/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(response.data.clinica_logo_url);
      onUploadSuccess(response.data.clinica_logo_url);
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Error al subir el logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className={`relative group h-48 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden ${
          dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border/50 hover:border-primary/50 bg-secondary/20"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full p-4 flex items-center justify-center bg-white/5 backdrop-blur-sm"
            >
              <img 
                src={preview.startsWith('http') ? preview : `${process.env.NEXT_PUBLIC_API_URL}${preview}`} 
                alt="Logo Clínica" 
                className="max-w-full max-h-full object-contain drop-shadow-2xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-white text-black rounded-xl hover:scale-110 transition-transform font-bold text-xs"
                >
                  Cambiar
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 text-primary">
                <Upload size={24} />
              </div>
              <p className="text-sm font-bold">Arrastra tu logo aquí</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-black">PNG, JPG hasta 5MB</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-secondary text-foreground text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg"
              >
                Seleccionar Archivo
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isUploading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Subiendo...</span>
          </div>
        )}
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
