import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { Star, Edit3, Loader, Edit, Smile, Frown } from "lucide-react";
import { FaInstagram, FaStar, FaYoutube } from "react-icons/fa";
import { SlSocialYoutube } from "react-icons/sl";

import MainLayout from "../../components/MainLayout";
import Booked from "./components/Booked";
import Upcoming from "./components/Upcoming";
import UnShaduled from "./components/UnShaduled";
import Canceled from "./components/Canceled";
import BookMark from "./components/BookMark";
import { useSelector, useDispatch } from "react-redux";
import TeacherDashboard from "./components/TeacherDashboard";
import Lessons from "./components/Lesson";
import Curriculum from "./components/Curriculum";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  becomeTeacher,
  getUser,
  updateProfileImage,
} from "../../redux/reducers/AuthReducer";
import { toast } from "react-toastify";
import Calender from "./components/Calendar";
import Request from "./components/Request";
import StudentDashboard from "./components/StudentDashboard";
import Revenu from "./TeacherComponents/Revenu";
import MyProfile from "./components/MyProfile";
import PayoutHistory from "./TeacherComponents/PayoutHistory";
import useTeacherPayoutCurrencies from "../../hooks/useTeacherPayoutCurrencies";

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userInfo, loading } = useSelector((state) => state.auth);
  const { hasPaymentSetup } = useTeacherPayoutCurrencies();
  const [profileImage, setProfileImage] = useState(userInfo?.image?.url);
  const fileInputRef = React.useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const requestedTab = searchParams.get("tab");
  const normalizedTab =
    requestedTab === "Student Dashboard" || requestedTab === "Dashboard"
      ? "My Schedule"
      : requestedTab;
  const tab =
    normalizedTab === "Bookmarks"
      ? "My Bookmarks"
      : normalizedTab || (userInfo?.role === "user" ? "My Schedule" : "Revenue");

  useEffect(() => {
    if (userInfo) {
      // Set initial tab from query param or default based on role
      if (!searchParams.get("tab") || searchParams.get("tab") === "Student Dashboard" || searchParams.get("tab") === "Dashboard") {
        setSearchParams({
          tab: userInfo.role === "user" ? "My Schedule" : "Revenue",
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
          setSearchParams({ tab: "My Schedule" });
        } else if (role === "teacher") {
          setSearchParams({ tab: "Dashboard" });
        }
      } else if (res.payload?.needsSellerSetup) {
        navigate("/create-teacher-profile");
      } else {
        toast.error(res.payload?.message || "Unable to switch role");
      }
    });
  };

  // Student tabs - Updated to include "My Schedule"
  const studentStates = [
    "My Schedule",
    "My Bookmarks",
    "My Profile",
    "My Requests",
    // "Booked",
    "Upcoming",
    "Unscheduled",
    "Canceled",
  ];

  const teacherStates = [
    "Revenue",
    "My Bookmarks",
    "Lessons",
    "My Profile",
    "Calendar",
    "My Requests",
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
      <div className="min-h-screen w-full flex flex-col items-center pt-[20px] pb-10">
        {/* Bottom Tabs Section */}
        <div className="w-full">
          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center gap-3 w-full max-w-full">
            <div className="w-fit max-w-full rounded-full overflow-hidden border border-black bg-white p-1 font-medium text-black">
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
                      className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm transition-colors duration-200 ${
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

            {userInfo?.role === "teacher" && (
              <>
                {!hasPaymentSetup && (
                  <button
                    type="button"
                    onClick={() => navigate("/withdraw-request")}
                    className="h-[50px] whitespace-nowrap inline-flex items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-neutral-800 transition-colors shrink-0 shadow-sm"
                  >
                    Complete payments setup
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/create-lesson")}
                  className="h-[50px] whitespace-nowrap inline-flex items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-neutral-800 transition-colors shrink-0 shadow-sm"
                >
                  Create lesson
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/create-curriculum")}
                  className="h-[50px] whitespace-nowrap inline-flex items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-neutral-800 transition-colors shrink-0 shadow-sm"
                >
                  Create curriculum
                </button>
              </>
            )}
          </div>
          {/* Mobile Dropdown Tabs */}
          <div className="relative mb-4 md:hidden flex items-center justify-between gap-2">
            <button
              className="flex w-fit items-center justify-between rounded-full bg-primary px-5 py-2.5 font-medium text-white "
              onClick={() => setShowDropdown((prev) => !prev)}
              type="button"
            >
              {tab}
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {userInfo?.role === "teacher" && (
              <div className="flex items-center gap-2 shrink-0">
                {!hasPaymentSetup && (
                  <button
                    type="button"
                    onClick={() => navigate("/withdraw-request")}
                    className="h-10 whitespace-nowrap inline-flex items-center justify-center rounded-full bg-black px-3.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors shrink-0 shadow-sm"
                  >
                    Complete payments setup
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/create-lesson")}
                  className="h-10 whitespace-nowrap inline-flex items-center justify-center rounded-full bg-black px-3.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors shrink-0 shadow-sm"
                >
                  Create lesson
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/create-curriculum")}
                  className="h-10 whitespace-nowrap inline-flex items-center justify-center rounded-full bg-black px-3.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors shrink-0 shadow-sm"
                >
                  Create curriculum
                </button>
              </div>
            )}
            {showDropdown && (
              <div className="absolute left-0 right-0 z-10 mt-2 space-y-1 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg">
                {tabsToShow.map((s, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchParams({ tab: s });
                      setShowDropdown(false);
                    }}
                    className={`w-full rounded-xl px-5 py-2.5 text-left transition-colors ${
                      tab === s
                        ? "bg-primary font-semibold text-white"
                        : "text-black hover:bg-gray-100"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* {tab === "Booked" && <Booked />} */}
          {tab === "Revenue" && <Revenu />}
          {tab === "Upcoming" && <Upcoming />}
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
        </div>
      </div>
    </MainLayout>
  );
}
