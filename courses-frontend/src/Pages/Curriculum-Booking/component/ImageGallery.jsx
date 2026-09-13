import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, GalleryHorizontalEnd } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const getDesktopImageClass = (imageCount, index) => {
  if (imageCount === 1) {
    return "col-span-2 aspect-[2/1] rounded-3xl";
  }

  if (imageCount === 2) {
    return index === 0
      ? "aspect-square rounded-l-3xl"
      : "aspect-square rounded-r-3xl";
  }

  if (imageCount === 3) {
    return [
      "row-span-2 h-full rounded-l-3xl",
      "h-full rounded-tr-3xl",
      "h-full rounded-br-3xl",
    ][index];
  }

  return `aspect-square ${[
    "rounded-tl-3xl",
    "rounded-tr-3xl",
    "rounded-bl-3xl",
    "rounded-br-3xl",
  ][index]}`;
};

export default function ImageGallery({ images = [], layout = "grid" }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFullscreen = (index) => {
    setSelectedImageIndex(index);
    setIsFullscreen(true);
    document.body.style.overflow = "hidden";
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setSelectedImageIndex(null);
    document.body.style.overflow = "auto";
  };

  const goToNext = () => {
    if (selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const goToPrev = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFullscreen) return;

      if (e.key === "Escape") {
        closeFullscreen();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, selectedImageIndex]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-100 grid md:grid-cols-2 gap-3 mb-4 aspect-video justify-center">
        <div className="bg-gray-200 rounded-xl hidden md:block"></div>
        <div className="bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View - Swiper Slider */}
      <div className="md:hidden">
        <Swiper
          spaceBetween={10}
          slidesPerView={1}
          className="w-full"
        >
          {images.map((img, index) => (
            <SwiperSlide key={index}>
              <div
                onClick={() => openFullscreen(index)}
                className="cursor-pointer h-64 w-full rounded-md"
              >
                <img
                  src={img.url || img}
                  alt={`Gallery ${index + 1}`}
                  className="h-full w-full object-cover rounded-xl"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        {layout === "stack" ? (
          <div className="flex flex-col gap-3.5">
            {images.map((img, index) => (
              <div
                key={index}
                onClick={() => openFullscreen(index)}
                className="cursor-pointer overflow-hidden rounded-[20px] aspect-[4/3] w-full bg-gray-100 shadow-none transition-all shrink-0"
              >
                <img
                  src={img.url || img}
                  alt={`Gallery ${index + 1}`}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))}

            {/* Right-aligned layer icon with exact optical gap as images */}
            {images.length > 0 && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => openFullscreen(0)}
                  className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer shadow-sm"
                  title="View all photos"
                >
                  <GalleryHorizontalEnd size={18} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Dynamic Grid - Show up to 4 images */}
            <div className={`grid gap-1.5 mb-4 ${
              images.length === 1 ? 'grid-cols-1 aspect-[2/1]' :
              images.length === 2 ? 'grid-cols-2 aspect-[2/1]' :
              images.length === 3 ? 'grid-cols-2 grid-rows-2 aspect-[4/3]' :
              'grid-cols-2 aspect-square'
            }`}>
              {images.slice(0, 4).map((img, index) => (
                <div
                  key={index}
                  onClick={() => openFullscreen(index)}
                  className={`cursor-pointer overflow-hidden ${getDesktopImageClass(images.length, index)}`}
                >
                  <img
                    src={img.url || img}
                    alt={`Gallery ${index + 1}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300"
                  />
                </div>
              ))}
            </div>

            {/* View More Button - Only show if more than 5 images */}
            {images.length > 1 && (
                <button
                  onClick={() => openFullscreen(1)}
                  className="absolute right-4 bottom-4 w-11.5 h-11.5 rounded-full bg-black/55  text-white flex items-center justify-center transition-all text-lg font-semibold"
                >
                  <GalleryHorizontalEnd />
                </button>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Image Gallery */}
      {isFullscreen && selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-60 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
          >
            <X size={24} />
          </button>

          {/* Navigation Buttons */}
          {selectedImageIndex > 0 && (
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-3"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {selectedImageIndex < images?.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-3"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Image Counter */}
          <div className="absolute top-4 left-4 text-white text-lg z-10 bg-black bg-opacity-50 rounded-full px-3 py-1">
            {selectedImageIndex + 1} / {images?.length}
          </div>

          {/* Main Image */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={images[selectedImageIndex]?.url || images[selectedImageIndex]}
              alt="Fullscreen view"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Thumbnail Strip */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 overflow-x-auto max-w-full px-4 py-2">
            {images?.map((img, index) => (
              <img
                key={index}
                src={img.url || img}
                alt={`Thumbnail ${index + 1}`}
                loading="lazy"
                decoding="async"
                className={`h-16 w-16 object-cover rounded cursor-pointer border-2 ${
                  index === selectedImageIndex
                    ? "border-white"
                    : "border-transparent"
                }`}
                onClick={() => setSelectedImageIndex(index)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
