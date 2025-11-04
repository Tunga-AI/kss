import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Eye, Heart, Download, X, CheckCircle } from 'lucide-react';
import { mediaService } from '../../services/mediaService';
import { Album } from '../../types/media';
import LoadingSpinner from '../../components/LoadingSpinner';

const AlbumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAlbum(id);
    }
  }, [id]);

  const fetchAlbum = async (albumId: string) => {
    try {
      setLoading(true);
      const albumData = await mediaService.getMediaById(albumId) as Album;
      if (albumData && albumData.type === 'album') {
        setAlbum(albumData);
        // Increment views
        await mediaService.incrementViews(albumId);
      }
    } catch (error) {
      console.error('Error fetching album:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (album && !liked) {
      try {
        await mediaService.incrementLikes(album.id);
        setLiked(true);
        setAlbum(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
      } catch (error) {
        console.error('Error liking album:', error);
      }
    }
  };


  const formatDate = (dateInput: Date | string | any) => {
    try {
      let date: Date;

      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      } else if (dateInput && typeof dateInput === 'object' && dateInput.seconds) {
        // Firestore timestamp
        date = new Date(dateInput.seconds * 1000);
      } else {
        // Fallback to current date if invalid
        date = new Date();
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        date = new Date();
      }

      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date());
    }
  };

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!album || selectedImage === null) return;

    if (direction === 'prev') {
      setSelectedImage(selectedImage > 0 ? selectedImage - 1 : album.images.length - 1);
    } else {
      setSelectedImage(selectedImage < album.images.length - 1 ? selectedImage + 1 : 0);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const selectAllPhotos = () => {
    if (!album) return;
    const allPhotoIds = new Set(album.images.map(img => img.id));
    setSelectedPhotos(allPhotoIds);
  };

  const clearSelection = () => {
    setSelectedPhotos(new Set());
  };

  const downloadSelectedPhotos = async () => {
    if (!album || selectedPhotos.size === 0) return;

    for (const photoId of selectedPhotos) {
      const image = album.images.find(img => img.id === photoId);
      if (image) {
        try {
          const response = await fetch(image.url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = url;
          link.download = `${album.title}_${image.caption || `photo_${photoId}`}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error downloading image:', error);
        }
      }
    }
  };

  const downloadSinglePhoto = async (image: any) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${album?.title || 'photo'}_${image.caption || `photo_${image.id}`}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 py-6">
          <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex items-center space-x-4">
                <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Album Info Skeleton */}
        <div className="bg-white py-8">
          <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="w-full">
              <div className="h-12 w-3/4 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-3 mb-8">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <div className="w-full flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Album Not Found</h2>
          <Link
            to="/media"
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            ← Back to Media
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between">
            <Link
              to="/media"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Media</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  liked
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                <span>{album.likes}</span>
              </button>
              
              <button
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isSelectionMode
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="h-5 w-5" />
                <span>{isSelectionMode ? 'Exit Selection' : 'Select Photos'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Album Info */}
      <div className="bg-white py-8">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="w-full">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {album.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{formatDate(album.eventDate || album.publishedAt || album.createdAt)}</span>
              </div>
              
              {album.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>{album.location}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>{album.views} views</span>
              </div>
            </div>
            
            <p className="text-gray-700 text-lg leading-relaxed mb-8">
              {album.description}
            </p>
            
            {album.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {album.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Photos ({album.images.length})
            </h2>

            {isSelectionMode && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-600">
                  {selectedPhotos.size} selected
                </span>
                <button
                  onClick={selectAllPhotos}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={downloadSelectedPhotos}
                  disabled={selectedPhotos.size === 0}
                  className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download ({selectedPhotos.size})</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {album.images
              .sort((a, b) => a.order - b.order)
              .map((image, index) => (
                <div
                  key={image.id}
                  className="group cursor-pointer relative aspect-square bg-gray-200 rounded-md overflow-hidden"
                >
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.caption || `Photo ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onClick={() => isSelectionMode ? togglePhotoSelection(image.id) : openLightbox(index)}
                  />

                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePhotoSelection(image.id);
                        }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                          selectedPhotos.has(image.id)
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'bg-white border-gray-300 hover:border-primary-400'
                        }`}
                      >
                        {selectedPhotos.has(image.id) && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Selection Overlay */}
                  {isSelectionMode && selectedPhotos.has(image.id) && (
                    <div className="absolute inset-0 bg-primary-600 bg-opacity-30 border-2 border-primary-600 rounded-lg" />
                  )}

                  {/* Action Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center space-x-2">
                      {!isSelectionMode && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openLightbox(index);
                            }}
                            className="bg-white rounded-full p-2 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <Eye className="h-5 w-5 text-gray-700" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadSinglePhoto(image);
                            }}
                            className="bg-white rounded-full p-2 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <Download className="h-5 w-5 text-gray-700" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-sm">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="h-8 w-8" />
            </button>
            
            {/* Navigation Buttons */}
            <button
              onClick={() => navigateImage('prev')}
              className="absolute left-4 text-white hover:text-gray-300 z-10"
            >
              <ArrowLeft className="h-8 w-8" />
            </button>
            
            <button
              onClick={() => navigateImage('next')}
              className="absolute right-4 text-white hover:text-gray-300 z-10"
            >
              <ArrowLeft className="h-8 w-8 rotate-180" />
            </button>
            
            {/* Image */}
            <img
              src={album.images[selectedImage].url}
              alt={album.images[selectedImage].caption || `Photo ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Download Button in Lightbox */}
            <button
              onClick={() => downloadSinglePhoto(album.images[selectedImage])}
              className="absolute top-16 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors duration-200"
              title="Download Photo"
            >
              <Download className="h-6 w-6" />
            </button>
            
            {/* Caption */}
            {album.images[selectedImage].caption && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
                {album.images[selectedImage].caption}
              </div>
            )}
            
            {/* Image Counter */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg">
              {selectedImage + 1} / {album.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumDetailPage;