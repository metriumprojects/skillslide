import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Copy, Expand, Heart, X, ChevronLeft, ChevronRight, Maximize2, MapPin, Clock, Timer, Link2 } from "lucide-react";
import { FaRegStar } from "react-icons/fa";
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
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getSingleCurriculum } from "../../redux/reducers/CurriculumReducer";
import {
  getCurriculumRating,
  getUserFavorites,
  toggleFavorite,
} from "../../redux/reducers/FavoriteReducer";
import { toast } from "react-toastify";
import SideUnit from "./component/SideUnit";
import { getTeacherAvailability, getTeacherUnAvailability, getLessonAvailability, clearAvailabilityData } from "../../redux/reducers/AvailabilityReducer";
import TeacherCard from "./component/TeacherCard";
import { getUserById } from "../../redux/reducers/AuthReducer";
import { FaCircleCheck } from "react-icons/fa6";

export default function CurriculumBooking() {
  const { id } = useParams();
  const { singleCurriculum, loading } = useSelector((state) => state.curriculum);
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

  const teacherId = singleCurriculum?.createdBy?._id;

  // Fetch all availability data when curriculum and teacherId are loaded
  useEffect(() => {
    // IMPORTANT: Only fetch availability if the loaded curriculum matches the URL ID
    if (singleCurriculum && singleCurriculum._id === id && teacherId) {
      // First fetch teacher unavailability
      dispatch(getTeacherUnAvailability({ id: teacherId }));
      dispatch(getUserById(teacherId));

      // Then fetch availability based on calendar type
      if (singleCurriculum.calenderId) {
        dispatch(getLessonAvailability({ id: singleCurriculum.calenderId }));
      } else {
        dispatch(getTeacherAvailability({ id: teacherId }));
      }
    }
    // Dependencies are crucial here to prevent re-running with stale data.
  }, [dispatch, singleCurriculum, id, teacherId]);

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
  },[])

  return (
    <MainLayout width="100%" contentClassName="lg:overflow-x-visible">
      {/* {loading || !singleCurriculum ? (
        <ProfessionalLoader message="Loading curriculum..." />
      ) : ( */}
      <div className="w-full min-h-screen flex flex-col items-center pb-8">
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
                  className={`${
                    isBookmarked ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </button>
            </div>
          </div>
          
              <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full pt-8">
                <nav className=" text-sm md:text-sm flex item-center gap-2">
              <Link to="/" className="flex items-center gap-2">Home  <ChevronRight  size={20}/></Link> <Link to={`/?category=${singleCurriculum?.category}`} className="flex items-center gap-2"> {singleCurriculum?.category}</Link>
            </nav>

            {/* Buttons */}
            <div className="hidden md:flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast.success("URL copied to clipboard!");
                  } catch (err) {
                    toast.error("Failed to copy: ", err);
                  }
                }}
                className="border border-[#ddd] px-5 py-2 font-medium rounded-[10px] text-sm flex items-center justify-center gap-3 w-full md:w-auto  cursor-pointer"
              >
                Copy link <IoMdLink size={20} />
              </button>
              <button
                onClick={() => handleSave(singleCurriculum?._id)}
                className="border border-[#ddd] px-5 py-2 font-medium rounded-[10px] text-sm flex items-center justify-center gap-3 w-full md:w-auto  cursor-pointer"
              >
                Save{" "}
                <Heart
                  size={20}
                  className={`${
                    isBookmarked ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="w-full">

          

          <h1 className="text-lg md:text-2xl font-semibold text-left w-full md:w-auto mt-7.5">
            {singleCurriculum?.title || "Curriculum Title"}
          </h1>

          <div className="flex flex-col gap-2 max-w-fit mt-5">
            <div className="flex flex-col md:flex-row flex-wrap md:items-center gap-4 md:gap-5 text-sm text-black">
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span>
                  {singleCurriculum?.isOnline && singleCurriculum?.supportsInPerson
                    ? "Online and in person"
                    : singleCurriculum?.isOnline
                    ? "Online"
                    : singleCurriculum?.supportsInPerson
                    ? (singleCurriculum?.location || "In Person")
                    : (singleCurriculum?.location || "Online")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>{timeZone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer size={18} />
                <span>{singleCurriculum?.lessonPosition?.[0]?.lId?.duration || "30mins"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaRegStar size={18} />
                <span>{singleCurriculum?.averageRating || "100"}%</span>
              </div>
            </div>
          </div>

          {/* 3-Column Layout: Column 1 (Media & Details), Column 2 (What's Included), Column 3 (Calendar) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-6 lg:gap-8 mt-3 md:mt-7.5 h-fit w-full">
            
            {/* COLUMN 1: Image Gallery & Lesson/Curriculum Details */}
            <div className="col-span-1 lg:col-span-7 xl:col-span-5 flex flex-col">
              <ImageGallery images={singleCurriculum?.images || []} />

              <div className="mt-5 w-full space-y-8">
                {/* Description Section */}
                <div className="rounded-3xl h-fit">
                  <h2 className="text-lg md:text-xl font-semibold mb-4">
                    Description
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-sm">
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

                {/* How it works */}
                <div className="rounded-3xl h-fit">
                  <h2 className="text-lg md:text-xl font-semibold mb-4">
                    How it works
                  </h2>
                  <div className="text-black leading-relaxed text-sm space-y-4">
                    <p className="flex items-center gap-2">
                      <span><FaCircleCheck className="text-primary shrink-0" /></span>
                      Book your lesson and you’ll be instantly connected with your teacher.
                    </p>
                    <p className="flex items-center gap-2">
                      <span><FaCircleCheck className="text-primary shrink-0" /></span>
                      Your teacher will let you know where the lesson will take place and share a meeting link with you.
                    </p>
                    <p className="flex items-center gap-2">
                      <span><FaCircleCheck className="text-primary shrink-0" /></span>
                      You can message them anytime, ask questions, and get support. Your learning journey starts the moment you book.
                    </p>
                  </div>
                </div>

                {/* Meet your teacher */}
                <TeacherCard 
                  teacher={singleCurriculum?.createdBy || userbyid}
                  name={singleCurriculum?.createdBy?.name || userbyid?.name}
                  averageRating={singleCurriculum?.createdBy?.averageRating || userbyid?.averageRating}
                  hideLesson={singleCurriculum?.createdBy?.hideLesson || userbyid?.hideLesson}
                  classHosted={singleCurriculum?.createdBy?.classHosted || userbyid?.classHosted}
                  classesAttended={singleCurriculum?.createdBy?.classesAttended || userbyid?.classesAttended}
                  classesHosted={singleCurriculum?.createdBy?.classesHosted || userbyid?.classesHosted}
                  bio={singleCurriculum?.createdBy?.bio || userbyid?.bio}
                  image={singleCurriculum?.createdBy?.image || userbyid?.image}
                />
              </div>
            </div>

            {/* COLUMN 2: What's Included (Units & Lessons) */}
            <div className="col-span-1 lg:col-span-7 xl:col-span-4 mt-6 xl:mt-0">
              <div className="relative w-full">
                <span className="absolute right-1 top-1 z-10 cursor-pointer p-1 hover:bg-gray-100 rounded-md transition-colors" title="Expand view">
                  <img onClick={() => setShowUnit(true)} src="/expand.svg" className="h-4 w-4" alt="Expand" />
                </span>
                <SideUnit Data={singleCurriculum} />
              </div>
            </div>

            {/* COLUMN 3: Calendar Section */}
            <div className="col-span-1 lg:col-span-5 xl:col-span-3 mt-6 lg:mt-0 lg:sticky lg:top-6 lg:self-start lg:h-fit">
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
                />
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
        <div className="w-full mt-10">
          {curriReviews && curriReviews.length > 0 && (
            <Reviews lessonReviews={curriReviews} />
          )}
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
