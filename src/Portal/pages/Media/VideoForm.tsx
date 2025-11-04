import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus, Save, Eye, Play, Clock, Link as LinkIcon } from 'lucide-react';
import { mediaService } from '../../../services/mediaService';
import { Video, MediaCategory } from '../../../types/media';
import { useAuthContext } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/LoadingSpinner';

const VideoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const isEdit = id && id !== 'new';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [categories, setCategories] = useState<MediaCategory[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'archived',
    videoUrl: '',
    thumbnailUrl: '',
    duration: 0,
    embedUrl: '',
    transcript: ''
  });
  
  const [newTag, setNewTag] = useState('');
  const [videoType, setVideoType] = useState<'upload' | 'youtube' | 'vimeo' | 'external'>('upload');

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchVideo();
    }
  }, [id, isEdit]);

  const fetchCategories = async () => {
    try {
      const categoriesData = await mediaService.getCategories('video');
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchVideo = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const video = await mediaService.getMediaById(id) as Video;
      if (video && video.type === 'video') {
        setFormData({
          title: video.title,
          description: video.description,
          category: video.category,
          tags: video.tags,
          status: video.status,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          embedUrl: video.embedUrl || '',
          transcript: video.transcript || ''
        });
        
        // Determine video type based on URL
        if (video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be')) {
          setVideoType('youtube');
        } else if (video.videoUrl.includes('vimeo.com')) {
          setVideoType('vimeo');
        } else if (video.videoUrl.startsWith('http')) {
          setVideoType('external');
        } else {
          setVideoType('upload');
        }
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      alert('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVideoUpload = async (file: File) => {
    try {
      setUploadingVideo(true);
      const url = await mediaService.uploadVideo(file, 'videos');
      setFormData(prev => ({ ...prev, videoUrl: url }));
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    try {
      setUploadingThumbnail(true);
      const url = await mediaService.uploadImage(file, 'videos/thumbnails');
      setFormData(prev => ({ ...prev, thumbnailUrl: url }));
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      alert('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const parseYouTubeUrl = (url: string) => {
    const videoId = url.includes('youtube.com/watch') 
      ? url.split('v=')[1]?.split('&')[0]
      : url.split('youtu.be/')[1]?.split('?')[0];
    
    if (videoId) {
      return {
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      };
    }
    return { embedUrl: '', thumbnailUrl: '' };
  };

  const parseVimeoUrl = (url: string) => {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    
    if (videoId) {
      return {
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
        thumbnailUrl: '' // Would need Vimeo API to get thumbnail
      };
    }
    return { embedUrl: '', thumbnailUrl: '' };
  };

  const handleVideoTypeChange = (type: typeof videoType) => {
    setVideoType(type);
    setFormData(prev => ({ 
      ...prev, 
      videoUrl: '',
      embedUrl: '',
      thumbnailUrl: ''
    }));
  };

  const handleExternalUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, videoUrl: url }));
    
    if (videoType === 'youtube' && (url.includes('youtube.com') || url.includes('youtu.be'))) {
      const { embedUrl, thumbnailUrl } = parseYouTubeUrl(url);
      setFormData(prev => ({ ...prev, embedUrl, thumbnailUrl }));
    } else if (videoType === 'vimeo' && url.includes('vimeo.com')) {
      const { embedUrl, thumbnailUrl } = parseVimeoUrl(url);
      setFormData(prev => ({ ...prev, embedUrl, thumbnailUrl }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagIndex: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== tagIndex)
    }));
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      alert('User profile not found');
      return;
    }

    if (!formData.title || !formData.description || !formData.videoUrl || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      const videoData = {
        title: formData.title,
        description: formData.description,
        type: 'video' as const,
        status: formData.status,
        authorId: userProfile.id,
        authorName: userProfile.name,
        tags: formData.tags,
        featuredImage: formData.thumbnailUrl || undefined,
        videoUrl: formData.videoUrl,
        thumbnailUrl: formData.thumbnailUrl,
        duration: formData.duration,
        category: formData.category,
        embedUrl: formData.embedUrl || undefined,
        transcript: formData.transcript || undefined
      };

      if (isEdit && id) {
        await mediaService.updateMedia(id, videoData);
        alert('Video updated successfully!');
      } else {
        await mediaService.createMedia(videoData);
        alert('Video created successfully!');
      }
      
      navigate('/portal/media');
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-6 w-32 bg-white bg-opacity-20 rounded animate-pulse"></div>
              <div>
                <div className="h-10 w-48 bg-white bg-opacity-30 rounded mb-2 animate-pulse"></div>
                <div className="h-5 w-64 bg-white bg-opacity-20 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 w-24 bg-white bg-opacity-20 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Form Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/portal/media"
              className="flex items-center space-x-2 text-primary-100 hover:text-white transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Media</span>
            </Link>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {isEdit ? 'Edit Video' : 'Create Video'}
              </h1>
              <p className="text-lg text-primary-100">
                {isEdit ? 'Update your video content' : 'Create a new video for your audience'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/media/videos/${id}`)}
              disabled={!isEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter video title"
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (seconds) *
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  required
                  min="1"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
                {formData.duration > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Duration: {formatDuration(formData.duration)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your video"
              />
            </div>
          </div>

        {/* Video Source */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Video Source *</h2>
            
            {/* Video Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { key: 'upload', label: 'Upload File', icon: Upload },
                { key: 'youtube', label: 'YouTube', icon: Play },
                { key: 'vimeo', label: 'Vimeo', icon: Play },
                { key: 'external', label: 'External URL', icon: LinkIcon }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleVideoTypeChange(key as typeof videoType)}
                  className={`p-4 border-2 rounded-lg transition-colors duration-200 ${
                    videoType === key
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Video Input based on type */}
            {videoType === 'upload' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                  className="hidden"
                  id="video-upload"
                  disabled={uploadingVideo}
                />
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-600">
                    {uploadingVideo ? 'Uploading...' : 'Click to upload video file'}
                  </span>
                  <span className="text-sm text-gray-400">MP4, WebM, AVI up to 100MB</span>
                </label>
                {formData.videoUrl && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-green-800 text-sm">Video uploaded successfully!</p>
                  </div>
                )}
              </div>
            )}

            {(videoType === 'youtube' || videoType === 'vimeo' || videoType === 'external') && (
              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  {videoType === 'youtube' ? 'YouTube URL' : 
                   videoType === 'vimeo' ? 'Vimeo URL' : 'Video URL'} *
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  required
                  value={formData.videoUrl}
                  onChange={(e) => handleExternalUrlChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={
                    videoType === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                    videoType === 'vimeo' ? 'https://vimeo.com/...' :
                    'https://example.com/video.mp4'
                  }
                />
              </div>
            )}

            {/* Embed URL (auto-generated for YouTube/Vimeo) */}
            {formData.embedUrl && (
              <div className="mt-4">
                <label htmlFor="embedUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Embed URL (Auto-generated)
                </label>
                <input
                  type="url"
                  id="embedUrl"
                  value={formData.embedUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Embed URL for the video"
                />
              </div>
            )}
          </div>

        {/* Thumbnail */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thumbnail</h2>
            
            {formData.thumbnailUrl ? (
              <div className="relative">
                <img
                  src={formData.thumbnailUrl}
                  alt="Thumbnail"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: '' }))}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])}
                  className="hidden"
                  id="thumbnail-upload"
                  disabled={uploadingThumbnail}
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-600">
                    {uploadingThumbnail ? 'Uploading...' : 'Click to upload thumbnail'}
                  </span>
                  <span className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB</span>
                </label>
              </div>
            )}
          </div>

        {/* Transcript */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transcript (Optional)</h2>
            
            <textarea
              id="transcript"
              name="transcript"
              rows={10}
              value={formData.transcript}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              placeholder="Enter video transcript for accessibility..."
            />
          </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="hover:text-primary-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Link
              to="/portal/media"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              disabled={saving || uploadingVideo || uploadingThumbnail}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : isEdit ? 'Update Video' : 'Create Video'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VideoForm;