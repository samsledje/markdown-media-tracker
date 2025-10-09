import React, { useRef, useState, useEffect } from 'react';
import { Lock, FileText, Database, Keyboard, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import StorageSelector from './StorageSelector.jsx';

/**
 * Enhanced Landing Page Component
 * Provides a comprehensive introduction to the app before storage selection
 */
const LandingPage = ({ onStorageSelect, availableOptions, error, isLoading }) => {
  // Refs for smooth scrolling
  const featuresRef = useRef(null);
  const storageRef = useRef(null);
  
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const screenshots = [
    {
      src: './screenshots/main-panel.jpg',
      caption: 'Keep track of books and movies in one central library'
    },
    {
      src: './screenshots/online-search.jpg',
      caption: 'Search Open Library and OMDb to quickly add new items'
    },
    {
      src: './screenshots/manual-edit.jpg',
      caption: 'Manually add or edit items with full control over details'
    },
    {
      src: './screenshots/item-detail.jpg',
      caption: 'View detailed information for each book or movie'
    },
    {
      src: './screenshots/sort-and-filter.jpg',
      caption: 'Sort and filter your collection by rating, tags, status, and more'
    },
    {
      src: './screenshots/keyboard-shortcuts.jpg',
      caption: 'Navigate efficiently with comprehensive keyboard shortcuts'
    },
    {
      src: './screenshots/custom-colors.jpg',
      caption: 'Customize colors and themes to match your style'
    },
    {
      src: './screenshots/obsidian-files.jpg',
      caption: 'Your entire library is a directory of markdown files, owned by you and compatible with Obsidian and other editors'
    }
  ];
  
  const nextSlide = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % screenshots.length);
      setIsTransitioning(false);
    }, 300);
  };
  
  const prevSlide = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
      setIsTransitioning(false);
    }, 300);
  };
  
  const goToSlide = (index) => {
    if (index === currentSlide) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 1000);
    setIsAutoPlaying(false); // Pause auto-play when user manually selects a slide
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 6500);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentSlide]);

  const features = [
    {
      icon: Lock,
      title: "Privacy-First Storage",
      description: "Your data stays yours. Choose local storage or Google Drive—no third-party servers, no tracking, no subscriptions."
    },
    {
      icon: FileText,
      title: "Markdown-Powered",
      description: "Each item is a simple .md file with YAML frontmatter. Works seamlessly with Obsidian, Git, and your favorite text editor."
    },
    {
      icon: Database,
      title: "Rich Features",
      description: "Search Open Library and OMDb, import from Goodreads/Letterboxd, filter by rating and tags, and customize your view."
    },
    {
      icon: Keyboard,
      title: "Keyboard-First",
      description: "Navigate your entire library without touching the mouse. Comprehensive shortcuts for power users who want speed."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo and Title */}
          <img 
            src="./logo_white.svg" 
            alt="Markdown Media Tracker logo" 
            className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6 object-contain animate-fade-in"
          />
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Markdown Media Tracker
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Track books and movies with the simplicity of Markdown files
          </p>

          {/* Screenshot Carousel */}
          <div 
            className="mb-10 max-w-4xl mx-auto"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <div className="relative group">
              <div className="relative overflow-hidden rounded-lg shadow-2xl border border-slate-700">
                <img 
                  src={screenshots[currentSlide].src}
                  alt={screenshots[currentSlide].caption}
                  className="w-full h-auto transition-opacity duration-300"
                  style={{ opacity: isTransitioning ? 0 : 1 }}
                  loading="lazy"
                />
                
                {/* Navigation Arrows */}
                <button
                  onClick={prevSlide}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                
                <button
                  onClick={nextSlide}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Next screenshot"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              {/* Caption below screenshot */}
              <div className="mt-4 px-4">
                <p 
                  className="text-slate-300 text-sm sm:text-base text-center transition-opacity duration-300"
                  style={{ opacity: isTransitioning ? 0 : 1 }}
                >
                  {screenshots[currentSlide].caption}
                </p>
              </div>
              
              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-3">
                {screenshots.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                      index === currentSlide 
                        ? 'w-6 sm:w-8' 
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                    style={index === currentSlide ? { backgroundColor: 'var(--mt-highlight)' } : {}}
                    aria-label={`Go to screenshot ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={() => scrollToSection(storageRef)}
              className="w-full sm:w-auto px-8 py-4 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 min-h-[44px] text-base sm:text-lg"
              style={{ backgroundColor: 'var(--mt-highlight)' }}
              aria-label="Get started with Markdown Media Tracker"
            >
              Get Started
            </button>
            
            <button
              onClick={() => scrollToSection(featuresRef)}
              className="w-full sm:w-auto px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-200 min-h-[44px] text-base sm:text-lg"
              aria-label="View features and learn more"
            >
              View Features
            </button>
          </div>

          {/* Scroll Indicator */}
          <div className="animate-bounce">
            <ArrowDown className="w-6 h-6 text-slate-400 mx-auto" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef} 
        className="py-16 sm:py-20 px-4 bg-slate-800/30"
        aria-labelledby="features-heading"
      >
        <div className="max-w-6xl mx-auto">
          <h2 
            id="features-heading" 
            className="text-3xl sm:text-4xl font-bold text-center mb-12"
          >
            Why Markdown Media Tracker?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 sm:p-8 bg-slate-800/50 rounded-xl border border-slate-700 transition-all duration-200 hover:transform hover:scale-102 hover:shadow-xl"
                  style={{ 
                    '--hover-border-color': 'var(--mt-highlight)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--mt-highlight)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '';
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-3 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--mt-highlight) 20%, transparent)' }}>
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: 'var(--mt-highlight)' }} aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-white">
                        {feature.title}
                      </h3>
                      <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Storage Selection Section */}
      <section 
        ref={storageRef} 
        className="py-16 sm:py-20 px-4"
        aria-labelledby="storage-heading"
      >
        <div className="max-w-4xl mx-auto mb-8 text-center">
          <h2 
            id="storage-heading" 
            className="text-3xl sm:text-4xl font-bold mb-4"
          >
            Choose Your Storage
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Select where to store your media library. You can change this anytime in settings.
          </p>
        </div>

        {/* Integrated Storage Selector */}
        <div className="max-w-5xl mx-auto bg-slate-800/30 rounded-2xl p-6 sm:p-8 border border-slate-700">
          <StorageSelector
            onStorageSelect={onStorageSelect}
            availableOptions={availableOptions}
            error={error}
            isLoading={isLoading}
          />
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
