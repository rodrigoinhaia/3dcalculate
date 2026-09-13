import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, Link as LinkIcon, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { compressAndResizeImage } from '../../utils/imageCompressor';

export const ImageUploader = ({ value = '', onChange, label = 'Foto da Peça / Produto', hint }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '');
  const fileInputRef = useRef(null);

  const handleFileProcess = async (file) => {
    if (!file) return;
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const result = await compressAndResizeImage(file, 800, 0.82);
      onChange(result.dataUrl);
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao processar imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setErrorMessage('');
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-uploader-root">
      <div className="image-uploader-header">
        <label className="form-label">{label}</label>
        <div className="image-uploader-mode-toggle">
          <button 
            type="button" 
            className={`uploader-toggle-btn ${mode === 'upload' ? 'active' : ''}`}
            onClick={() => setMode('upload')}
          >
            <UploadCloud size={13} />
            Arquivo / Câmera
          </button>
          <button 
            type="button" 
            className={`uploader-toggle-btn ${mode === 'url' ? 'active' : ''}`}
            onClick={() => setMode('url')}
          >
            <LinkIcon size={13} />
            Link da Web
          </button>
        </div>
      </div>

      {hint && <span className="form-label-hint" style={{ marginBottom: '8px', display: 'block' }}>{hint}</span>}

      {/* Se já tiver imagem carregada: mostra Preview */}
      {value ? (
        <div className="image-preview-card">
          <div className="image-preview-thumbnail-wrapper">
            <img 
              src={value} 
              alt="Prévia do produto" 
              className="image-preview-thumbnail"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80';
              }}
            />
            {value.startsWith('data:') && (
              <div className="image-badge-optimized" title="Imagem armazenada no banco com compressão automática">
                <CheckCircle2 size={12} />
                Offline-Ready
              </div>
            )}
          </div>

          <div className="image-preview-details">
            <p className="image-preview-title">Foto do Produto Selecionada</p>
            <p className="image-preview-desc">
              {value.startsWith('data:') 
                ? 'Armazenada localmente e sincronizada no PostgreSQL.'
                : 'Vinculada via URL externa.'}
            </p>
            <div className="image-preview-actions">
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => {
                  if (mode === 'upload' && fileInputRef.current) {
                    fileInputRef.current.click();
                  } else {
                    handleRemove();
                  }
                }}
              >
                <RefreshCw size={13} />
                Trocar Foto
              </button>
              <button 
                type="button" 
                className="btn btn-danger btn-sm"
                onClick={handleRemove}
              >
                <Trash2 size={13} />
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : mode === 'upload' ? (
        /* Dropzone para Arquivo / Celular */
        <div 
          className={`image-dropzone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {isProcessing ? (
            <div className="image-dropzone-content">
              <RefreshCw size={32} className="spin-animation text-amber" />
              <p className="dropzone-title">Otimizando e comprimindo imagem...</p>
              <p className="dropzone-sub">Reduzindo para carregamento instantâneo offline</p>
            </div>
          ) : (
            <div className="image-dropzone-content">
              <div className="dropzone-icon-box">
                <UploadCloud size={24} color="var(--cyan-neon)" />
              </div>
              <p className="dropzone-title">
                <strong>Clique para escolher</strong> ou arraste uma foto aqui
              </p>
              <p className="dropzone-sub">
                Tire uma foto no celular ou envie do PC (PNG, JPG, WebP)
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Modo URL Externa */
        <div className="image-url-input-box">
          <div className="input-with-affix" style={{ flex: 1 }}>
            <span className="affix affix-prefix">
              <LinkIcon size={14} />
            </span>
            <input 
              type="url" 
              className="form-input" 
              placeholder="https://images.unsplash.com/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyUrl(); } }}
            />
          </div>
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={handleApplyUrl}
          >
            Aplicar
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="image-upload-error">
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
