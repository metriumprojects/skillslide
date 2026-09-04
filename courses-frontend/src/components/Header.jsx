import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  MessageCircle,
  LayoutGrid,
  Square,
  Plus,
  MoveRight,
  Search,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import CurrencySelector from "./CurrencySelector";
import HeaderSearchOverlay from "./HeaderSearchOverlay";
import LogoIcon from "./LogoIcon";

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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const menuRef = useRef(null);

  // Function to check if link is active
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const mobileMenuLinkClass = (path) =>
    `px-4 py-2 rounded-full transition-colors ${
      isActiveLink(path) ? "border border-white bg-[#008CFF] text-white" : "hover:text-[#1dbf73]"
    }`;

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
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
        setShowMobileMenu(false);
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
            navigate(role === "teacher" ? "/teacher-created" : "/profile");
          } else if (res.payload?.needsSellerSetup) {
            navigate("/create-teacher-profile");
          } else {
            toast.error(res.payload?.message || "Unable to switch role");
          }
        });
      };

  const handleSearchClick = () => {
    setShowMobileMenu(false);

    if (location.pathname === "/") {
      if (onSearchToggle) {
        onSearchToggle();
      }
      return;
    }

    setShowHeaderSearch(true);
  };
  

  return (
    <header className="relative mx-auto flex items-center justify-between gap-4 px-3 md:px-10 pt-5">
      {/* Left Section - Logo */}
      <Link
        to="/"
        className="flex lg:hidden shrink-0 items-center gap-2 select-none"
        aria-label="SkillSlide home"
      >
        <LogoIcon className="h-[40px] w-[40px]" />
        <span className="font-['Roboto'] text-xl font-black tracking-tight text-[#FA4602] leading-none">
          <span className="italic">Skill</span>
          <span className="not-italic">Slide</span>
        </span>
      </Link>

      {/* Center Section - Categories */}
      <div className="flex justify-center w-full">
        <CategoriesBar 
          categories={categories} 
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          userInfo={userInfo}
          chatUnread={chatUnread}
          handleSearchClick={handleSearchClick}
          handleProfileClick={handleProfileClick}
          showProfileMenu={showProfileMenu}
          menuRef={menuRef}
          handleLogout={handleLogout}
          Teacherlessons={Teacherlessons}
          handleTeacher={handleTeacher}
        />
      </div>

      {/* Right Section - Auth/Profile */}
      <div className="flex lg:hidden justify-end items-center gap-4 shrink-0">

        {/* Mobile View */}
        <div className="lg:hidden flex items-center gap-3">
          <CurrencySelector className="w-[88px]" hideIcon />
          <button
            onClick={handleSearchClick}
            className="focus:outline-none p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Search"
          >
            <Search className="w-5 h-5 text-gray-800" />
          </button>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="focus:outline-none"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6 text-gray-800" />
            ) : (
              <Menu className="w-6 h-6 text-gray-800" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {showMobileMenu && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 w-full bg-white flex flex-col items-center py-6 space-y-6 text-lg font-medium shadow-md z-50 lg:hidden"
        >
          {userInfo ? (
            <>
              <Link
                to="/profile"
                className={mobileMenuLinkClass("/profile")}
                onClick={() => setShowMobileMenu(false)}
              >
                View Profile
              </Link>
              {userInfo?.role === "user" && (
                <button
                  onClick={() => { handleTeacher("teacher"); setShowMobileMenu(false); }}
                  className="px-4 py-2 rounded-full hover:text-[#1dbf73] transition-colors"
                >
                  {Teacherlessons.length > 0 ? "Teacher profile" : "Become a Teacher"}
                </button>
              )}
              {userInfo?.role === "teacher" && (
                <button
                  onClick={() => { handleTeacher("user"); setShowMobileMenu(false); }}
                  className="px-4 py-2 rounded-full hover:text-[#1dbf73] transition-colors"
                >
                  Student profile
                </button>
              )}
              <Link
                to="/"
                className={mobileMenuLinkClass("/")}
                onClick={() => setShowMobileMenu(false)}
              >
                Discover
              </Link>
              <Link
                to="/teach"
                className={mobileMenuLinkClass("/teach")}
                onClick={() => setShowMobileMenu(false)}
              >
                {userInfo?.role === "teacher" ? "Student Requests" : "Requests"}
              </Link>
              <Link
                to="/profile"
                className={mobileMenuLinkClass("/profile")}
                onClick={() => setShowMobileMenu(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                className="text-red-500"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className={mobileMenuLinkClass("/register")}
                onClick={() => setShowMobileMenu(false)}
              >
                Create an account
              </Link>
              <Link
                to="/login"
                className={mobileMenuLinkClass("/login")}
                onClick={() => setShowMobileMenu(false)}
              >
                Login
              </Link>
            </>
          )}
        </div>
      )}

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
