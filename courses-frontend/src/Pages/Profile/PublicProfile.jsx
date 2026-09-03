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
import { startChat } from "../../redux/reducers/ChatReducer";
import { getTeacherLessons, getTeacherLessonsById } from "../../redux/reducers/LessonReducer";
import Card from "../Home/Components/Card";
import { getUserFavorites } from "../../redux/reducers/FavoriteReducer";
import CurriculumCard from "../Home/Components/CurriculumCard";
import { getAllCurriculumsByTecherId } from "../../redux/reducers/CurriculumReducer";
import PublicFvrt from "./components/PublicFvrt";
import PublicUpcoming from "./components/PublicUpcoming";

export default function PublicProfile() {
  const { userbyid, userInfo } = useSelector((state) => state.auth);
  const { startChatLoading } = useSelector((state) => state.chat);
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
  const isTeacher = (role === 'teacher');

  // Set default tab based on role param or userbyid
  const [tab, setTab] = useState(isTeacher ? "Lesson" : "Upcoming");

  // Define states based on role
  const studentStates = ["Upcoming", "Bookmarks"];
  const teacherStates = ["Lesson", "Curriculum"];
  const states = isTeacher ? teacherStates : studentStates;

  useEffect(() => {
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

  const handleStartChat = async () => {
    if (!userInfo?._id) {
      toast.info("Please log in to send a message.");
      navigate("/login");
      return;
    }

    if (userInfo?._id === id) {
      toast.info("This is your profile.");
      return;
    }

    try {
      const data = await dispatch(startChat({ targetUserId: id })).unwrap();
      const roomId = data?.room?._id;

      if (!roomId) {
        toast.error("Could not start the chat. Please try again.");
        return;
      }

      toast.success("Chat ready.");
      navigate(`/chat/${roomId}`);
    } catch (error) {
      const message =
        typeof error === "string" ? error : "Failed to start chat.";
      toast.error(message);
    }
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
      <MainLayout>
        <div className="min-h-screen w-full flex flex-col items-center py-12">
          {/* Profile Section */}
          <div className="flex flex-col items-center text-center">
            {/* Name */}
            <h1 className="text-2xl mb-4">{userbyid?.name}</h1>
            {/* Image */}
            <div className="w-48 h-48 rounded-2xl overflow-hidden mb-4 shadow-md">
              <img
                src={
                  userbyid?.image?.url ||
                  "https://i.ibb.co/tpV3m2GW/no-image.png"
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Stats */}
            <div className="flex flex-col md:flex-row items-center gap-3 text-gray-900 mb-4">
              {userbyid?.averageRating > 0 && (
                          <div className="flex items-center gap-1">
                {userbyid?.averageRating > 60 ? (
                  <Smile className="text-black" size={20} />
                ) : (
                  <Frown className="text-black" size={20} />
                )}
                <span>{userbyid?.averageRating}%</span>
              </div>
              )}
              {!userbyid?.hideLesson && (
                <span>
                  <span className="font-semibold">{userbyid?.classesAttended || 0}</span> Classes Attended
                </span>
              )}
              {!userbyid?.classHosted && (
                <span>
                  <span className="font-semibold">{userbyid?.classesHost || 0}</span> Classes Hosted
                </span>
              )}
            </div>

            {/* <div className="flex items-center justify-center gap-4 text-2xl text-gray-600 mb-4">
              {userbyid?.instagram && (
              <Link to={userbyid?.instagram} target="blank">
                <FaInstagram />
              </Link>
              )}
              {userbyid?.youtube && (
              <Link to={userbyid?.youtube} target="blank">
                <SlSocialYoutube />
              </Link>
              )}
            </div> */}

            {/* Bio */}
            <p className="text-gray-700 text-sm max-w-md mb-4">{userbyid?.bio}</p>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 bg-[#F5F5F5] flex items-center gap-2 disabled:opacity-60"
                onClick={handleStartChat}
                disabled={startChatLoading}
              >
                {startChatLoading ? "Starting..." : "Send Me a Message"}{" "}
                <BsSend className="h-4 w-4" />
              </button>
            </div>

            {/* Private Account Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-4">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-lg font-semibold text-yellow-800">Private Account</h3>
              </div>
              <p className="text-yellow-700">
                This account is private. The user's content and activities are not publicly visible.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen w-full flex flex-col items-center py-12">
        {/* Profile Section */}
        <div className="flex flex-col items-center text-center">
          {/* Name */}
          <h1 className="text-2xl mb-4">{userbyid?.name || "Unknown"}</h1>
          {/* Image */}
          <div className="w-48 h-48 rounded-2xl overflow-hidden mb-4 shadow-md">
            <img
              src={
                userbyid?.image?.url ||
                "https://i.ibb.co/tpV3m2GW/no-image.png"
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-gray-900 mb-4">
                         <div className="flex items-center gap-1">
                {userbyid?.averageRating > 60 ? (
                  <Smile className="text-black" size={20} />
                ) : (
                  <Frown className="text-black" size={20} />
                )}
                <span>{userbyid?.averageRating}%</span>
              </div>
            {!userbyid?.hideLesson && (
              <span>
                <span className="font-semibold">{userbyid?.classesAttended || 0}</span> Classes Attended
              </span>
            )}
            {!userbyid?.classHosted && (
              <span>
                <span className="font-semibold">{userbyid?.classesHosted || 0}</span> Classes Hosted
              </span>
            )}
          </div>

          {/* <div className="flex items-center justify-center gap-4 text-2xl text-gray-600 mb-4">
            <Link to={userbyid?.instagram} target="blank">
              <FaInstagram />
            </Link>
            <Link to={userbyid?.youtube} target="blank">
              <SlSocialYoutube />
            </Link>
          </div> */}

          {/* Bio */}
          <p className="text-gray-700 text-sm max-w-md mb-4">{userbyid?.bio}</p>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              className="px-4 py-2 rounded-md border border-gray-300 bg-[#F5F5F5] flex items-center gap-2 disabled:opacity-60"
              onClick={handleStartChat}
              disabled={startChatLoading}
            >
              {startChatLoading ? "Starting..." : "Send Me a Message"}{" "}
              <BsSend className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom Tabs Section - Only show if account is public or is teacher */}
        {(userbyid?.publicType !== false || isTeacher) && (
          <div className="w-full pt-6">
            <div className="flex gap-6 justify-left text-gray-700 font-medium mb-4">
              {states.map((s, index) => (
                <button
                  onClick={() => handleTabChange(s)}
                  key={index}
                  className={`pb-1 ${
                    tab === s
                      ? "border-b-3 border-primary text-black"
                      : "hover:border-b-2 hover:border-gray-300 text-gray-500"
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