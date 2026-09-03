import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import api from "../../../redux/api";

const FALLBACK_AVATAR = "https://i.ibb.co/tpV3m2GW/no-image.png";

const mapStory = (item) => ({
  id: item._id,
  image: item.image?.url || "",
  profileImage: item.profileImage?.url || FALLBACK_AVATAR,
  studentName: item.studentName || "Student",
  story: item.story?.trim() || "",
});

export default function StudentStorySlider() {
  const swiperRef = useRef(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadStories = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/student-stories/active");
        if (cancelled) return;
        const mapped = (data?.stories || [])
          .map(mapStory)
          .filter((item) => item.image && item.story);
        setStories(mapped);
      } catch {
        if (!cancelled) setStories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStories();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || stories.length === 0) return null;

  return (
    <section className="mb-5 w-full">
      <Swiper
        slidesPerView={1}
        loop={stories.length > 1}
        autoHeight={false}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          setCurrentIndex(swiper.realIndex || 0);
        }}
        onSlideChange={(swiper) => {
          setCurrentIndex(swiper.realIndex || 0);
        }}
        className="student-story-slider w-full !overflow-visible"
      >
        {stories.map((item) => (
          <SwiperSlide key={item.id} className="!h-auto">
            <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-5">
              {/* Left column: card + arrows (defines total height) */}
              <div className="flex w-full flex-col md:w-[32%] md:min-w-[280px] md:max-w-[360px]">
                <div className="flex flex-1 flex-col justify-between rounded-[22px] bg-primary p-6 text-white md:p-7">
                  <div>
                    <span className="inline-block rounded-md border border-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                      Student story
                    </span>
                    <p className="mt-6 text-xl font-bold leading-snug md:text-2xl">
                      “{item.story}”
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-3">
                    <img
                      src={item.profileImage}
                      alt={item.studentName}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-white/30"
                    />
                    <span className="text-sm font-medium md:text-base">
                      {item.studentName}
                    </span>
                  </div>
                </div>

                {/* Bottom row: Arrows on left, Slide numbering pill on right */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Previous student story"
                      onClick={() => swiperRef.current?.slidePrev()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-80"
                    >
                      <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next student story"
                      onClick={() => swiperRef.current?.slideNext()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-80"
                    >
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Slide Numbering Pill */}
                  <div className="flex h-10 min-w-[56px] items-center justify-center rounded-full border-2 border-black bg-white px-3.5 text-sm font-bold text-black select-none">
                    <span>{currentIndex + 1}</span>
                    <span className="ml-[1px]">/</span>
                    <span>{stories.length}</span>
                  </div>
                </div>
              </div>

              {/* Right image: full height of left column (card + arrows) */}
              <div className="relative min-h-[240px] w-full flex-1 overflow-hidden rounded-[22px] md:min-h-0">
                <img
                  src={item.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
