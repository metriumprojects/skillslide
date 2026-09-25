import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { becomeTeacher, getUser, LogoutUser } from "../redux/reducers/AuthReducer";
import { toast } from "react-toastify";
import {
  fetchChatConnections,
  resetChatState,
} from "../redux/reducers/ChatReducer";
import CreateRequestPopup from "../Pages/Home/Components/CreateRequestPopup";
import { getTeacherLessons } from "../redux/reducers/LessonReducer";
import CategoriesBar from "../Pages/Home/Components/Categories";
import HeaderSearchOverlay from "./HeaderSearchOverlay";

const Header = ({ 
  categories = [], 
  selectedCategory = "", 
  onSelectCategory = null,
  onSearchToggle = null,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useSelector((state) => state.auth);
  const { Teacherlessons } = useSelector((state) => state.lesson);
  const { rooms } = useSelector((state) => state.chat);
  const dispatch = useDispatch();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    dispatch(getUser());
    dispatch(getTeacherLessons({ page: 1, limit: 8 }));
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(LogoutUser()).then(() => {
      dispatch(resetChatState());
      navigate("/login");
    });
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !event.target.closest?.(".profile-dropdown-portal")
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

useEffect(() => {
  if (!userInfo?._id) return;

  const fetchConnections = () => {
    dispatch(fetchChatConnections());
  };

  // Initial fetch
  fetchConnections();

  // Poll every 15 seconds
  // const intervalId = setInterval(fetchConnections, 15000);

  // Fetch on window focus
  const handleFocus = () => fetchConnections();
  window.addEventListener("focus", handleFocus);

  return () => {
    // clearInterval(intervalId);
    window.removeEventListener("focus", handleFocus);
  };
}, [dispatch, userInfo?._id]);


  const chatUnread = userInfo
    ? rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0)
    : 0;

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
            dispatch(getUser());
            navigate(role === "teacher" ? "/profile?tab=Revenue" : "/profile?tab=My Schedule");
          } else if (res.payload?.needsSellerSetup) {
            navigate("/create-teacher-profile");
          } else {
            toast.error(res.payload?.message || "Unable to switch role");
          }
        });
      };

  const handleSearchClick = () => {
    if (location.pathname === "/") {
      if (onSearchToggle) {
        onSearchToggle();
      }
      return;
    }

    setShowHeaderSearch(true);
  };

  return (
    <header className="relative mx-auto w-full px-3 md:px-10 pt-[20px] sm:pt-[32px]">
      <CategoriesBar 
        categories={categories} 
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        userInfo={userInfo}
        chatUnread={chatUnread}
        handleSearchClick={handleSearchClick}
        handleProfileClick={handleProfileClick}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        menuRef={menuRef}
        handleLogout={handleLogout}
        Teacherlessons={Teacherlessons}
        handleTeacher={handleTeacher}
      />

      <CreateRequestPopup
        open={showCreateRequest}
        onClose={() => setShowCreateRequest(false)}
      />
      <HeaderSearchOverlay
        open={showHeaderSearch}
        onClose={() => setShowHeaderSearch(false)}
      />
    </header>
  );
};

export default Header;
