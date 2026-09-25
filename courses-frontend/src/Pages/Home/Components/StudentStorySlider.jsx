import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import api from "../../../redux/api";
import UserAvatarPlaceholder from "../../../components/UserAvatarPlaceholder";

const FALLBACK_AVATAR = "/default-avatar.svg";

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
    <section className="mb-[60px] w-full">
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
        className="student-story-slider w-full"
      >
        {stories.map((item) => (
          <SwiperSlide key={item.id} className="!h-auto">
            {/* Merged attached card: On mobile image is on top and card is on bottom (flex-col-reverse), on desktop side-by-side (md:flex-row) */}
            <div className="flex flex-col-reverse overflow-hidden rounded-[22px] md:flex-row md:items-stretch md:min-h-[380px]">
              {/* Left/Bottom: Student story card with full matching height */}
              <div className="flex w-full flex-col justify-between bg-[#008494] p-6 text-white md:w-[32%] md:min-w-[280px] md:max-w-[360px] md:p-7">
                <div>
                  {/* Student stories pill tag filled white like a button with Sparkles icon */}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1A2B49] shadow-sm select-none">
                    <Sparkles size={13} className="text-[#1A2B49]" />
                    <span>Student stories</span>
                  </span>

                  {/* Student profile */}
                  <div className="mt-5 flex items-center gap-3.5">
                    <div className="h-[50px] w-[50px] rounded-full overflow-hidden bg-white/10 backdrop-blur-sm ring-2 ring-white/30 flex items-center justify-center shrink-0">
                      <UserAvatarPlaceholder className="h-6 w-6 text-white" />
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <span className="text-sm md:text-base font-semibold text-white leading-tight">
                        Alex Morgan
                      </span>
                      <span className="inline-block rounded-md border border-white/80 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white">
                        Student
                      </span>
                    </div>
                  </div>

                  {/* Teacher profile below student area */}
                  <div className="mt-5 flex items-center gap-3.5">
                    <div className="h-[50px] w-[50px] rounded-full overflow-hidden bg-white/10 backdrop-blur-sm ring-2 ring-white/30 flex items-center justify-center shrink-0">
                      {item.profileImage && item.profileImage !== FALLBACK_AVATAR && item.profileImage !== "https://i.ibb.co/tpV3m2GW/no-image.png" ? (
                        <img
                          src={item.profileImage}
                          alt={item.studentName}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserAvatarPlaceholder className="h-6 w-6 text-white" />
                      )}
                    </div>

                    {/* Teacher profile details: name on top, Teacher rectangle badge below */}
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-sm md:text-base font-semibold text-white leading-tight">
                        {item.studentName}
                      </span>
                      <span className="inline-block rounded-md border border-white/80 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white">
                        Teacher
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom area: Quote text and Book lessons button below it */}
                <div className="mt-6 flex flex-col items-start">
                  <p className="text-xl font-bold leading-snug md:text-2xl">
                    “{item.story}”
                  </p>

                  {/* Action Pill Button: Book lessons below quote */}
                  <div className="mt-5">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs md:text-sm font-semibold text-[#1A2B49] shadow-sm hover:bg-white/90 transition-all cursor-pointer select-none"
                    >
                      <span>Book lessons with {item.studentName || "John Mcturn"}</span>
                      <ArrowRight size={15} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right/Top: Slide show image (bicycle card) attached with 0 gap */}
              <div className="relative w-full h-[240px] min-h-[240px] shrink-0 md:h-auto md:min-h-0 md:flex-1 md:shrink">
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-cover md:absolute md:inset-0"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            {/* Bottom row outside card: Arrows on left, Slide numbering pill on far right */}
            <div className="mt-3 flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous student story"
                  onClick={() => swiperRef.current?.slidePrev()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A2B49] text-white transition-opacity hover:opacity-80 cursor-pointer"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  aria-label="Next student story"
                  onClick={() => swiperRef.current?.slideNext()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A2B49] text-white transition-opacity hover:opacity-80 cursor-pointer"
                >
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Slide Numbering Pill */}
              <div className="flex h-10 min-w-[56px] items-center justify-center rounded-full bg-[#1A2B49] px-3.5 text-sm font-bold text-white select-none">
                <span>{currentIndex + 1}</span>
                <span className="ml-[1px]">/</span>
                <span>{stories.length}</span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
