import React, { useRef, useState } from 'react';
import './ImageUpload.css';
import { useLanguage } from '../contexts/LanguageContext';
import imageCompression from 'browser-image-compression';

export default function ImageUpload({ images, setImages, readOnly = false }) {
  const { language } = useLanguage();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleFiles = async (files) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    const options = {
      maxSizeMB: 1, // Compress to max 1MB
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };

    const compressedImages = [];
    for (const file of validFiles) {
      try {
        const compressedFile = await imageCompression(file, options);
        compressedImages.push({
          file: compressedFile,
          preview: URL.createObjectURL(compressedFile)
        });
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original if compression fails
        compressedImages.push({
          file,
          preview: URL.createObjectURL(file)
        });
      }
    }
    
    setImages(prev => [...prev, ...compressedImages]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (!readOnly) setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!readOnly && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    e.target.value = ''; // Reset input
  };

  const removeImage = (index) => {
    if (readOnly) return;
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  return (
    <div className={`image-upload-wrapper ${readOnly ? 'read-only' : ''}`}>
      {!readOnly && (
        <div className="image-upload-header">
          <h4>{language === 'zh' ? '设备状态照片 (必填)' : 'Equipment Status Photos (Mandatory)'}</h4>
          <p>
            {language === 'zh' 
              ? '请上传至少一张设备保养完成后的状态照片' 
              : 'Please upload at least one photo showing the completed maintenance status'}
          </p>
        </div>
      )}

      {!readOnly && (
        <div 
          className={`image-upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={onFileSelect}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />
          <div className="upload-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <p className="upload-text">
            {language === 'zh' ? '点击或拖拽图片到此区域上传' : 'Click or drag images here to upload'}
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div className="image-preview-grid" style={readOnly ? { marginTop: 0, padding: '10px 0' } : {}}>
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className="image-preview-card" 
              style={readOnly ? { width: '120px', height: '120px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' } : { cursor: 'pointer' }}
              onClick={() => setPreviewImage(img.preview || img.url)}
            >
              <img src={img.preview || img.url} alt={`upload-${idx}`} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              {!readOnly && (
                <button 
                  type="button" 
                  className="btn-remove-image" 
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {previewImage && (
        <div className="image-preview-modal" onClick={() => setPreviewImage(null)}>
          <button className="image-preview-close" onClick={() => setPreviewImage(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <img src={previewImage} alt="Fullscreen Preview" className="image-preview-full" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
