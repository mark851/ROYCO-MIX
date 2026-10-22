import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Layers,
  AlertCircle,
  Eye,
} from 'lucide-react';

export interface PresetImage {
  id: string;
  title: string;
  category: string;
  url: string;
}

export const ROYCO_PRESET_IMAGES: PresetImage[] = [
  {
    id: 'preset-1',
    title: 'Trial Sachet Sealer Line',
    category: 'Trial',
    url: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'preset-2',
    title: 'Pocket Blend Seasoning Mill',
    category: 'Micro Line',
    url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'preset-3',
    title: 'Portable Mini Pulverizer',
    category: 'Processing',
    url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'preset-4',
    title: 'Savory Aroma Condensation Plant',
    category: 'Condensation',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'preset-5',
    title: 'Commercial Sachet Conveyor Packaging',
    category: 'Industrial',
    url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'preset-6',
    title: 'Industrial Cube Hydraulic Press',
    category: 'VIP Press',
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'preset-7',
    title: 'Regional Agri-Processing Warehouse',
    category: 'Harvest Plant',
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'preset-8',
    title: 'Automatic Spice Homogenizer Tank',
    category: 'Blending Tank',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'preset-9',
    title: 'Automated Factory Inspection Line',
    category: 'Robotics',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'preset-10',
    title: 'Paprika & Coriander Processing Line',
    category: 'Culinary Line',
    url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=600&q=80',
  },
];

const LOCAL_RECENT_IMAGES_KEY = 'royco_recent_images_v2';

// Helper to compress images on the fly with HTML Canvas
export async function compressImageFile(file: File, maxDimension = 800, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Fill background in white for transparent PNGs converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface ImageUploadManagerProps {
  imageUrl: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  helperText?: string;
  defaultPlaceholder?: string;
}

export const ImageUploadManager: React.FC<ImageUploadManagerProps> = ({
  imageUrl,
  onChange,
  onRemove,
  label = 'Product Image',
  helperText = 'Upload a photo from your phone/computer, select a preset, or paste a URL.',
  defaultPlaceholder = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url' | 'recent'>('upload');
  const [urlInput, setUrlInput] = useState(imageUrl || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load recent images from localStorage
  const [recentImages, setRecentImages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_RECENT_IMAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 16);
      }
    } catch {}
    return [
      'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    ];
  });

  // Sync urlInput if prop changes externally
  useEffect(() => {
    setUrlInput(imageUrl || '');
  }, [imageUrl]);

  // Save recent image helper
  const addRecentImage = (url: string) => {
    if (!url) return;
    setRecentImages((prev) => {
      const filtered = prev.filter((item) => item !== url);
      const updated = [url, ...filtered].slice(0, 16);
      try {
        localStorage.setItem(LOCAL_RECENT_IMAGES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Remove a specific image from recent images
  const handleRemoveRecentImage = (e: React.MouseEvent, urlToRemove: string) => {
    e.stopPropagation();
    setRecentImages((prev) => {
      const updated = prev.filter((item) => item !== urlToRemove);
      try {
        localStorage.setItem(LOCAL_RECENT_IMAGES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setUploadFeedback('Removed image from recent history');
    setTimeout(() => setUploadFeedback(null), 2500);
  };

  // Clear all recent images
  const handleClearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentImages([]);
    try {
      localStorage.removeItem(LOCAL_RECENT_IMAGES_KEY);
    } catch {}
    setUploadFeedback('Cleared all recent images');
    setTimeout(() => setUploadFeedback(null), 2500);
  };

  // Handle direct file selection
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadFeedback('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setIsProcessing(true);
    setUploadFeedback('Optimizing & compressing image for instant mobile display...');

    try {
      const compressedDataUrl = await compressImageFile(file, 800, 0.78);
      onChange(compressedDataUrl);
      addRecentImage(compressedDataUrl);
      setUrlInput(compressedDataUrl);
      setUploadFeedback('Image uploaded and optimized successfully!');
      setTimeout(() => setUploadFeedback(null), 3000);
    } catch (err) {
      console.error('Image compression failed:', err);
      setUploadFeedback('Failed to process image. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    addRecentImage(urlInput.trim());
    setUploadFeedback('URL applied successfully!');
    setTimeout(() => setUploadFeedback(null), 2500);
  };

  const handleRemoveImage = () => {
    onChange('');
    setUrlInput('');
    if (onRemove) {
      onRemove();
    }
    setUploadFeedback('Image removed from item.');
    setTimeout(() => setUploadFeedback(null), 2500);
  };

  const handleSelectPreset = (url: string) => {
    onChange(url);
    setUrlInput(url);
    addRecentImage(url);
    setUploadFeedback('Preset image selected!');
    setTimeout(() => setUploadFeedback(null), 2500);
  };

  const hasImage = Boolean(imageUrl && imageUrl.trim().length > 0);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>{label}</span>
        </label>
        {hasImage && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition active:scale-95"
            title="Remove and clear this image"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove Image</span>
          </button>
        )}
      </div>

      {/* Current Preview Card */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center gap-3">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0 flex items-center justify-center group">
          {hasImage ? (
            <>
              <img
                src={imageUrl}
                alt="Product Preview"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultPlaceholder;
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-500 transition shadow-xs"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-2 text-center text-slate-500">
              <ImageIcon className="w-6 h-6 stroke-[1.5] mb-1" />
              <span className="text-[9px] font-medium leading-tight">No image</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                hasImage
                  ? imageUrl.startsWith('data:')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {hasImage
                ? imageUrl.startsWith('data:')
                  ? 'Device Upload'
                  : 'Web / Preset'
                : 'No Image Attached'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate font-mono">
            {hasImage ? imageUrl.slice(0, 48) + '...' : 'Select an image option below'}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> Change Photo
            </button>
            {hasImage && (
              <>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {uploadFeedback && (
        <div className="text-xs px-3 py-1.5 rounded-xl bg-blue-900/40 border border-blue-500/30 text-blue-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>{uploadFeedback}</span>
        </div>
      )}

      {/* Tabs for Image Selection */}
      <div className="border border-slate-700/80 rounded-2xl bg-slate-900/60 p-2.5 space-y-2.5">
        <div className="flex border-b border-slate-800 pb-2 gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Device</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 relative ${
              activeTab === 'recent'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recent Images</span>
            {recentImages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-700 text-white">
                {recentImages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'presets'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Royco Presets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'url'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Paste URL</span>
          </button>
        </div>

        {/* 1. UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                dragActive
                  ? 'border-blue-400 bg-blue-900/20'
                  : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/40'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white mb-0.5">
                {isProcessing ? 'Compressing & uploading...' : 'Click to select photo or drag here'}
              </div>
              <p className="text-[11px] text-slate-400">
                Supports camera capture & gallery on phone (auto-optimized under 100KB)
              </p>
            </div>
          </div>
        )}

        {/* 2. RECENT IMAGES TAB */}
        {activeTab === 'recent' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Recently uploaded & used images:</span>
              {recentImages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllRecent}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-bold hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear History
                </button>
              )}
            </div>

            {recentImages.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No recent images recorded yet. Upload a photo or choose a preset above.
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                {recentImages.map((imgUrl, index) => {
                  const isSelected = imageUrl === imgUrl;
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        onChange(imgUrl);
                        setUrlInput(imgUrl);
                        setUploadFeedback('Recent image applied!');
                        setTimeout(() => setUploadFeedback(null), 2500);
                      }}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border group transition ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Recent ${index}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />

                      {/* Remove this specific recent image button */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecentImage(e, imgUrl)}
                        className="absolute top-1 right-1 p-1 rounded-md bg-rose-600/90 text-white hover:bg-rose-500 transition shadow-sm opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Remove recent image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      {isSelected && (
                        <div className="absolute bottom-1 left-1 bg-blue-600 text-white rounded-full p-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400">
              Official Royco Mix industrial and seasoning equipment presets:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {ROYCO_PRESET_IMAGES.map((preset) => {
                const isSelected = imageUrl === preset.url;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.url)}
                    className={`rounded-xl border p-1.5 cursor-pointer transition flex items-center gap-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.title}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white truncate">{preset.title}</div>
                      <div className="text-[9px] text-amber-400 uppercase font-bold">{preset.category}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. URL TAB */}
        {activeTab === 'url' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 transition active:scale-95 shadow-xs"
              >
                Apply URL
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Paste any secure direct HTTPS image URL from Unsplash, Imgur, or your CDN.
            </p>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-500">{helperText}</p>
    </div>
  );
};
