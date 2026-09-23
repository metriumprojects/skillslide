import { useState, useEffect, useRef } from "react";
import { Layers3, MessageCircle, Smartphone } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCategories } from "../../../redux/reducers/CategoryReducer";
import { IoIosArrowDown } from "react-icons/io";
import { motion } from "framer-motion";
import CurrencySelector from "../../../components/CurrencySelector";
import LogoIcon from "../../../components/LogoIcon";
import HeaderSearchBar from "../../../components/HeaderSearchBar";

export default function CategoriesBar({ categories: propCategories = [], selectedCategory, onSelectCategory, userInfo, chatUnread, handleSearchClick, handleProfileClick, showProfileMenu, setShowProfileMenu, menuRef, handleLogout, Teacherlessons, handleTeacher }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const {
    categories: reduxCategories,
    hasFetched,
    loading: categoriesLoading,
  } = useSelector((state) => state.category);

  // Use Redux categories if available, otherwise fall back to props
  const categories = Array.isArray(reduxCategories) && reduxCategories.length > 0
    ? reduxCategories
    : propCategories;

  const [showMore, setShowMore] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(5);
  const moreMenuRef = useRef(null);

  // Fetch categories once (avoid empty-array dependency loop)
  useEffect(() => {
    if (!hasFetched && !categoriesLoading) {
      dispatch(getCategories());
    }
  }, [dispatch, hasFetched, categoriesLoading]);

  useEffect(() => {
  const handleResize = () => {
    const width = window.innerWidth;

    const ITEM_WIDTH = 180; // adjust to your actual card width + gap
    const limit = Math.floor(width / ITEM_WIDTH);

    setDisplayLimit(limit - (userInfo ? 3 : 4)); // If user is logged in, reserve space for profile icon
  };

  handleResize();

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, [userInfo]);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMore(false);
      }
    };

    if (showMore) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMore]);

  const visibleCategories = categories.slice(0, displayLimit);
  const hiddenCategories = categories.slice(displayLimit);

  const handleSelect = (categoryName) => {
    // If already on home page, use callback for instant update
    if (location.pathname === "/") {
      if (onSelectCategory) {
        onSelectCategory(categoryName);
      }
    } else {
      // If on other pages, navigate to home with category in query
      navigate(`/?category=${encodeURIComponent(categoryName)}`);
    }
  };

  const navButtonClass = (path, { exact = true, search = "" } = {}) => {
    const pathMatches = exact ? location.pathname === path : location.pathname.startsWith(path);
    const searchMatches = search ? location.search === search : location.search === "";
    const isActive = pathMatches && searchMatches;
    return `h-11.5 px-5 rounded-full text-sm font-semibold uppercase flex items-center gap-2 transition-colors ${
      isActive ? "bg-primary text-white" : "bg-transparent text-black hover:bg-gray-100"
    }`;
  };

  const messageButtonClass = (path) => {
    const isActive = location.pathname === path;
    return `relative cursor-pointer border-[1.5px] px-4 font-medium rounded-full text-sm flex items-center justify-center gap-2 h-11.5 shrink-0 transition-colors ${
      isActive ? "border-primary bg-primary text-white" : "border-black bg-white text-black hover:bg-gray-50"
    }`;
  };

  const menuLinkClass = (path, searchTab = "") => {
    const currentTab = new URLSearchParams(location.search).get("tab");
    const isActive = searchTab
      ? (location.pathname === path && currentTab === searchTab)
      : (location.pathname === path && !currentTab);
    return `w-full px-4 py-2 text-left flex items-center gap-2 text-sm transition-colors hover:bg-gray-50 ${
      isActive ? "font-bold text-black" : "text-black"
    }`;
  };

  return (
    <div className="w-full hidden lg:block">
      {/* Top Row: Logo */}
      <div className="flex w-full items-center justify-between">
        <Link to="/" className="flex shrink-0 items-center gap-3 select-none" aria-label="SkillSlide home">
          {/* S Orange Icon Badge - Official SVG */}
          <LogoIcon className="h-[46px] w-[46px]" />

          {/* Skill (italic) + Slide (simple) + Learn anything, from anywhere */}
          <div
            style={{ fontFamily: "'DM Sans', sans-serif" }}
            className="flex flex-col tracking-tight leading-none"
          >
            <span className="text-2xl sm:text-[26px] font-black text-[#FA4F2E] leading-none">
              <span className="italic">Skill</span>
              <span className="not-italic">Slide</span>
            </span>
            <span className="text-[16px] sm:text-[18px] font-bold italic tracking-wide text-[#1A2B49] leading-none mt-1 whitespace-nowrap">
              Learn anything, from anywhere
            </span>
          </div>
        </Link>
      </div>

      {/* Row 2: Search Bar, USD, Messages, and Profile Icon (All Left-Aligned) */}
      <div className="flex w-full items-center justify-start gap-2.5 xl:gap-3.5 mt-6">
        {/* 1. Search Bar (Search, Location, Lesson type, Price Range) */}
        <HeaderSearchBar />

        {/* 2. USD (on the right side of Price Range) */}
        <CurrencySelector className="shrink-0" buttonClassName="h-11.5" />

        {userInfo ? (
          <>
            {/* 3. Messages (on the right side of USD) */}
            <Link to={`/chat`} className={messageButtonClass("/chat")}>
              <MessageCircle strokeWidth={1.8} size={18} />
              <span>Messages</span>
              {chatUnread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {chatUnread > 99 ? "99+" : chatUnread}
                </span>
              )}
            </Link>

            {/* 4. Profile Icon (on the right side of Messages) */}
            <div className="relative flex items-center" ref={menuRef}>
              <button
                onClick={handleProfileClick}
                className="rounded-full focus:outline-none flex items-center justify-center"
                aria-label="Open profile menu"
                type="button"
              >
                <img loading="lazy" decoding="async" src={userInfo?.image?.url || 'https://i.ibb.co/tpV3m2GW/no-image.png'} className="h-11.5 w-11.5 rounded-full object-cover border-[1.5px] border-gray-200" alt="profile" />
              </button>
              {showProfileMenu && (
                <motion.div initial={{ opacity: 0, y: -10, scale: 1 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -40, scale: 0.95 }}
                            transition={{ duration: 0.35, ease: "easeOut" }} className="absolute top-14 left-0 mt-2 w-48 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] z-50 overflow-hidden">
                  <Link
                    to="/profile?tab=My Profile"
                    className={menuLinkClass("/profile", "My Profile")}
                    onClick={() => setShowProfileMenu?.(false)}
                  >
                    My Profile
                  </Link>
                  {userInfo?.role === "user" && (
                    <button onClick={() => { handleTeacher("teacher"); setShowProfileMenu?.(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                      {Teacherlessons.length > 0 ? "Teacher profile" : "Become a Teacher"}
                    </button>
                  )}
                  {userInfo?.role === "teacher" && (
                    <button onClick={() => { handleTeacher("user"); setShowProfileMenu?.(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                      Student profile
                    </button>
                  )}
                  <Link
                    to="/"
                    className={menuLinkClass("/")}
                    onClick={() => setShowProfileMenu?.(false)}
                  >
                    Discover
                  </Link>
                  <Link
                    to="/teach"
                    className={menuLinkClass("/teach")}
                    onClick={() => setShowProfileMenu?.(false)}
                  >
                  {userInfo?.role === "teacher" ? "Student Requests" : "Requests"}
                  </Link>
                  <Link
                    to="/profile?tab=My Schedule"
                    className={menuLinkClass("/profile", "My Schedule")}
                    onClick={() => setShowProfileMenu?.(false)}
                  >
                    My Schedule
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setShowProfileMenu?.(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-[#1A2B49] text-sm"
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </div>
          </>
        ) : (
          <div className="flex shrink-0 items-center gap-2.5 xl:gap-3.5">
            <Link
              to="/login"
              className="flex h-11.5 items-center rounded-full border-[1.5px] border-black bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-gray-50"
            >
              Log in
            </Link>
            <Link
              to={`/register`}
              className="flex h-11.5 items-center rounded-full bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              Create an account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
