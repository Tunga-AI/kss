import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  X, Plus, Edit, Trash2, Search, Filter, Download, Upload, Play, FileText, 
  Image, Link, Eye, ExternalLink, BookOpen, Users, Calendar, Clock, Tags,
  Star, BarChart3, TrendingUp, CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, Volume2, VolumeX, RotateCcw, ZoomIn, ZoomOut, Share2
} from 'lucide-react';
import { 
  ContentResourceService, 
  ContentResource, 
  ContentResourceData,
  ContentResourceFilter 
} from '../../../services/contentService';

// Helper function to format file sizes
const formatFileSize = (bytes?: string) => {
  if (!bytes) return '';
  const size = parseInt(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

interface ContentViewerProps {
  resource: ContentResource;
  onClose: () => void;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ resource, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoQuality, setVideoQuality] = useState('auto');
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const incrementView = async () => {
    await ContentResourceService.incrementViewCount(resource.id);
  };

  const incrementDownload = async () => {
    await ContentResourceService.incrementDownloadCount(resource.id);
  };

  const handleDownload = async () => {
    await incrementDownload();
    const link = document.createElement('a');
    link.href = resource.url;
    link.download = resource.fileName || resource.title;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: resource.title,
          text: resource.description,
          url: resource.url
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(resource.url);
      alert('Link copied to clipboard!');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Enhanced image interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (resource.type === 'image' && zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && resource.type === 'image') {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setImagePosition({
        x: imagePosition.x + deltaX,
        y: imagePosition.y + deltaY
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Video quality optimization
  const updateVideoQuality = (quality: string) => {
    setVideoQuality(quality);
    if (videoRef.current) {
      // In a real implementation, you would switch video sources here
      console.log('Switching to quality:', quality);
    }
  };

  // Auto-hide controls for videos
  useEffect(() => {
    if (resource.type === 'video' && showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, resource.type]);

  // Reset zoom and position when resource changes
  useEffect(() => {
    setZoom(1);
    setImagePosition({ x: 0, y: 0 });
    setCurrentPage(1);
  }, [resource.id]);

  // Mouse wheel zoom for images
  const handleWheel = (e: React.WheelEvent) => {
    if (resource.type === 'image') {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(Math.max(0.25, Math.min(5, zoom + delta)));
    }
  };

  const renderContent = () => {
    switch (resource.type) {
      case 'video':
        return (
          <div
            className="relative bg-black rounded-lg overflow-hidden"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <video
              ref={videoRef}
              src={resource.url}
              className="w-full h-full"
              style={{ transform: `scale(${zoom})` }}
              onLoadedMetadata={incrementView}
              muted={isMuted}
              playsInline
              preload="metadata"
              onRateChange={() => {
                if (videoRef.current) {
                  videoRef.current.playbackRate = playbackSpeed;
                }
              }}
            />

            {/* Enhanced Video Controls */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              {/* Top Controls */}
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                <div className="bg-black bg-opacity-70 rounded-lg p-2 flex items-center space-x-2">
                  <label className="text-white text-xs">Quality:</label>
                  <select
                    value={videoQuality}
                    onChange={(e) => updateVideoQuality(e.target.value)}
                    className="bg-transparent text-white text-xs border border-gray-500 rounded px-1"
                  >
                    <option value="auto">Auto</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                    <option value="360p">360p</option>
                  </select>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-colors"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>

                  <div className="bg-black bg-opacity-70 rounded-lg p-2 flex items-center space-x-2">
                    <label className="text-white text-xs">Speed:</label>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => {
                        const speed = parseFloat(e.target.value);
                        setPlaybackSpeed(speed);
                        if (videoRef.current) {
                          videoRef.current.playbackRate = speed;
                        }
                      }}
                      className="bg-transparent text-white text-xs border border-gray-500 rounded px-1"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">1x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2x</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    className="bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-colors"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                    className="bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-colors"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
            <iframe
              ref={iframeRef}
              src={`${resource.url}#view=FitH&page=${currentPage}&zoom=${Math.round(zoom * 100)}`}
              className="w-full h-full border-none"
              onLoad={incrementView}
              title={resource.title}
            />

            {/* Enhanced PDF Controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              {/* Page Navigation */}
              <div className="bg-white bg-opacity-95 rounded-lg p-2 flex items-center space-x-2 shadow-md">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-gray-700 px-2">
                  Page {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Zoom and View Controls */}
              <div className="bg-white bg-opacity-95 rounded-lg p-2 flex items-center space-x-2 shadow-md">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-gray-700 px-2 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button
                  onClick={() => setZoom(1)}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors text-xs"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Download PDF"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* PDF Loading Indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading PDF...</p>
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div
            className="relative bg-gray-100 rounded-lg overflow-hidden"
            style={{ minHeight: '400px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <div className="flex items-center justify-center h-full p-4">
              <img
                ref={imageRef}
                src={resource.url}
                alt={resource.title}
                className={`max-w-full max-h-full object-contain transition-transform duration-200 ${isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-default'}`}
                style={{
                  transform: `scale(${zoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                  transformOrigin: 'center center'
                }}
                onLoad={incrementView}
                draggable={false}
              />
            </div>

            {/* Enhanced Image Controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              {/* Image Info */}
              <div className="bg-white bg-opacity-95 rounded-lg p-2 shadow-md">
                <p className="text-xs font-medium text-gray-700">
                  {resource.fileName || resource.title}
                </p>
              </div>

              {/* Zoom and View Controls */}
              <div className="bg-white bg-opacity-95 rounded-lg p-2 flex items-center space-x-2 shadow-md">
                <button
                  onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-gray-700 px-2 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(5, zoom + 0.25))}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button
                  onClick={() => {
                    setZoom(1);
                    setImagePosition({ x: 0, y: 0 });
                  }}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Reset View"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Download Image"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={handleShare}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Share Image"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Zoom Instructions */}
            {zoom > 1 && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs">
                Drag to pan • Scroll to zoom
              </div>
            )}
          </div>
        );

      case 'link':
        return (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
              <Link className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{resource.title}</h3>
            <p className="text-gray-600 mb-4">{resource.description}</p>
            <button
              onClick={() => { incrementView(); window.open(resource.url, '_blank'); }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Visit Link</span>
            </button>
          </div>
        );

      case 'article':
        return (
          <div className="bg-white rounded-lg p-6 max-h-96 overflow-y-auto">
            <iframe
              src={resource.url}
              className="w-full h-full border-none"
              onLoad={incrementView}
            />
          </div>
        );

      default:
        return (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{resource.title}</h3>
            <p className="text-gray-600 mb-4">{resource.description}</p>
            <button
              onClick={handleDownload}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white rounded-lg max-w-4xl w-full max-h-full overflow-hidden ${isFullscreen ? 'h-full max-w-none rounded-none' : 'h-auto'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              {resource.type === 'video' && <Play className="h-5 w-5 text-primary-600" />}
              {resource.type === 'pdf' && <FileText className="h-5 w-5 text-primary-600" />}
              {resource.type === 'image' && <Image className="h-5 w-5 text-primary-600" />}
              {resource.type === 'link' && <Link className="h-5 w-5 text-primary-600" />}
              {resource.type === 'article' && <BookOpen className="h-5 w-5 text-primary-600" />}
              {resource.type === 'other' && <FileText className="h-5 w-5 text-primary-600" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{resource.title}</h2>
              <p className="text-sm text-gray-600 capitalize">{resource.type}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`p-4 ${isFullscreen ? 'h-full' : ''}`}>
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Views: {resource.viewCount || 0}</span>
              <span>Downloads: {resource.downloadCount || 0}</span>
              {resource.fileSize && (
                <span>Size: {formatFileSize(resource.fileSize)}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {resource.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Resource: React.FC = () => {
  const navigate = useNavigate();
  const { intakeId } = useParams();
  const [activeTab, setActiveTab] = useState<'library' | 'create' | 'analytics'>('library');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'pdf' | 'article' | 'link' | 'image' | 'other'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewingResource, setViewingResource] = useState<ContentResource | null>(null);

  // File upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data states
  const [resources, setResources] = useState<ContentResource[]>([]);

  // Stats
  const [stats, setStats] = useState([
    { title: 'Total Resources', value: '0', change: '+0', icon: BookOpen, color: 'primary' },
    { title: 'Videos', value: '0', change: '+0', icon: Play, color: 'accent' },
    { title: 'Documents', value: '0', change: '+0', icon: FileText, color: 'secondary' },
    { title: 'This Week', value: '0', change: '+0', icon: Calendar, color: 'blue' },
  ]);

  // Form state
  const [resourceForm, setResourceForm] = useState<ContentResourceData>({
    title: '',
    description: '',
    type: 'pdf',
    url: '',
    tags: [],
    intakeId: intakeId || '',
    isPublic: true,
    status: 'draft'
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newTag, setNewTag] = useState('');

  const tabs = [
    { id: 'library', label: 'Content Library', icon: BookOpen },
    { id: 'create', label: 'Create Resource', icon: Plus },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  useEffect(() => {
    loadResources();
    loadStats();
  }, [intakeId, typeFilter, statusFilter]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const filter: ContentResourceFilter = {};
      if (intakeId) filter.intakeId = intakeId;
      if (typeFilter !== 'all') filter.type = typeFilter;
      if (statusFilter !== 'all') filter.status = statusFilter;
      if (searchTerm) filter.searchTerm = searchTerm;

      const result = await ContentResourceService.getResources(filter);
      if (result.success && result.data) {
        setResources(result.data);
      }
    } catch (error) {
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await ContentResourceService.getResourceStats();
      if (result.success && result.data) {
        const videoCount = resources.filter(r => r.type === 'video').length;
        const docCount = resources.filter(r => ['pdf', 'article', 'other'].includes(r.type)).length;
        const thisWeekCount = resources.filter(r => {
          const created = new Date(r.uploadedAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length;

        setStats([
          { title: 'Total Resources', value: result.data.totalResources.toString(), change: '+2', icon: BookOpen, color: 'primary' },
          { title: 'Videos', value: videoCount.toString(), change: '+1', icon: Play, color: 'accent' },
          { title: 'Documents', value: docCount.toString(), change: '+3', icon: FileText, color: 'secondary' },
          { title: 'This Week', value: thisWeekCount.toString(), change: `+${thisWeekCount}`, icon: Calendar, color: 'blue' },
        ]);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (selectedFile) {
        // Upload with file
        const fileData = {
          title: resourceForm.title,
          description: resourceForm.description,
          type: resourceForm.type,
          tags: resourceForm.tags,
          intakeId: resourceForm.intakeId,
          week: resourceForm.week,
          isPublic: resourceForm.isPublic,
          status: resourceForm.status
        };
        
        result = await ContentResourceService.createResourceWithFile(fileData, selectedFile, 'current_user_id');
      } else {
        // Create with URL
        result = editingResource
          ? await ContentResourceService.updateResource(editingResource, resourceForm)
          : await ContentResourceService.createResource(resourceForm, 'current_user_id');
      }

      if (result.success) {
        setSuccess(editingResource ? 'Resource updated successfully' : 'Resource created successfully');
        setShowForm(false);
        setEditingResource(null);
        resetForm();
        loadResources();
        loadStats();
      } else {
        setError(result.error || 'Failed to save resource');
      }
    } catch (error) {
      setError('Failed to save resource');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setSelectedFile(file);
    
    // Auto-detect content type
    const type = file.type.startsWith('video/') ? 'video' 
      : file.type.startsWith('image/') ? 'image'
      : file.type === 'application/pdf' ? 'pdf'
      : 'other';
    
    setResourceForm(prev => ({
      ...prev,
      type,
      title: prev.title || file.name.split('.')[0],
      url: '' // Will be set during upload
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    setLoading(true);
    try {
      const result = await ContentResourceService.deleteResource(id);
      if (result.success) {
        setSuccess('Resource deleted successfully');
        loadResources();
        loadStats();
      } else {
        setError(result.error || 'Failed to delete resource');
      }
    } catch (error) {
      setError('Failed to delete resource');
    } finally {
      setLoading(false);
    }
  };

  const loadResource = async (id: string) => {
    try {
      const result = await ContentResourceService.getResource(id);
      if (result.success && result.data) {
        setResourceForm({
          title: result.data.title,
          description: result.data.description,
          type: result.data.type,
          url: result.data.url,
          tags: result.data.tags,
          intakeId: result.data.intakeId,
          week: result.data.week,
          isPublic: result.data.isPublic,
          status: result.data.status
        });
        setEditingResource(id);
        setActiveTab('create');
        setShowForm(true);
      }
    } catch (error) {
      setError('Failed to load resource');
    }
  };

  const resetForm = () => {
    setResourceForm({
      title: '',
      description: '',
      type: 'pdf',
      url: '',
      tags: [],
      intakeId: intakeId || '',
      isPublic: true,
      status: 'draft'
    });
    setSelectedFile(null);
    setNewTag('');
  };

  const addTag = () => {
    if (newTag.trim() && !resourceForm.tags.includes(newTag.trim())) {
      setResourceForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setResourceForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'pdf': return FileText;
      case 'article': return BookOpen;
      case 'link': return Link;
      case 'image': return Image;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Search handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadResources();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-emerald-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Content Resources</h1>
            <p className="text-lg text-emerald-100">
              Digital learning materials, documents, and multimedia content.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-emerald-200">{stat.change}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Viewer Modal */}
      {viewingResource && (
        <ContentViewer
          resource={viewingResource}
          onClose={() => setViewingResource(null)}
        />
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* Content Library Tab */}
          {activeTab === 'library' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">All Types</option>
                    <option value="video">Videos</option>
                    <option value="pdf">PDFs</option>
                    <option value="image">Images</option>
                    <option value="link">Links</option>
                    <option value="article">Articles</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Resource</span>
                </button>
              </div>

              {/* Resources Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading resources...</p>
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No resources found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'No resources have been uploaded yet.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Upload First Resource
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Resource
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Views
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Downloads
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tags
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredResources.map((resource) => {
                          const Icon = getTypeIcon(resource.type);
                          return (
                            <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-4">
                                  <div className="bg-emerald-100 p-2 rounded-lg flex-shrink-0">
                                    <Icon className="h-5 w-5 text-emerald-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {resource.title}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                      {resource.description}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                  {resource.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {formatFileSize(resource.fileSize)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <div className="flex items-center space-x-1">
                                  <Eye className="h-4 w-4 text-gray-400" />
                                  <span>{resource.viewCount || 0}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <div className="flex items-center space-x-1">
                                  <Download className="h-4 w-4 text-gray-400" />
                                  <span>{resource.downloadCount || 0}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(resource.status)}`}>
                                  {resource.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {resource.tags.slice(0, 3).map((tag, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      {tag}
                                    </span>
                                  ))}
                                  {resource.tags.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      +{resource.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => setViewingResource(resource)}
                                    className="text-emerald-600 hover:text-emerald-900 transition-colors"
                                    title="View Resource"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => loadResource(resource.id)}
                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                    title="Edit Resource"
                                  >
                                    <Edit className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(resource.id)}
                                    className="text-red-600 hover:text-red-900 transition-colors"
                                    title="Delete Resource"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create Resource Tab */}
          {activeTab === 'create' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingResource ? 'Edit Resource' : 'Create New Resource'}
                </h2>
                {editingResource && (
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm({...resourceForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Enter resource title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      required
                      value={resourceForm.type}
                      onChange={(e) => setResourceForm({...resourceForm, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="video">Video</option>
                      <option value="image">Image</option>
                      <option value="link">Web Link</option>
                      <option value="article">Article</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Describe the resource"
                  />
                </div>

                {/* File Upload or URL Input */}
                {!selectedFile ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload File or Enter URL
                    </label>
                    <div className="space-y-4">
                      {/* File Drop Zone */}
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload a file</h3>
                        <p className="text-gray-600 mb-4">Drag and drop your file here, or click to browse</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files)}
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                        >
                          Choose File
                        </button>
                      </div>

                      {/* URL Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Or enter a URL
                        </label>
                        <input
                          type="url"
                          value={resourceForm.url}
                          onChange={(e) => setResourceForm({...resourceForm, url: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="https://example.com/resource"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{selectedFile.name}</p>
                          <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size.toString())}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {resourceForm.tags.map((tag, index) => (
                        <span key={index} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-emerald-600 hover:text-emerald-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Add a tag..."
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Week
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={resourceForm.week || ''}
                      onChange={(e) => setResourceForm({...resourceForm, week: parseInt(e.target.value) || undefined})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Week number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      required
                      value={resourceForm.status}
                      onChange={(e) => setResourceForm({...resourceForm, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={resourceForm.isPublic}
                    onChange={(e) => setResourceForm({...resourceForm, isPublic: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                    Make this resource publicly accessible
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingResource ? 'Update' : 'Create'} Resource
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Resource Analytics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Total Views</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {resources.reduce((sum, r) => sum + (r.viewCount || 0), 0)}
                        </p>
                        <p className="text-sm text-blue-700">Across all resources</p>
                      </div>
                      <Eye className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">Total Downloads</p>
                        <p className="text-2xl font-bold text-green-600">
                          {resources.reduce((sum, r) => sum + (r.downloadCount || 0), 0)}
                        </p>
                        <p className="text-sm text-green-700">Across all resources</p>
                      </div>
                      <Download className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-900">Published Resources</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {resources.filter(r => r.status === 'published').length}
                        </p>
                        <p className="text-sm text-purple-700">Ready for use</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Resources</h3>
                <div className="space-y-3">
                  {resources
                    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                    .slice(0, 5)
                    .map((resource) => {
                      const Icon = getTypeIcon(resource.type);
                      return (
                        <div key={resource.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="bg-emerald-100 p-2 rounded-lg">
                            <Icon className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{resource.title}</p>
                            <p className="text-xs text-gray-500 capitalize">{resource.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-800">{resource.viewCount || 0} views</p>
                            <p className="text-xs text-gray-500">{resource.downloadCount || 0} downloads</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resource; 