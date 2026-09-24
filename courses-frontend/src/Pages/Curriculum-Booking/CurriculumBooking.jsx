import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Copy, Expand, Heart, X, ChevronLeft, ChevronRight, ChevronDown, Maximize2, MapPin, Clock, Timer, Link2, Home } from "lucide-react";
import { FaRegStar } from "react-icons/fa";
import { FaCircleCheck } from "react-icons/fa6";
import { IoMdLink } from "react-icons/io";
import MainLayout from "../../components/MainLayout";
import ProfessionalLoader from "../../components/ProfessionalLoader";
import { Calendar } from "./component/Calender";
import UnitsSection from "./component/UnitsSection";
import Reviews from "./component/Reviews";
import ImageGallery from "./component/ImageGallery";
import { FiDollarSign } from "react-icons/fi";
import { FiClock } from "react-icons/fi";
import { GrLocation } from "react-icons/gr";
import { ArrowLeft, Upload } from "lucide-react";
import { Link, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getSingleCurriculum } from "../../redux/reducers/CurriculumReducer";
import {
  getCurriculumRating,
  getUserFavorites,
  toggleFavorite,
} from "../../redux/reducers/FavoriteReducer";
import { toast } from "react-toastify";
import SideUnit from "./component/SideUnit";
import ReviewsColumn from "./component/ReviewsColumn";
import { getTeacherAvailability, getTeacherUnAvailability, getLessonAvailability, clearAvailabilityData } from "../../redux/reducers/AvailabilityReducer";
import TeacherCard from "./component/TeacherCard";
import { getUserById } from "../../redux/reducers/AuthReducer";
import BookingPageSkeleton from "./component/BookingPageSkeleton";

export default function CurriculumBooking() {
  const { id } = useParams();
  const location = useLocation();
  const preview = location.state?.preview;
  const { singleCurriculum: fetchedCurriculum, loading } = useSelector((state) => state.curriculum);

  const singleCurriculum =
    fetchedCurriculum && (fetchedCurriculum._id === id || fetchedCurriculum.id === id)
      ? fetchedCurriculum
      : preview && (preview._id === id || preview.id === id)
        ? preview
        : null;

  const { favorites, curriReviews } = useSelector((state) => state.favorite);
  const { userbyid } = useSelector((state) => state.auth);
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
  const [showUnit, setShowUnit] = useState(false);
  const [activeTab, setActiveTab] = useState("curriculum");
  const [reviewCount, setReviewCount] = useState(0);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(true);
  const [isPictureOpen, setIsPictureOpen] = useState(true);

  useEffect(() => {
    if (curriReviews?.length) {
      setReviewCount(curriReviews.length);
    }
  }, [curriReviews]);

  // Clear availability data when component mounts or curriculum ID changes
  useEffect(() => {
    dispatch(clearAvailabilityData());
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(getSingleCurriculum(id));
    dispatch(getCurriculumRating(id));
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(getUserFavorites());
  }, [dispatch]);

  const teacherId = singleCurriculum?.createdBy?._id || singleCurriculum?.teacher?._id;

  // Fetch all availability data when curriculum and teacherId are loaded
  useEffect(() => {
    const activeTeacherId = fetchedCurriculum?.createdBy?._id || teacherId;
    if (fetchedCurriculum && (fetchedCurriculum._id === id || fetchedCurriculum.id === id) && activeTeacherId) {
      dispatch(getTeacherUnAvailability({ id: activeTeacherId }));
      dispatch(getUserById(activeTeacherId));

      if (fetchedCurriculum.calenderId) {
        dispatch(getLessonAvailability({ id: fetchedCurriculum.calenderId }));
      } else {
        dispatch(getTeacherAvailability({ id: activeTeacherId }));
      }
    }
  }, [dispatch, fetchedCurriculum, id, teacherId]);

  const curriculumFavorites = Array.isArray(favorites)
    ? favorites.filter((fav) => fav?.curriculum)
    : favorites?.curriculums || [];

  const isBookmarked = curriculumFavorites?.some(
    (fav) => fav?.curriculum?._id === id
  );

  const handleSave = (courseId) => {
    dispatch(toggleFavorite({ id: courseId, type: "curriculum" })).then(
      (res) => {
        if (res.payload.status) {
          toast.success(res.payload.message || "Saved to favorites");
          dispatch(getUserFavorites());
        } else {
          toast.info(res.payload.message);
        }
      }
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!singleCurriculum) {
    return (
      <MainLayout width="100%" contentClassName="lg:overflow-x-visible">
        <BookingPageSkeleton isCurriculum={true} />
      </MainLayout>
    );
  }

  return (
    <MainLayout width="100%" contentClassName="lg:overflow-x-visible">
      <div className="w-full min-h-screen pb-8">
        <div className="w-full">
          <div className="flex md:hidden items-center justify-between w-full mx-auto mb-3 pt-3">
            {/* Left Button */}
            <Link
              to={`/`}
              className=" flex items-center justify-center rounded-full  hover:bg-gray-100 transition"
            >
              <ArrowLeft size={20} />
            </Link>

            {/* Right Buttons */}
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
                className=" flex items-center justify-center rounded-full  hover:bg-gray-100 transition"
              >
                <Link2 size={20} />
              </button>
              <button
                onClick={() => handleSave(singleCurriculum?._id)}
                className=" flex items-center justify-center rounded-full  hover:bg-gray-100 transition"
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
            {singleCurriculum?.category && (
              <div className="-mx-3 md:-mx-10 px-3 md:px-10 bg-[#F5F5F5] py-2.5 mb-[30px]">
                <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                  <Link to="/" className="hover:text-[#1A2B49] hover:underline transition-colors flex items-center gap-1.5">
                    <Home size={14} className="text-gray-500 shrink-0" />
                    <span>Home</span>
                  </Link>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                  <Link
                    to={`/?category=${singleCurriculum?.category}`}
                    className="hover:text-[#1A2B49] hover:underline transition-colors"
                  >
                    {singleCurriculum?.category}
                  </Link>
                </nav>
              </div>
            )}

            {/* 1. TITLE */}
            <div className="w-full">
              <h1 className="text-[22px] sm:text-[28px] font-bold text-left text-[#1A2B49] tracking-tight leading-none font-dmsans">
                {singleCurriculum?.title || "Curriculum Title"}
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
                onClick={() => handleSave(singleCurriculum?._id)}
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
                <span>
                  {singleCurriculum?.isOnline && singleCurriculum?.supportsInPerson
                    ? "Online and in person"
                    : singleCurriculum?.isOnline
                      ? "Online"
                      : singleCurriculum?.supportsInPerson
                        ? (singleCurriculum?.location || "In Person")
                        : (singleCurriculum?.location || "Online")}
                </span>
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
                <span>{singleCurriculum?.lessonPosition?.[0]?.lId?.duration || "30mins"}</span>
              </span>

              {/* Rating */}
              <span className="inline-flex items-center gap-1.5 text-[#1A2B49] text-xs sm:text-sm font-semibold shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[#1A2B49]">
                  <path d="M12.0312 1C13.0666 1 14.6926 5.69969 15.2795 7.50668C15.4141 7.92126 15.7943 8.20684 16.23 8.22162C18.1151 8.28556 23 8.55772 23 9.66144C23 10.7495 19.5188 13.4853 18.0955 14.5583C17.7427 14.8243 17.5982 15.2836 17.734 15.704C18.3132 17.4975 19.7048 22.1483 18.8117 22.8815C17.9323 23.6034 14.1749 20.7486 12.6485 19.5286C12.2692 19.2254 11.7305 19.2251 11.3511 19.528C9.82346 20.7477 6.06764 23.6035 5.25065 22.8815C4.41962 22.1471 5.73815 17.4816 6.28237 15.6949C6.40915 15.2786 6.26319 14.8287 5.91569 14.5668C4.4996 13.4997 1 10.7523 1 9.66144C1 8.55659 5.89498 8.285 7.77586 8.22142C8.20861 8.2068 8.58723 7.92462 8.72415 7.51385C9.32468 5.71216 10.9944 1 12.0312 1Z" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{singleCurriculum?.averageRating || "100"}%</span>
              </span>
            </div>

            {/* 4. 6 EQUAL COLUMNS LAYOUT: Col 1 (Meet Your Teacher), Col 2 (Images), Col 3 (Description), Col 4 (Units & Lessons), Col 5 (Calendar), Col 6 (Reviews) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5 mt-[30px] h-fit w-full items-start">

              {/* COLUMN 1: Meet Your Teacher */}
              <div className="w-full xl:max-h-[calc(100vh-100px)] xl:overflow-y-auto custom-scrollbar pr-0.5">
                <TeacherCard
                  layout="column"
                  teacher={singleCurriculum?.createdBy || userbyid}
                  name={singleCurriculum?.createdBy?.name || userbyid?.name}
                  averageRating={singleCurriculum?.createdBy?.averageRating || userbyid?.averageRating || singleCurriculum?.averageRating}
                  hideLesson={singleCurriculum?.createdBy?.hideLesson || userbyid?.hideLesson}
                  classHosted={singleCurriculum?.createdBy?.classHosted || userbyid?.classHosted}
                  classesAttended={singleCurriculum?.createdBy?.classesAttended || userbyid?.classesAttended}
                  classesHosted={singleCurriculum?.createdBy?.classesHosted || userbyid?.classesHosted}
                  bio={singleCurriculum?.createdBy?.bio || userbyid?.bio}
                  image={singleCurriculum?.createdBy?.image || userbyid?.image}
                  lession={singleCurriculum?.lessonPosition?.length || 0}
                  location={singleCurriculum?.location || singleCurriculum?.createdBy?.location || userbyid?.location}
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
                  <ImageGallery images={singleCurriculum?.images || []} layout="stack" />
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
                      <p className="text-[#1A2B49] leading-relaxed text-sm break-words [overflow-wrap:anywhere]">
                        {singleCurriculum?.description
                          ? singleCurriculum.description
                            .split(/\r?\n/)
                            .map((line, idx) => (
                              <React.Fragment key={idx}>
                                {line}
                                <br />
                              </React.Fragment>
                            ))
                          : "No description available."}
                      </p>
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

              {/* COLUMN 4: Units & Lessons */}
              <div className="w-full xl:max-h-[calc(100vh-100px)] xl:overflow-y-auto custom-scrollbar pr-1">
                <SideUnit Data={singleCurriculum} onExpand={() => setShowUnit(true)} />
              </div>

              {/* COLUMN 5: Reviews Section */}
              <div className="w-full">
                <ReviewsColumn
                  id={id}
                  title={singleCurriculum?.title}
                  type="curriculum"
                  onReviewCountChange={(cnt) => setReviewCount(cnt)}
                />
              </div>

              {/* COLUMN 6: Calendar Section */}
              <div className="w-full xl:sticky xl:top-6 xl:self-start xl:h-fit">
                {singleCurriculum?.lessonPosition && singleCurriculum?.lessonPosition.length > 0 && singleCurriculum?.lessonPosition[0]?.lId ? (
                  <Calendar
                    id={id}
                    myid={singleCurriculum?.lessonPosition[0]?.lId?._id}
                    selectedDate={date}
                    onSelect={setDate}
                    selectedTime={time}
                    onSelectTime={setTime}
                    weeklyAvailability={lessonWeeklyAvailability || weeklyAvailability}
                    dateAvailability={lessonDateAvailability || dateAvailability}
                    teacherTimezone={timeZone}
                    type="curri"
                    dateUnAvailability={dateUnAvailability}
                    teacherData={singleCurriculum?.createdBy}
                    location={
                      singleCurriculum?.isOnline && singleCurriculum?.supportsInPerson
                        ? "Online and in person"
                        : singleCurriculum?.isOnline
                          ? "Online"
                          : singleCurriculum?.supportsInPerson
                            ? (singleCurriculum?.location || "In Person")
                            : (singleCurriculum?.location || "Online")
                    }
                    duration={singleCurriculum?.lessonPosition?.[0]?.lId?.duration}
                    price={singleCurriculum?.price}
                    priceCurrency={singleCurriculum?.currency || "USD"}
                  />
                ) : loading ? (
                  <div className="w-full bg-white border border-gray-200 rounded-[24px] p-5 sm:p-6 shadow-sm flex flex-col space-y-4 min-h-[460px] animate-pulse">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="h-5 w-32 bg-gray-200 rounded-full" />
                      <div className="h-7 w-20 bg-gray-200 rounded-full" />
                    </div>
                    <div className="grid grid-cols-7 gap-2 pt-2">
                      {Array.from({ length: 28 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-gray-100" />
                      ))}
                    </div>
                    <div className="h-12 w-full bg-primary/20 rounded-full mt-4" />
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        No Lessons Available
                      </h3>
                      <p className="text-sm text-gray-600">
                        This curriculum doesn't have any lessons yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* )} */}
      {showUnit && (
        <div className="fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full bg-black/20">
          <div className="relative max-w-6xl h-[90vh] overflow-auto rounded-2xl hide-scrollbar mx-auto">
            <span className="absolute right-6 top-16">
              <X
                onClick={() => setShowUnit(false)}
                size={22}
                className="text-gray-700"
              />
            </span>
            <UnitsSection Data={singleCurriculum} />
          </div>
        </div>
      )}
    </MainLayout>
  );
}
