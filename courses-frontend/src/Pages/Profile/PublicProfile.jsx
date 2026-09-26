import React, { useEffect, useState } from "react";
import { Star, Edit3, Smile, Frown } from "lucide-react";
import { FaInstagram, FaStar } from "react-icons/fa";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";

import MainLayout from "../../components/MainLayout";
import Upcoming from "./components/Upcoming";
import { BsSend } from "react-icons/bs";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUserById } from "../../redux/reducers/AuthReducer";
import { SlSocialYoutube } from "react-icons/sl";
import { getTeacherLessons, getTeacherLessonsById } from "../../redux/reducers/LessonReducer";
import Card from "../Home/Components/Card";
import { getUserFavorites } from "../../redux/reducers/FavoriteReducer";
import CurriculumCard from "../Home/Components/CurriculumCard";
import { getAllCurriculumsByTecherId } from "../../redux/reducers/CurriculumReducer";
import PublicFvrt from "./components/PublicFvrt";
import PublicUpcoming from "./components/PublicUpcoming";
import UserAvatarPlaceholder from "../../components/UserAvatarPlaceholder";
import { navigateToChat } from "../../utils/chatNavigation";
import { preloadRoute } from "../../utils/routePreloader";

export default function PublicProfile() {
  const { userbyid, userInfo } = useSelector((state) => state.auth);
  const { rooms } = useSelector((state) => state.chat);
  const { Teacheridlessons } = useSelector((state) => state.lesson);
  const { favorites } = useSelector((state) => state.favorite);
  const { curriculums } = useSelector((state) => state.curriculum);
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // State for pagination
  const [lessonLimit, setLessonLimit] = useState(8);
  const [curriculumLimit, setCurriculumLimit] = useState(8);
  const [hasMoreLessons, setHasMoreLessons] = useState(true);
  const [hasMoreCurriculums, setHasMoreCurriculums] = useState(true);

  // Get role from params, query string, or fetched userbyid
  const { role: paramRole } = useParams();
  const query = new URLSearchParams(location.search);
  const role = paramRole || query.get('role');
  const isTeacher = (role === 'teacher' || userbyid?.role === 'teacher');

  // Set default tab based on role param or userbyid
  const [tab, setTab] = useState(isTeacher ? "Lesson" : "Upcoming");
  const [imageError, setImageError] = useState(false);

  // Define states based on role
  const studentStates = ["Upcoming", "Bookmarks"];
  const teacherStates = ["Lesson", "Curriculum"];
  const states = isTeacher ? teacherStates : studentStates;

  useEffect(() => {
    setImageError(false);
    dispatch(getUserById(id));
    dispatch(getUserFavorites());
    // Set default tab based on role param or userbyid
    if (isTeacher) {
      setTab("Lesson");
    }
  }, [dispatch, id, isTeacher]);

  // Load data based on current tab and limits
  useEffect(() => {
    if (isTeacher) {
      if (tab === "Lesson") {
        dispatch(getTeacherLessonsById({ id, page: 1, limit: lessonLimit }));
        // Check if there are more lessons to load
        setHasMoreLessons(Teacheridlessons.length === lessonLimit);
      } else if (tab === "Curriculum") {
        dispatch(getAllCurriculumsByTecherId({ id, page: 1, limit: curriculumLimit }));
        // Check if there are more curriculums to load
        setHasMoreCurriculums(curriculums.length === curriculumLimit);
      }
    }
  }, [dispatch, id, tab, lessonLimit, curriculumLimit, isTeacher]);

  const handleStartChat = () => {
    navigateToChat({
      navigate,
      targetUserId: id,
      userInfo,
      rooms,
    });
  };

  const handleLoadMore = () => {
    if (tab === "Lesson") {
      setLessonLimit(prev => prev + 8);
    } else if (tab === "Curriculum") {
      setCurriculumLimit(prev => prev + 8);
    }
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    // Reset limits when changing tabs
    if (newTab === "Lesson") {
      setLessonLimit(8);
    } else if (newTab === "Curriculum") {
      setCurriculumLimit(8);
    }
  };

  // If role is not teacher and account is private, don't show tabs
  if (!isTeacher && userbyid?.publicType === false) {
    return (
      <MainLayout width="100%">
        <div className="min-h-screen w-full pt-[32px] pb-10">
          {/* Profile Section - Left Aligned */}
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 pb-6 sm:pb-8">
            {/* Image */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-3xl overflow-hidden bg-white border-[1.5px] border-[#1A2B49] shrink-0">
              {userbyid?.image?.url && userbyid?.image?.url !== "https://i.ibb.co/tpV3m2GW/no-image.png" && !imageError ? (
                <img
                  src={userbyid.image.url}
                  alt={userbyid?.name || "Profile"}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white p-8 sm:p-10">
                  <UserAvatarPlaceholder className="w-full h-full text-[#1A2B49]" />
                </div>
              )}
            </div>

            {/* Info Column (Centered with Image) */}
            <div className="flex-1 min-w-0 flex flex-col items-start justify-center text-left">
              {/* Name */}
              <h1 className="text-[20px] sm:text-[24px] font-normal text-black tracking-tight leading-snug">
                {userbyid?.name || "Unknown"}
              </h1>

              {/* Description / Bio */}
              {userbyid?.bio && (
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl mt-1.5 whitespace-pre-line">
                  {userbyid.bio}
                </p>
              )}

              {/* Stats & Actions */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-4">
                {/* Verified Teacher Pill */}
                {isTeacher && (
                  <span className="inline-flex items-center gap-2 bg-[#E9EAEE] text-black px-3.5 py-2 rounded-full text-xs sm:text-sm font-normal shadow-none shrink-0">
                    <svg width="15" height="15" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 overflow-visible text-black">
                      <path d="M12 23C14.4477 23 16.3465 22.8672 17.8271 22.5381C19.2964 22.2115 20.2925 21.7056 20.999 20.999C21.7056 20.2925 22.2115 19.2964 22.5381 17.8271C22.8672 16.3465 23 14.4477 23 12C23 9.55232 22.8672 7.65353 22.5381 6.17285C22.2115 4.70364 21.7056 3.70752 20.999 3.00098C20.2925 2.29443 19.2964 1.78846 17.8271 1.46191C16.3465 1.13284 14.4477 1 12 1C9.55232 1 7.65353 1.13284 6.17285 1.46191C4.70364 1.78846 3.70752 2.29443 3.00098 3.00098C2.29443 3.70752 1.78846 4.70364 1.46191 6.17285C1.13284 7.65353 1 9.55232 1 12C1 14.4477 1.13284 16.3465 1.46191 17.8271C1.78846 19.2964 2.29443 20.2925 3.00098 20.999C3.70752 21.7056 4.70364 22.2115 6.17285 22.5381C7.65353 22.8672 9.55232 23 12 23Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Verified teacher</span>
                  </span>
                )}

                {/* Rating / Review Thing (Outline star) */}
                <span className="inline-flex items-center gap-2 bg-[#E9EAEE] text-black px-3.5 py-2 rounded-full text-xs sm:text-sm font-normal shadow-none shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-black">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>{userbyid?.averageRating ? `${userbyid.averageRating}% Rating` : "100% Rating"}</span>
                </span>

                {/* Classes Attended */}
                {!userbyid?.hideLesson && (
                  <span className="inline-flex items-center gap-2 bg-[#E9EAEE] text-black px-3.5 py-2 rounded-full text-xs sm:text-sm font-normal shadow-none shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-black">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                      <path d="M6 6h10"/>
                      <path d="M6 10h10"/>
                    </svg>
                    <span>{userbyid?.classesAttended || 0} Classes attended</span>
                  </span>
                )}

                {/* Classes Hosted (Not bold) */}
                {!userbyid?.classHosted && (
                  <span className="inline-flex items-center gap-2 bg-[#E9EAEE] text-black px-3.5 py-2 rounded-full text-xs sm:text-sm font-normal shadow-none shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-black">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>{userbyid?.classesHosted ?? userbyid?.classesHost ?? 0} Classes hosted</span>
                  </span>
                )}

                {/* Send Message or Edit Profile Button */}
                {userInfo?._id && userInfo?._id === userbyid?._id ? (
                  <button
                    type="button"
                    onClick={() => navigate("/edit-profile")}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-sm cursor-pointer shrink-0"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0 text-white"
                    >
                      <path
                        d="M10.1231 3.90909L7.77394 1.44573C7.23416 0.879704 6.32721 0.848608 5.7482 1.37627L1.45595 5.28789C0.876942 5.81556 0.845133 6.70216 1.3849 7.26819L3.90909 9.91514M10.1231 3.90909L16.6151 10.7169C16.8849 10.9998 17.0231 11.3792 16.9968 11.7651L16.7302 15.6917C16.6801 16.4299 16.0515 17.0028 15.2946 17L11.269 16.985C10.8733 16.9836 10.4959 16.8223 10.226 16.5393L3.90909 9.91514M10.1231 3.90909L3.90909 9.91514"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Edit profile</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartChat}
                    onMouseEnter={() => preloadRoute("chat")}
                    onTouchStart={() => preloadRoute("chat")}
                    className="inline-flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-sm cursor-pointer shrink-0"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>Send message</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Private Account Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mt-8 max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-base font-semibold text-yellow-900">Private Account</h3>
            </div>
            <p className="text-sm text-yellow-800">
              This account is private. The user's content and activities are not publicly visible.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout width="100%">
      <div className="min-h-screen w-full pt-[32px] pb-10">
        {/* Profile Section - Left Aligned */}
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
          {/* Image */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-3xl overflow-hidden bg-white border-[1.5px] border-[#1A2B49] shrink-0">
            {userbyid?.image?.url && userbyid?.image?.url !== "https://i.ibb.co/tpV3m2GW/no-image.png" && !imageError ? (
              <img
                src={userbyid.image.url}
                alt={userbyid?.name || "Profile"}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white p-8 sm:p-10">
                <UserAvatarPlaceholder className="w-full h-full text-[#1A2B49]" />
              </div>
            )}
          </div>

          {/* Info Column (Centered with Image) */}
          <div className="flex-1 min-w-0 flex flex-col items-start justify-center text-left">
            {/* Name */}
            <h1 className="text-[20px] sm:text-[24px] font-normal text-black tracking-tight leading-snug">
              {userbyid?.name || "Unknown"}
            </h1>

            {/* Description / Bio */}
            {userbyid?.bio && (
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl mt-1.5 whitespace-pre-line">
                {userbyid.bio}
              </p>
            )}

            {/* Stats & Actions */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-4">
              {/* Verified Teacher Pill */}
              {isTeacher && (
                <span className="inline-flex items-center gap-2 bg-[#E9EAEE] text-black px-3.5 py-2 rounded-full text-xs sm:text-sm font-normal shadow-none shrink-0">
                  <svg width="15" height="15" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 overflow-visible text-black">
                    <path d="M12 23C14.4477 23 16.3465 22.8672 17.8271 22.5381C19.2964 22.2115 20.2925 21.7056 20.999 20.999C21.7056 20.2925 22.2115 19.2964 22.5381 17.8271C22.8672 16.3465 23 14.4477 23 12C23 9.55232 22.8672 7.65353 22.5381 6.17285C22.2115 4.70364 21.7056 3.70752 20.999 3.00098C20.2925 2.29443 19.2964 1.78846 17.8271 1.46191C16.3465 1.13284 14.4477 1 12 1C9.55232 1 7.65353 1.13284 6.17285 1.46191C4.70364 1.78846 3.70752 2.29443 3.00098 3.00098C2.29443 3.70752 1.78846 4.70364 1.46191 6.17285C1.13284 7.65353 1 9.55232 1 12C1 14.4477 1.13284 16.3465 1.46191 17.8271C1.78846 19.2964 2.29443 20.2925 3.00098 20.999C3.70752 21.7056 4.70364 22.2115 6.17285 22.5381C7.65353 22.8672 9.55232 23 12 23Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Verified teacher</span>
                </span>
              )}

              {/* Rating / Review Thing (Outline star) */}
              <span className="inline-flex items-center gap-2 bg-[#E9EAEE] text-black px-3.5 py-2 rounded-full text-xs sm:text-sm font-normal shadow-none shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-black">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{userbyid?.averageRating ? `${userbyid.averageRating}% Rating` : "100% Rating"}</span>
              </span>

              {/* Classes Attended */}
              {!userbyid?.hideLesson && (
                <span className="inline-flex items-center gap-2 bg-[#E9EAEE] text-black px-3.5 py-2 rounded-full text-xs sm:text-sm font-normal shadow-none shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-black">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                    <path d="M6 6h10"/>
                    <path d="M6 10h10"/>
                  </svg>
                  <span>{userbyid?.classesAttended || 0} Classes attended</span>
                </span>
              )}

              {/* Classes Hosted (Not bold) */}
              {!userbyid?.classHosted && (
                <span className="inline-flex items-center gap-2 bg-[#E9EAEE] text-black px-3.5 py-2 rounded-full text-xs sm:text-sm font-normal shadow-none shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-black">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>{userbyid?.classesHosted ?? userbyid?.classesHost ?? 0} Classes hosted</span>
                </span>
              )}

              {/* Send Message or Edit Profile Button */}
              {userInfo?._id && userInfo?._id === userbyid?._id ? (
                <button
                  type="button"
                  onClick={() => navigate("/edit-profile")}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-sm cursor-pointer shrink-0"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0 text-white"
                  >
                    <path
                      d="M10.1231 3.90909L7.77394 1.44573C7.23416 0.879704 6.32721 0.848608 5.7482 1.37627L1.45595 5.28789C0.876942 5.81556 0.845133 6.70216 1.3849 7.26819L3.90909 9.91514M10.1231 3.90909L16.6151 10.7169C16.8849 10.9998 17.0231 11.3792 16.9968 11.7651L16.7302 15.6917C16.6801 16.4299 16.0515 17.0028 15.2946 17L11.269 16.985C10.8733 16.9836 10.4959 16.8223 10.226 16.5393L3.90909 9.91514M10.1231 3.90909L3.90909 9.91514"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Edit profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartChat}
                  onMouseEnter={() => preloadRoute("chat")}
                  onTouchStart={() => preloadRoute("chat")}
                  className="inline-flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-sm cursor-pointer shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Send message</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Tabs Section - Only show if account is public or is teacher */}
        {(userbyid?.publicType !== false || isTeacher) && (
          <div className="w-full pt-8">
            <div className="flex gap-6 justify-start text-sm sm:text-base font-medium mb-6">
              {states.map((s, index) => (
                <button
                  onClick={() => handleTabChange(s)}
                  key={index}
                  className={`pb-3 transition-colors cursor-pointer ${
                    tab === s
                      ? "border-b-2 border-black text-black font-semibold"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {tab === "Upcoming" && <PublicUpcoming id={id} />}

            {tab === "Bookmarks" && (
              <div className="bg-white rounded-2xl py-5">
         <PublicFvrt id={id} />
              </div>
            )}

            {tab === "Lesson" && isTeacher && (
              <div className="bg-white rounded-2xl py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Teacheridlessons.map((course, index) => (
                    <Card key={index} course={course} favorites={favorites} />
                  ))}
                </div>
                
                {/* Load More Button for Lessons */}
                {hasMoreLessons && Teacheridlessons.length > 0 && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                      Load More Lessons
                    </button>
                  </div>
                )}
                
                {Teacheridlessons.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No lessons found for this teacher.
                  </div>
                )}
              </div>
            )}
            
            {tab === "Curriculum" && isTeacher && (
              <div className="bg-white rounded-2xl py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {curriculums.map((course, index) => (
                    <CurriculumCard
                      key={index}
                      course={course}
                      favorites={favorites}
                    />
                  ))}
                </div>
                
                {/* Load More Button for Curriculums */}
                {hasMoreCurriculums && curriculums.length > 0 && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                      Load More Curriculums
                    </button>
                  </div>
                )}
                
                {curriculums.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No curriculums found for this teacher.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}