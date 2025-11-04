import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Eye, Heart, User, Play, Volume2, VolumeX } from 'lucide-react';
import { mediaService } from '../../services/mediaService';
import { Video } from '../../types/media';
import LoadingSpinner from '../../components/LoadingSpinner';

const VideoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideo(id);
    }
  }, [id]);

  const fetchVideo = async (videoId: string) => {
    try {
      setLoading(true);
      const videoData = await mediaService.getMediaById(videoId) as Video;
      if (videoData && videoData.type === 'video') {
        setVideo(videoData);
        // Increment views
        await mediaService.incrementViews(videoId);
      }
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (video && !liked) {
      try {
        await mediaService.incrementLikes(video.id);
        setLiked(true);
        setVideo(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
      } catch (error) {
        console.error('Error liking video:', error);
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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEmbedUrl = (url: string) => {
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Convert Vimeo URLs to embed format
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return video?.embedUrl || url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Video Not Found</h2>
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
                <span>{video.likes}</span>
              </button>
              
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="bg-black">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <div className="w-full">
            <div className="aspect-video bg-gray-900 rounded-md overflow-hidden relative">
              {video.embedUrl || video.videoUrl.includes('youtube') || video.videoUrl.includes('vimeo') ? (
                // Embedded video (YouTube, Vimeo, etc.)
                <iframe
                  src={getEmbedUrl(video.videoUrl)}
                  className="w-full h-full"
                  allowFullScreen
                  title={video.title}
                />
              ) : (
                // Direct video file
                <video
                  controls
                  className="w-full h-full"
                  poster={video.thumbnailUrl}
                  muted={isMuted}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  <source src={video.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              
              {/* Custom controls overlay (for direct videos only) */}
              {!video.embedUrl && !video.videoUrl.includes('youtube') && !video.videoUrl.includes('vimeo') && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black bg-opacity-50 text-white p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="hover:text-gray-300"
                    >
                      <Play className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="hover:text-gray-300"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  <div className="text-sm">
                    {formatDuration(video.duration)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="bg-white py-8">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                    {video.category}
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {video.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-6 text-gray-600 text-sm mb-6">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{video.authorName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(video.publishedAt || video.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>{video.views} views</span>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {video.description}
                  </p>
                </div>

                {/* Tags */}
                {video.tags.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {video.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors duration-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transcript */}
                {video.transcript && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Transcript</h3>
                    <div className="text-gray-700 text-sm leading-relaxed max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans">{video.transcript}</pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Stats</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{formatDuration(video.duration)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Views</span>
                      <span className="font-medium">{video.views.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Likes</span>
                      <span className="font-medium">{video.likes}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Published</span>
                      <span className="font-medium text-sm">
                        {formatDate(video.publishedAt || video.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Author</h4>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {video.authorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{video.authorName}</p>
                        <p className="text-sm text-gray-600">Content Creator</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;