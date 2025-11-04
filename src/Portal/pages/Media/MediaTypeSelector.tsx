import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Image, FileText, Video, Plus } from 'lucide-react';

const MediaTypeSelector: React.FC = () => {
  const mediaTypes = [
    {
      type: 'album',
      title: 'Photo Album',
      description: 'Create a photo gallery with multiple images',
      icon: Image,
      path: '/portal/media/albums/new',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-100'
    },
    {
      type: 'blog',
      title: 'Blog Post',
      description: 'Write an article or blog post with rich content',
      icon: FileText,
      path: '/portal/media/blogs/new',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      type: 'video',
      title: 'Video',
      description: 'Upload and share video content',
      icon: Video,
      path: '/portal/media/videos/new',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:bg-purple-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center space-x-4">
          <Link
            to="/portal/media"
            className="flex items-center space-x-2 text-primary-100 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Media</span>
          </Link>
          <div>
            <h1 className="text-4xl font-bold mb-2">Create New Media</h1>
            <p className="text-lg text-primary-100">
              Choose the type of media you want to create
            </p>
          </div>
        </div>
      </div>

      {/* Media Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mediaTypes.map((media) => {
          const Icon = media.icon;
          return (
            <Link
              key={media.type}
              to={media.path}
              className={`${media.bgColor} ${media.borderColor} ${media.hoverColor} border-2 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg group`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`${media.color} p-4 rounded-full text-white group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{media.title}</h3>
                  <p className="text-gray-600">{media.description}</p>
                </div>
                <div className="flex items-center space-x-2 text-primary-600 font-medium">
                  <Plus className="h-4 w-4" />
                  <span>Create {media.title}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Help Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Photo Albums</h3>
            <p className="text-gray-600">Perfect for event galleries, product showcases, or visual portfolios. Support for multiple images with captions.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Blog Posts</h3>
            <p className="text-gray-600">Share articles, news, tutorials, or company updates. Rich text editor with formatting options.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Videos</h3>
            <p className="text-gray-600">Upload educational content, tutorials, or promotional videos. Support for various video formats.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaTypeSelector;