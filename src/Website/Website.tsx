import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import Framework from './pages/Framework';
import Business from './pages/Business';
import MediaConsent from './pages/MediaConsent';
import MediaPrivacy from './pages/MediaPrivacy';
import ProgramsPage from './pages/ProgramsPage';
import ProgramDetailPage from './pages/ProgramDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ContactPage from './pages/ContactPage';
import MediaPage from './pages/MediaPage';
import AlbumDetailPage from './pages/AlbumDetailPage';
import BlogDetailPage from './pages/BlogDetailPage';
import VideoDetailPage from './pages/VideoDetailPage';
import { ProgramService, EventService } from '../services/firestore';

// Component to handle slug-based routing
const SlugRouter: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<'program' | 'event' | 'notfound' | null>(null);

  useEffect(() => {
    const checkSlug = async () => {
      if (!slug) {
        setContent('notfound');
        setLoading(false);
        return;
      }

      try {
        // First, check if it's a program slug
        const programResult = await ProgramService.getBySlug(slug);
        if (programResult.success) {
          setContent('program');
          setLoading(false);
          return;
        }

        // Then check if it's an event slug
        const eventResult = await EventService.getBySlug(slug);
        if (eventResult.success) {
          setContent('event');
          setLoading(false);
          return;
        }

        // If neither found, it's a 404
        setContent('notfound');
        setLoading(false);
      } catch (error) {
        console.error('Error checking slug:', error);
        setContent('notfound');
        setLoading(false);
      }
    };

    checkSlug();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (content === 'program') {
    return <ProgramDetailPage />;
  }

  if (content === 'event') {
    return <EventDetailPage />;
  }

  // 404 - redirect to home page or show 404 page
  return <Navigate to="/" replace />;
};

const Website: React.FC = () => {
  const location = useLocation();
  
  // Pages where Footer should NOT appear
  const pagesWithoutFooter = [
    '/programs/',
    '/events/'
  ];
  
  // Check if current path should show footer
  const shouldShowFooter = !pagesWithoutFooter.some(path => 
    location.pathname.includes(path) && location.pathname !== path.slice(0, -1)
  );

  return (
    <div className="min-h-screen">
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/framework" element={<Framework />} />
          <Route path="/business" element={<Business />} />
          <Route path="/media-consent" element={<MediaConsent />} />
          <Route path="/media-privacy" element={<MediaPrivacy />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/programs/:id" element={<ProgramDetailPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/media/albums/:id" element={<AlbumDetailPage />} />
          <Route path="/media/blogs/:id" element={<BlogDetailPage />} />
          <Route path="/media/videos/:id" element={<VideoDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          {/* Catch-all routes for slugs - these must come last */}
          <Route path="/:slug" element={<SlugRouter />} />
        </Routes>
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
};

export default Website;