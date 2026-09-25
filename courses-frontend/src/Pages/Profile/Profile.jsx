import React, { useEffect, useState, Suspense } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { Star, Edit3, Loader, Edit, Smile, Frown, Plus } from "lucide-react";
import { FaInstagram, FaStar, FaYoutube } from "react-icons/fa";
import { SlSocialYoutube } from "react-icons/sl";

import MainLayout from "../../components/MainLayout";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  becomeTeacher,
  getUser,
  updateProfileImage,
} from "../../redux/reducers/AuthReducer";
import { toast } from "react-toastify";
import useTeacherPayoutCurrencies from "../../hooks/useTeacherPayoutCurrencies";

// Lazy-load tab components — only downloaded when user switches to that tab
const Booked = React.lazy(() => import("./components/Booked"));
const Upcoming = React.lazy(() => import("./components/Upcoming"));
const UnShaduled = React.lazy(() => import("./components/UnShaduled"));
const Canceled = React.lazy(() => import("./components/Canceled"));
const BookMark = React.lazy(() => import("./components/BookMark"));
const TeacherDashboard = React.lazy(() => import("./components/TeacherDashboard"));
const Lessons = React.lazy(() => import("./components/Lesson"));
const Curriculum = React.lazy(() => import("./components/Curriculum"));
const Calender = React.lazy(() => import("./components/Calendar"));
const Request = React.lazy(() => import("./components/Request"));
const StudentDashboard = React.lazy(() => import("./components/StudentDashboard"));
const Revenu = React.lazy(() => import("./TeacherComponents/Revenu"));
const MyProfile = React.lazy(() => import("./components/MyProfile"));
const PayoutHistory = React.lazy(() => import("./TeacherComponents/PayoutHistory"));

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userInfo, loading } = useSelector((state) => state.auth);
  const { hasPaymentSetup } = useTeacherPayoutCurrencies();
  const [profileImage, setProfileImage] = useState(userInfo?.image?.url);
  const fileInputRef = React.useRef(null);

  const requestedTab = searchParams.get("tab");
  const normalizedTab =
    requestedTab === "Student Dashboard" || requestedTab === "Dashboard"
      ? "My Schedule"
      : requestedTab === "Upcoming" ||
        requestedTab === "All my Booking" ||
        requestedTab === "All My Booking" ||
        requestedTab === "Bookings"
      ? "All My Bookings"
      : requestedTab;
  const tab =
    normalizedTab === "Bookmarks"
      ? "My Bookmarks"
      : normalizedTab || (userInfo?.role === "user" ? "All My Bookings" : "Revenue");

  useEffect(() => {
    if (userInfo) {
      // Set initial tab from query param or default based on role
      if (!searchParams.get("tab") || searchParams.get("tab") === "Student Dashboard" || searchParams.get("tab") === "Dashboard") {
        setSearchParams({
          tab: userInfo.role === "user" ? "All My Bookings" : "Revenue",
        });
      }
      // Set initial profile image
      if (userInfo?.image?.url) {
        setProfileImage(userInfo?.image?.url);
      }
    }
  }, [userInfo]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setProfileImage(previewUrl);

    // Create FormData and upload
    const formData = new FormData();
    formData.append("image", file);

    try {
      await dispatch(updateProfileImage(formData)).unwrap();
    } catch (error) {
      toast.error("Image upload failed:", error);
      // Reset image on error
      if (userInfo?.image?.url) {
        setProfileImage(userInfo.image.url);
      }
    }
  };

  const handleTeacher = (role) => {
    if (role === "teacher") {
      const complete =
        userInfo?.sellerName?.trim() &&
        userInfo?.dateOfBirth &&
        userInfo?.country?.trim();
      if (!complete) {
        navigate("/create-teacher-profile");
        return;
      }
    }
    dispatch(becomeTeacher(role)).then((res) => {
      if (res.payload?.status) {
        toast.success(res.payload.message);
        dispatch(getUser());

        if (role === "user") {
          setSearchParams({ tab: "All My Bookings" });
        } else if (role === "teacher") {
          setSearchParams({ tab: "Revenue" });
        }
      } else if (res.payload?.needsSellerSetup) {
        navigate("/create-teacher-profile");
      } else {
        toast.error(res.payload?.message || "Unable to switch role");
      }
    });
  };

  // Student tabs - "All My Bookings" placed at 1st position
  const studentStates = [
    "All My Bookings",
    "My Schedule",
    "My Bookmarks",
    "My Profile",
    "My Requests",
    // "Booked",
    "Unscheduled",
    "Canceled",
  ];

  const teacherStates = [
    "Revenue",
    "My Bookmarks",
    "Lessons",
    "My Profile",
    "Calendar",
    "Curriculum",
    "Schedule",
    "Payout History",
    // "Booked",
    // "Upcoming",
    // "Unscheduled",
    // "Canceled",
  ];

  const tabsToShow = userInfo?.role === "user" ? studentStates : teacherStates;

  return (
    <MainLayout className="mx-auto" width="100%">
      <div className="min-h-screen w-full flex flex-col items-center pt-[16px] pb-10">
        {/* Bottom Tabs Section */}
        <div className="w-full">
          {/* Tabs Navigation - Scrollable Pill Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full max-w-full">
            <div className="w-full sm:w-fit max-w-full rounded-full overflow-hidden border-[1.5px] border-black bg-white p-1 font-medium text-black">
              <Swiper
                modules={[FreeMode]}
                freeMode={{ enabled: true, momentum: true }}
                slidesPerView="auto"
                spaceBetween={4}
                grabCursor
                className="w-full"
              >
                {tabsToShow.map((s, index) => (
                  <SwiperSlide key={index} className="!w-auto">
                    <button
                      onClick={() => setSearchParams({ tab: s })}
                      className={`whitespace-nowrap rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm transition-colors duration-200 cursor-pointer ${
                        tab === s
                          ? "bg-primary text-white shadow-sm"
                          : "text-black hover:bg-gray-100"
                      }`}
                    >
                      {s}
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {userInfo?.role === "teacher" && !hasPaymentSetup && (
              <button
                type="button"
                onClick={() => navigate("/withdraw-request")}
                className="h-[44px] sm:h-[50px] whitespace-nowrap inline-flex items-center justify-center rounded-full bg-black px-5 sm:px-6 text-xs sm:text-sm font-medium text-white hover:bg-neutral-800 transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                Complete your payment setup
              </button>
            )}
          </div>
          {/* {tab === "Booked" && <Booked />} */}
          <Suspense fallback={null}>
          {tab === "Revenue" && <Revenu />}
          {(tab === "All My Bookings" || tab === "All my Booking" || tab === "Upcoming") && <Upcoming />}
          {tab === "Unscheduled" && <UnShaduled />}
          {tab === "Canceled" && <Canceled />}
          {tab === "My Bookmarks" && <BookMark />}
          {(tab === "My Schedule" || tab === "Schedule") &&
            (userInfo?.role === "teacher" ? (
              <TeacherDashboard />
            ) : (
              <StudentDashboard />
            ))}
          {tab === "Student Dashboard" && <StudentDashboard />}
          {(tab === "My Lessons" || tab === "Lessons") && <Lessons />}
          {(tab === "My Curriculum" || tab === "Curriculum") && <Curriculum />}
          {(tab === "My Availability Calendar" || tab === "Calendar") && <Calender />}
          {tab === "My Requests" && <Request />}
          {tab === "My Profile" && <MyProfile />}
          {tab === "Payout History" && <PayoutHistory />}
          </Suspense>
        </div>
      </div>
    </MainLayout>
  );
}
