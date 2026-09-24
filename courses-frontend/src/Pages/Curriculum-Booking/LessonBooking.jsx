import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import {
  Copy,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Timer,
  Clock,
  MapPin,
  Info,
  Link2,
} from "lucide-react";
import { FaCircleCheck } from "react-icons/fa6";
import { IoMdLink } from "react-icons/io";
import MainLayout from "../../components/MainLayout";
import ProfessionalLoader from "../../components/ProfessionalLoader";
import { Calendar } from "./component/Calender";
import UnitsSection from "./component/UnitsSection";
import Reviews from "./component/Reviews";
import ReviewsColumn from "./component/ReviewsColumn";
import ReviewsTabContent from "./component/ReviewsTabContent";
import ImageGallery from "./component/ImageGallery";
import { FiDollarSign } from "react-icons/fi";
import { FaRegStar } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { GrLocation } from "react-icons/gr";
import { ArrowLeft, Upload } from "lucide-react";
import { Link, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getLessonById, getTeacherLessonsById } from "../../redux/reducers/LessonReducer";
import {
  getLessonRating,
  getUserFavorites,
  toggleFavorite,
} from "../../redux/reducers/FavoriteReducer";
import { toast } from "react-toastify";
import {
  getTeacherAvailability,
  getTeacherUnAvailability,
  getLessonAvailability,
  clearAvailabilityData,
} from "../../redux/reducers/AvailabilityReducer";
import TeacherCard from "./component/TeacherCard";
import { getUserById } from "../../redux/reducers/AuthReducer";
import BookingPageSkeleton from "./component/BookingPageSkeleton";

export default function LessonBooking() {
  const { id } = useParams();
  const location = useLocation();
  const preview = location.state?.preview;
  const { lesson: fetchedLesson, Teacheridlessons } = useSelector((state) => state.lesson);

  const lesson =
    fetchedLesson && (fetchedLesson._id === id || fetchedLesson.id === id)
      ? fetchedLesson
      : preview && (preview._id === id || preview.id === id)
        ? preview
        : null;

  const { userbyid } = useSelector((state) => state.auth);
  const { favorites, lessonReviews } = useSelector((state) => state.favorite);
  const {
    weeklyAvailability,
    dateAvailability,
    lessonWeeklyAvailability,
    lessonDateAvailability,
    hasAvailability,
    timeZone,
    loading: availabilityLoading,
    error,
    successMessage,
    dateUnAvailability,
  } = useSelector((state) => state.availability);
  const dispatch = useDispatch();
  const [date, setDate] = useState(new Date(2024, 1, 21));
  const [time, setTime] = useState("5:00 PM");
  const [activeTab, setActiveTab] = useState("lesson");
  const [reviewCount, setReviewCount] = useState(0);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(true);
  const [isPictureOpen, setIsPictureOpen] = useState(true);

  useEffect(() => {
    if (lessonReviews?.length) {
      setReviewCount(lessonReviews.length);
    }
  }, [lessonReviews]);

  // Clear availability data when component mounts or lesson ID changes
  useEffect(() => {
    dispatch(clearAvailabilityData());
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(getLessonById(id));
    dispatch(getLessonRating(id));
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(getUserFavorites());
  }, [dispatch]);

  const teacherId = lesson?.createdBy?._id || lesson?.teacher?._id;

  // Fetch all availability data when lesson and teacherId are loaded
  useEffect(() => {
    const activeTeacherId = fetchedLesson?.createdBy?._id || teacherId;
    if (fetchedLesson && (fetchedLesson._id === id || fetchedLesson.id === id) && activeTeacherId) {
      dispatch(getTeacherUnAvailability({ id: activeTeacherId }));
      dispatch(getUserById(activeTeacherId));
      dispatch(getTeacherLessonsById({ id: activeTeacherId, page: 1, limit: 6 }));

      if (fetchedLesson.calender === true) {
        dispatch(getTeacherAvailability({ id: activeTeacherId }));
      } else if (fetchedLesson.calenderId) {
        dispatch(getLessonAvailability({ id: fetchedLesson.calenderId }));
      }
    }
  }, [dispatch, fetchedLesson, id, teacherId]);

  const handleSave = (courseId) => {
    dispatch(toggleFavorite({ id: courseId, type: "lesson" })).then((res) => {
      if (res.payload.status) {
        toast.success(res.payload.message || "Saved to favorites");
        dispatch(getUserFavorites());
      } else {
        toast.info(res.payload.message);
      }
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lessonFavorites = Array.isArray(favorites)
    ? favorites.filter((fav) => fav?.lesson)
    : favorites?.lessons || [];

  const isBookmarked = lessonFavorites?.some((fav) => fav?.lesson?._id === id);
  const hasOnline = Boolean(lesson?.isOnline);
  const hasInPerson = Boolean(lesson?.location);
  const locationLabel = hasOnline && hasInPerson
    ? "Online and in person"
    : hasOnline
      ? "Online"
      : lesson?.location || "In Person";
  const calendarLocation = hasInPerson ? lesson?.location : "Online";

  if (!lesson) {
    return (
      <MainLayout width="100%" contentClassName="lg:overflow-x-visible">
        <BookingPageSkeleton isCurriculum={false} />
      </MainLayout>
    );
  }

  return (
    <MainLayout width="100%" contentClassName="lg:overflow-x-visible">
      <div className="w-full min-h-screen pb-8">
        <div className="w-full">
          {/* Mobile Header Controls */}
          <div className="flex md:hidden items-center justify-between w-full mx-auto mb-3 pt-3">
            <Link
              to={`/`}
              className="flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <ArrowLeft size={20} />
            </Link>

            <div className="flex items-center gap-5">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast.success("Copied to clipboard!");
                  } catch (err) {
                    toast.error("Failed to copy: ", err);
                  }
                }}
                className="flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <Link2 size={20} />
              </button>
              <button
                onClick={() => handleSave(lesson?._id)}
                className="flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <Heart
                  size={20}
                  className={`${isBookmarked ? "fill-red-500 text-red-500" : ""
                    }`}
                />
              </button>
            </div>
          </div>

          {/* Top section with Grey Bar and Title */}
          <div className="w-full pt-[20px] sm:pt-[24px]">

            {/* Grey Bar with Breadcrumb Navigation */}
            {lesson?.category && (
              <div className="-mx-3 md:-mx-10 px-3 md:px-10 bg-[#F5F5F5] py-2.5 mb-[30px]">
                <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                  <Link to="/" className="hover:text-[#1A2B49] hover:underline transition-colors flex items-center gap-1.5">
                    <Home size={14} className="text-gray-500 shrink-0" />
                    <span>Home</span>
                  </Link>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                  <Link
                    to={`/?category=${lesson?.category}`}
                    className="hover:text-[#1A2B49] hover:underline transition-colors"
                  >
                    {lesson?.category}
                  </Link>
                </nav>
              </div>
            )}

            {/* 1. TITLE */}
            <div className="w-full">
              <h1 className="text-[22px] sm:text-[28px] font-bold text-left text-[#1A2B49] tracking-tight leading-none font-dmsans">
                {lesson?.title || "Lesson Title"}
              </h1>
            </div>

            {/* 2. ACTIONS & INFO ROW (Immediately on the next line below Title - 10px vertical gap) */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-5 mt-[10px] text-[#1A2B49] font-semibold">
              {/* Copy Link Button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast.success("URL copied to clipboard!");
                  } catch (err) {
                    toast.error("Failed to copy: ", err);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-[#1A2B49] hover:opacity-75 text-xs sm:text-sm font-semibold cursor-pointer transition-opacity shrink-0"
              >
                <Copy size={14} strokeWidth={1.8} className="shrink-0 text-[#1A2B49]" />
                <span>Copy link</span>
              </button>

              {/* Save Button */}
              <button
                type="button"
                onClick={() => handleSave(lesson?._id)}
                className="inline-flex items-center gap-1.5 text-[#1A2B49] hover:opacity-75 text-xs sm:text-sm font-semibold cursor-pointer transition-opacity shrink-0"
              >
                <svg width="15" height="13" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[#1A2B49]">
                  <path
                    d="M7.6 1C9.29038 1 10.8323 1.84142 12 2.8C13.1677 1.84142 14.7096 1 16.4 1C20.0451 1 23 3.71049 23 7.05386C23 13.795 15.3274 17.721 12.7981 18.8321C12.2886 19.056 11.7114 19.056 11.2019 18.8321C8.67259 17.721 1 13.7948 1 7.0537C1 3.71033 3.95492 1 7.6 1Z"
                    stroke={isBookmarked ? "#C70036" : "currentColor"}
                    fill={isBookmarked ? "#C70036" : "none"}
                    strokeWidth="1.8"
                  />
                </svg>
                <span>{isBookmarked ? "Saved" : "Save"}</span>
              </button>

              {/* Online / Location */}
              <span className="inline-flex items-center gap-1.5 text-[#1A2B49] text-xs sm:text-sm font-semibold shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[#1A2B49]">
                  <path d="M10.9951 22.4248C11.6339 22.7505 12.3661 22.7505 13.0049 22.4248C14.4088 21.709 16.6199 20.4276 18.6113 18.6152C20.6087 16.7975 22.31 14.5151 22.8438 11.8066C23.285 9.56749 22.8142 6.86911 21.1465 4.74219C19.5025 2.64547 16.6113 1 12 1C7.38874 1 4.49752 2.64547 2.85352 4.74219C1.18584 6.86911 0.714933 9.56749 1.15625 11.8066C1.69007 14.5151 3.39134 16.7975 5.38867 18.6152C7.38012 20.4276 9.59123 21.709 10.9951 22.4248Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="4" cy="4" r="3" transform="matrix(-1 0 0 1 16 6)" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span>{locationLabel} {lesson?.location ? `(${lesson?.location})` : ""}</span>
              </span>

              {/* Timezone */}
              <span className="inline-flex items-center gap-1.5 text-[#1A2B49] text-xs sm:text-sm font-semibold shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[#1A2B49]">
                  <path d="M12 23C14.4477 23 16.3465 22.8672 17.8271 22.5381C19.2964 22.2115 20.2925 21.7056 20.999 20.999C21.7056 20.2925 22.2115 19.2964 22.5381 17.8271C22.8672 16.3465 23 14.4477 23 12C23 9.55232 22.8672 7.65353 22.5381 6.17285C22.2115 4.70364 21.7056 3.70752 20.999 3.00098C20.2925 2.29443 19.2964 1.78846 17.8271 1.46191C16.3465 1.13284 14.4477 1 12 1C9.55232 1 7.65353 1.13284 6.17285 1.46191C4.70364 1.78846 3.70752 2.29443 3.00098 3.00098C2.29443 3.70752 1.78846 4.70364 1.46191 6.17285C1.13284 7.65353 1 9.55232 1 12C1 14.4477 1.13284 16.3465 1.46191 17.8271C1.78846 19.2964 2.29443 20.2925 3.00098 20.999C3.70752 21.7056 4.70364 22.2115 6.17285 22.5381C7.65353 22.8672 9.55232 23 12 23Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 6C12 6 12 10 12 11C12 12 12 12 13 12C14 12 18 12 18 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{timeZone}</span>
              </span>

              {/* Duration */}
              <span className="inline-flex items-center gap-1.5 text-[#1A2B49] text-xs sm:text-sm font-semibold shrink-0">
                <svg width="13" height="16" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[#1A2B49]">
                  <path d="M10 0C12.8746 0 14.6892 0.650127 15.7695 1.73047C16.8588 2.81975 16.9984 4.14527 16.999 4.99414C19.2293 6.08989 19.929 8.26342 19.9951 12.3223L20 13C20 17.4969 19.3495 19.8486 16.999 21.0039C16.9986 21.8527 16.8596 23.1794 15.7695 24.2695C14.6892 25.3499 12.8746 26 10 26C7.12543 26 5.31081 25.3499 4.23047 24.2695C3.1391 23.1782 3.0001 21.8497 3 21.001C0.651142 19.8452 0 17.4956 0 13C0 8.50337 0.649857 6.15054 3 4.99512C3.00053 4.14628 3.14077 2.82017 4.23047 1.73047C5.31081 0.65013 7.12543 0 10 0ZM5.05078 21.6514C5.12323 22.0828 5.28897 22.4999 5.64453 22.8555C6.18919 23.4001 7.37457 24 10 24C12.6254 24 13.8108 23.4001 14.3555 22.8555C14.7107 22.5002 14.8757 22.0833 14.9482 21.6523C13.8068 21.8719 12.4237 21.9731 10.7529 21.9951L10 22C7.98616 22 6.35958 21.9033 5.05078 21.6514ZM10 6C7.98189 6 6.48373 6.09952 5.35547 6.3252C4.23949 6.54843 3.62662 6.86817 3.25 7.20703C2.50661 7.87608 2 9.24522 2 13C2 16.7548 2.50661 18.1239 3.25 18.793C3.62662 19.1318 4.23949 19.4516 5.35547 19.6748C6.48373 19.9005 7.98189 20 10 20C12.0181 20 13.5163 19.9005 14.6445 19.6748C15.7605 19.4516 16.3734 19.1318 16.75 18.793C17.4934 18.1239 18 16.7548 18 13C18 9.24522 17.4934 7.87608 16.75 7.20703C16.3734 6.86817 15.7605 6.54843 14.6445 6.3252C13.5163 6.09952 12.0181 6 10 6ZM10 2C7.37457 2 6.18919 2.59987 5.64453 3.14453C5.2895 3.49957 5.12341 3.91597 5.05078 4.34668C6.19232 4.127 7.5759 4.02693 9.24707 4.00488L10 4C12.0131 4 13.6396 4.09496 14.9482 4.34668C14.8756 3.91602 14.7105 3.49952 14.3555 3.14453C13.8108 2.59987 12.6254 2 10 2Z" fill="currentColor" />
                  <path d="M10 9C10 9 10 11 10 12C10 13 9.99999 13 11 13C12 13 15 13 15 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{lesson?.duration || "30mins"}</span>
              </span>

              {/* Rating */}
              <span className="inline-flex items-center gap-1.5 text-[#1A2B49] text-xs sm:text-sm font-semibold shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[#1A2B49]">
                  <path d="M12.0312 1C13.0666 1 14.6926 5.69969 15.2795 7.50668C15.4141 7.92126 15.7943 8.20684 16.23 8.22162C18.1151 8.28556 23 8.55772 23 9.66144C23 10.7495 19.5188 13.4853 18.0955 14.5583C17.7427 14.8243 17.5982 15.2836 17.734 15.704C18.3132 17.4975 19.7048 22.1483 18.8117 22.8815C17.9323 23.6034 14.1749 20.7486 12.6485 19.5286C12.2692 19.2254 11.7305 19.2251 11.3511 19.528C9.82346 20.7477 6.06764 23.6035 5.25065 22.8815C4.41962 22.1471 5.73815 17.4816 6.28237 15.6949C6.40915 15.2786 6.26319 14.8287 5.91569 14.5668C4.4996 13.4997 1 10.7523 1 9.66144C1 8.55659 5.89498 8.285 7.77586 8.22142C8.20861 8.2068 8.58723 7.92462 8.72415 7.51385C9.32468 5.71216 10.9944 1 12.0312 1Z" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{lesson?.averageRating === 0 ? 100 : lesson?.averageRating || 100}%</span>
              </span>
            </div>

            {/* 5 EQUAL COLUMNS LAYOUT: Col 1 (Meet Your Teacher), Col 2 (Images), Col 3 (Description & How It Works), Col 4 (Calendar), Col 5 (Reviews) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 mt-[30px] h-fit w-full items-start">

              {/* COLUMN 1: Meet Your Teacher */}
              <div className="w-full xl:max-h-[calc(100vh-100px)] xl:overflow-y-auto custom-scrollbar pr-0.5">
                <TeacherCard
                  layout="column"
                  teacher={lesson?.createdBy || userbyid}
                  name={lesson?.createdBy?.name || userbyid?.name}
                  averageRating={lesson?.createdBy?.averageRating || userbyid?.averageRating || lesson?.averageRating}
                  hideLesson={lesson?.createdBy?.hideLesson || userbyid?.hideLesson}
                  classHosted={lesson?.createdBy?.classHosted || userbyid?.classHosted}
                  classesAttended={lesson?.createdBy?.classesAttended || userbyid?.classesAttended}
                  classesHosted={lesson?.createdBy?.classesHosted || userbyid?.classesHosted}
                  bio={lesson?.createdBy?.bio || userbyid?.bio}
                  image={lesson?.createdBy?.image || userbyid?.image}
                  lession={Teacheridlessons?.length || 0}
                  location={lesson?.location || lesson?.createdBy?.location || userbyid?.location}
                  timeZone={timeZone}
                  className="mt-0"
                />
              </div>

              {/* COLUMN 2: Image Gallery (Vertical Stack with Collapsible Picture Bubble) */}
              <div className="w-full space-y-3 xl:max-h-[calc(100vh-100px)] xl:overflow-y-auto custom-scrollbar pr-1">
                <button
                  type="button"
                  onClick={() => setIsPictureOpen(!isPictureOpen)}
                  className="w-full bg-[#E9EAEE] rounded-[18px] sm:rounded-[20px] px-4 sm:px-5 py-3 flex justify-between items-center text-left text-[#1A2B49] shadow-none hover:bg-[#dfe1e6] transition-colors cursor-pointer"
                >
                  <span className="text-base sm:text-lg md:text-xl font-semibold text-[#1A2B49]">
                    Photos & Media
                  </span>
                  <ChevronDown
                    className={`transition-transform duration-200 text-gray-700 ${
                      isPictureOpen ? "rotate-180" : ""
                    }`}
                    size={20}
                  />
                </button>

                {isPictureOpen && (
                  <ImageGallery images={lesson?.images || []} layout="stack" />
                )}
              </div>

              {/* COLUMN 3: Description & How It Works (Collapsible Unit-Style Bubbles) */}
              <div className="w-full space-y-4 xl:max-h-[calc(100vh-100px)] xl:overflow-y-auto custom-scrollbar pr-1">
                {/* 1. Description Section */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                    className="w-full bg-[#E9EAEE] rounded-[18px] sm:rounded-[20px] px-4 sm:px-5 py-3 flex justify-between items-center text-left text-[#1A2B49] shadow-none hover:bg-[#dfe1e6] transition-colors cursor-pointer"
                  >
                    <span className="text-base sm:text-lg md:text-xl font-semibold text-[#1A2B49]">
                      Description
                    </span>
                    <ChevronDown
                      className={`transition-transform duration-200 text-gray-700 ${
                        isDescriptionOpen ? "rotate-180" : ""
                      }`}
                      size={20}
                    />
                  </button>

                  {isDescriptionOpen && (
                    <div className="w-full bg-[#E9EAEE] rounded-[20px] p-4 sm:p-5 shadow-none transition-all">
                      <div className="text-[#1A2B49] leading-relaxed text-sm break-words [overflow-wrap:anywhere]">
                        {lesson?.description ? (
                          typeof lesson.description === 'string' && lesson.description.includes('<') ? (
                            <div dangerouslySetInnerHTML={{ __html: lesson.description }} />
                          ) : (
                            lesson.description.split(/\r?\n/).map((line, idx) => (
                              <React.Fragment key={idx}>
                                {line}
                                <br />
                              </React.Fragment>
                            ))
                          )
                        ) : (
                          "No description available."
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. How it works Section */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
                    className="w-full bg-[#E9EAEE] rounded-[18px] sm:rounded-[20px] px-4 sm:px-5 py-3 flex justify-between items-center text-left text-[#1A2B49] shadow-none hover:bg-[#dfe1e6] transition-colors cursor-pointer"
                  >
                    <span className="text-base sm:text-lg md:text-xl font-semibold text-[#1A2B49]">
                      How it works
                    </span>
                    <ChevronDown
                      className={`transition-transform duration-200 text-gray-700 ${
                        isHowItWorksOpen ? "rotate-180" : ""
                      }`}
                      size={20}
                    />
                  </button>

                  {isHowItWorksOpen && (
                    <div className="w-full bg-[#E9EAEE] rounded-[20px] p-4 sm:p-5 shadow-none transition-all space-y-3">
                      <div className="flex items-start gap-2.5">
                        <div className="h-[22px] flex items-center shrink-0">
                          <FaCircleCheck className="text-[#1A2B49]" size={15} />
                        </div>
                        <p className="text-[#1A2B49] text-sm leading-[22px]">
                          Book your lesson and you’ll be instantly connected with your teacher.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="h-[22px] flex items-center shrink-0">
                          <FaCircleCheck className="text-[#1A2B49]" size={15} />
                        </div>
                        <p className="text-[#1A2B49] text-sm leading-[22px]">
                          Your teacher will let you know where the lesson will take place and share a meeting link with you.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="h-[22px] flex items-center shrink-0">
                          <FaCircleCheck className="text-[#1A2B49]" size={15} />
                        </div>
                        <p className="text-[#1A2B49] text-sm leading-[22px]">
                          You can message them anytime, ask questions, and get support. Your learning journey starts the moment you book.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMN 4: Reviews Section */}
              <div className="w-full">
                <ReviewsColumn
                  id={id}
                  title={lesson?.title}
                  type="lesson"
                  onReviewCountChange={(cnt) => setReviewCount(cnt)}
                />
              </div>

              {/* COLUMN 5: Calendar Section */}
              <div className="w-full xl:sticky xl:top-6 xl:self-start xl:h-fit">
                <Calendar
                  id={id}
                  myid={id}
                  selectedDate={date}
                  onSelect={setDate}
                  selectedTime={time}
                  onSelectTime={setTime}
                  weeklyAvailability={
                    lesson?.calenderId
                      ? lessonWeeklyAvailability
                      : weeklyAvailability
                  }
                  dateAvailability={
                    lesson?.calenderId
                      ? lessonDateAvailability
                      : dateAvailability
                  }
                  dateUnAvailability={dateUnAvailability}
                  teacherTimezone={timeZone}
                  type="lesson"
                  teacherData={lesson?.createdBy}
                  location={calendarLocation}
                  duration={lesson?.duration}
                  price={lesson?.price}
                  priceCurrency={lesson?.currency || "USD"}
                  capacity={lesson?.usecapacity}
                  discount={lesson?.discount}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
