"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';

import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

interface UploadProps {
  onUploadSuccess?: () => void;
  user?: User | null;
}

interface DocumentInfo {
  id: string;
  name: string;
  size: number;
  uploadedAt: any;
}

export default function UploadDocument({ onUploadSuccess, user }: UploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/documents`), orderBy('uploadedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: DocumentInfo[] = [];
      snapshot.forEach((docSnap) => {
        docs.push({ id: docSnap.id, ...docSnap.data() } as DocumentInfo);
      });
      setDocuments(docs);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (docId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/documents`, docId));
    } catch (err) {
      console.error("Failed to delete document record", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    setSuccess(false);
    
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size allowed is 5MB.");
      setFile(null);
      return;
    }
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload a PDF, JPG, or PNG.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = user ? await user.getIdToken() : "mock_token"; 

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (user) {
        await addDoc(collection(db, `users/${user.uid}/documents`), {
          name: file.name,
          size: file.size,
          uploadedAt: serverTimestamp()
        });
      }

      setSuccess(true);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.response?.data?.detail || "An error occurred while uploading.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto glassmorphism rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        Analyze Legal Document
      </h2>
      
      {!file ? (
        <div 
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload document area"
        >
          <Upload className="w-10 h-10 mx-auto text-gray-400 mb-4" />
          <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500">PDF, JPG, or PNG (max. 5MB)</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,image/jpeg,image/png"
          />
        </div>
      ) : (
        <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="truncate">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button 
            onClick={() => { setFile(null); setSuccess(false); setError(null); }}
            className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Remove file"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <p>Document uploaded and analyzed successfully! You can now ask questions about it.</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={cn(
            "px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm",
            (!file || isUploading) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploading ? "Processing..." : "Upload & Analyze"}
        </button>
      </div>

      {documents.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Your Documents</h3>
          <div className="flex flex-col gap-3">
            {documents.map((docItem) => (
              <div key={docItem.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{docItem.name}</p>
                    <p className="text-xs text-slate-500">{(docItem.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(docItem.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remove from history"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
