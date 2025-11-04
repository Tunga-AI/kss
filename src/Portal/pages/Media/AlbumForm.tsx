import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus, Save, Eye, Trash2, GripVertical } from 'lucide-react';
import { mediaService } from '../../../services/mediaService';
import { Album, AlbumImage } from '../../../types/media';
import { useAuthContext } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/LoadingSpinner';

const AlbumForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const isEdit = id && id !== 'new';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    eventDate: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'archived',
    featuredImage: ''
  });
  
  const [images, setImages] = useState<AlbumImage[]>([]);
  const [newTag, setNewTag] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isEdit) {
      fetchAlbum();
    }
  }, [id, isEdit]);

  const fetchAlbum = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const album = await mediaService.getMediaById(id) as Album;
      if (album && album.type === 'album') {
        setFormData({
          title: album.title,
          description: album.description,
          location: album.location || '',
          eventDate: album.eventDate ? album.eventDate.toISOString().split('T')[0] : '',
          tags: album.tags,
          status: album.status,
          featuredImage: album.featuredImage || ''
        });
        setImages(album.images.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error fetching album:', error);
      alert('Failed to load album');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;

    try {
      setUploadingImages(true);
      const uploadPromises = Array.from(files).map(async (file, index) => {
        try {
          const url = await mediaService.uploadImage(file, 'albums');
          return {
            id: `temp_${Date.now()}_${index}`,
            url,
            caption: '',
            order: images.length + index,
            thumbnailUrl: url // Use same URL for now
          };
        } catch (error: any) {
          console.error(`Error uploading ${file.name}:`, error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads: AlbumImage[] = [];
      const failedUploads: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulUploads.push(result.value);
        } else {
          failedUploads.push(files[index].name);
        }
      });

      if (successfulUploads.length > 0) {
        setImages(prev => [...prev, ...successfulUploads]);
      }

      if (failedUploads.length > 0) {
        alert(`Failed to upload the following files:\n${failedUploads.join('\n')}\n\nPlease check that:\n- Files are valid images (JPG, PNG, GIF)\n- Each file is less than 10MB\n- You are logged in`);
      }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      alert(`Failed to upload images: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateImageCaption = (index: number, caption: string) => {
    setImages(prev => 
      prev.map((img, i) => 
        i === index ? { ...img, caption } : img
      )
    );
  };

  const setFeaturedImage = (url: string) => {
    setFormData(prev => ({ ...prev, featuredImage: url }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;
    
    const reorderedImages = [...images];
    const draggedImage = reorderedImages[draggedIndex];
    reorderedImages.splice(draggedIndex, 1);
    reorderedImages.splice(dropIndex, 0, draggedImage);
    
    // Update order values
    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      order: index
    }));
    
    setImages(updatedImages);
    setDraggedIndex(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      alert('User profile not found');
      return;
    }

    if (!formData.title || !formData.description || images.length === 0) {
      alert('Please fill in all required fields and add at least one image');
      return;
    }

    try {
      setSaving(true);
      
      const albumData = {
        title: formData.title,
        description: formData.description,
        type: 'album' as const,
        status: formData.status,
        authorId: userProfile.uid,
        authorName: userProfile.displayName,
        tags: formData.tags,
        location: formData.location || undefined,
        eventDate: formData.eventDate ? new Date(formData.eventDate) : undefined,
        featuredImage: formData.featuredImage || images[0]?.url,
        images: images.map((img, index) => ({ ...img, order: index }))
      };

      if (isEdit && id) {
        await mediaService.updateMedia(id, albumData);
        alert('Album updated successfully!');
      } else {
        await mediaService.createMedia(albumData);
        alert('Album created successfully!');
      }
      
      navigate('/portal/media');
    } catch (error) {
      console.error('Error saving album:', error);
      alert('Failed to save album');
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
                {isEdit ? 'Edit Album' : 'Create Album'}
              </h1>
              <p className="text-lg text-primary-100">
                {isEdit ? 'Update your photo album' : 'Create a new photo album for your gallery'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/media/albums/${id}`)}
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
                  placeholder="Enter album title"
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
                placeholder="Describe your album"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Where was this taken?"
                />
              </div>
              
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date
                </label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
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

        {/* Images */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Images *</h2>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
                id="image-upload"
                disabled={uploadingImages}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-gray-600">
                  {uploadingImages ? 'Uploading...' : 'Click to upload images or drag and drop'}
                </span>
                <span className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB each</span>
              </label>
            </div>
            
            {/* Image Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="relative group bg-gray-100 rounded-lg overflow-hidden cursor-move"
                  >
                    <div className="aspect-square">
                      <img
                        src={image.url}
                        alt={image.caption || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setFeaturedImage(image.url)}
                          className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                          title="Set as featured image"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                          title="Remove image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Drag Handle */}
                    <div className="absolute top-2 left-2 p-1 bg-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <GripVertical className="h-4 w-4 text-gray-600" />
                    </div>
                    
                    {/* Featured Badge */}
                    {formData.featuredImage === image.url && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-primary-600 text-white text-xs rounded">
                        Featured
                      </div>
                    )}
                    
                    {/* Caption Input */}
                    <div className="p-3">
                      <input
                        type="text"
                        value={image.caption}
                        onChange={(e) => updateImageCaption(index, e.target.value)}
                        placeholder="Add caption..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              disabled={saving || uploadingImages}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : isEdit ? 'Update Album' : 'Create Album'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AlbumForm;