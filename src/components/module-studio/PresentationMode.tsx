import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Maximize2, CheckCircle2 } from "lucide-react";

interface Slide {
  title: string;
  content: string;
  type?: string;
  videoUrl?: string;
  exerciseInstructions?: string;
  resourceLinks?: string[];
}

interface PresentationModeProps {
  slides: Slide[];
  moduleTitle: string;
  onClose: () => void;
  onSlideViewed?: (slideIndex: number) => void;
  completedSlides?: number[];
}

export function PresentationMode({ slides, moduleTitle, onClose, onSlideViewed, completedSlides = [] }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mark slide as viewed after 2 seconds
  useEffect(() => {
    if (!onSlideViewed) return;
    const timer = setTimeout(() => {
      onSlideViewed(currentSlide);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentSlide, onSlideViewed]);

  const goNext = useCallback(() => {
    if (isTransitioning || currentSlide >= slides.length - 1) return;
    setDirection("next");
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(prev => prev + 1);
      setIsTransitioning(false);
    }, 300);
  }, [slides.length, currentSlide, isTransitioning]);

  const goPrev = useCallback(() => {
    if (isTransitioning || currentSlide <= 0) return;
    setDirection("prev");
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(prev => prev - 1);
      setIsTransitioning(false);
    }, 300);
  }, [currentSlide, isTransitioning]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setDirection(index > currentSlide ? "next" : "prev");
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 300);
  }, [currentSlide, isTransitioning]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === "Escape") { onClose(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (slides.length === 0) return null;
  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  const exitClass = isTransitioning
    ? direction === "next"
      ? "opacity-0 -translate-x-12 scale-[0.97]"
      : "opacity-0 translate-x-12 scale-[0.97]"
    : "";

  const enterClass = !isTransitioning
    ? "opacity-100 translate-x-0 scale-100"
    : "";

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-3">
          <span className="text-white/70 text-sm font-medium">{moduleTitle}</span>
          <Badge variant="secondary" className="bg-white/20 text-white">{currentSlide + 1} / {slides.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Slide content with transition */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16">
        <div
          key={currentSlide}
          className={`max-w-4xl w-full text-center space-y-8 transition-all duration-300 ease-out ${exitClass} ${enterClass}`}
        >
          {slide.type === "video" && slide.videoUrl ? (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-white">{slide.title}</h2>
              <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                <iframe
                  src={slide.videoUrl}
                  className="w-full h-full rounded-xl"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
            </div>
          ) : slide.type === "exercise" ? (
            <div className="space-y-6">
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 text-lg px-4 py-1">Exercise</Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-white">{slide.title}</h2>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed whitespace-pre-wrap">{slide.content}</p>
              {slide.exerciseInstructions && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left">
                  <h4 className="text-white font-semibold mb-2">Instructions:</h4>
                  <p className="text-white/70 whitespace-pre-wrap">{slide.exerciseInstructions}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-white">{slide.title}</h2>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed whitespace-pre-wrap">{slide.content}</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar - always visible */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navigation - hover to reveal */}
      <div className="absolute bottom-1 left-0 right-0 flex items-center justify-between p-4 pb-5 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
        <Button variant="ghost" onClick={goPrev} disabled={currentSlide === 0 || isTransitioning} className="text-white hover:bg-white/20 disabled:opacity-30">
          <ChevronLeft className="w-5 h-5 mr-1" /> Previous
        </Button>
        {/* Progress dots with completion indicators */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => {
            const isViewed = completedSlides.includes(i);
            return (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? "bg-white w-6"
                    : isViewed
                      ? "bg-green-400/70 hover:bg-green-400 w-2"
                      : "bg-white/30 hover:bg-white/50 w-2"
                }`}
              />
            );
          })}
        </div>
        <Button variant="ghost" onClick={goNext} disabled={currentSlide === slides.length - 1 || isTransitioning} className="text-white hover:bg-white/20 disabled:opacity-30">
          Next <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
