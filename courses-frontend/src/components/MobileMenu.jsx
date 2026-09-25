import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Calendar, Home, MessageSquare, Search, User } from "lucide-react";
import HeaderSearchOverlay from "./HeaderSearchOverlay";

export default function MobileMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);
  const rooms = useSelector((state) => state.chat?.rooms || []);
  const chatUnreadState = useSelector((state) => state.chat?.chatUnread || 0);

  const isLoggedIn = !!userInfo;
  const chatUnread = userInfo
    ? rooms.length > 0
      ? rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0)
      : chatUnreadState
    : 0;

  // Hide mobile menu only on standalone full-screen auth pages
  const hiddenRoutes = [
    "/login",
    "/register",
    "/forget",
    "/new-password",
    "/send-message",
    "/mail-verify",
    "/verify-email",
  ];

  const shouldHide = hiddenRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  if (shouldHide) return null;

  const scheduleTab =
    userInfo?.role === "teacher" ? "Schedule" : "My Schedule";
  const schedulePath = `/profile?tab=${encodeURIComponent(scheduleTab)}`;

  const isHomeActive = location.pathname === "/" && !showSearchOverlay;
  const isSearchActive = showSearchOverlay;
  const isMessagesActive = location.pathname.startsWith("/chat");
  const isScheduleActive =
    location.pathname === "/profile" &&
    (location.search.includes("Schedule") ||
      location.search.includes("Calendar"));
  const isProfileActive =
    location.pathname === "/profile" &&
    !location.search.includes("Schedule") &&
    !location.search.includes("Calendar");

  const handleNavigateWithAuth = (targetPath) => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(targetPath)}`, {
        state: { from: targetPath },
      });
      return;
    }
    navigate(targetPath);
  };

  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      isActive: isHomeActive,
      onClick: () => {
        setShowSearchOverlay(false);
        if (location.pathname !== "/") {
          navigate("/");
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
      isActive: isSearchActive,
      onClick: () => {
        setShowSearchOverlay(true);
      },
    },
    {
      id: "messages",
      label: "Messages",
      icon: MessageSquare,
      badge: chatUnread,
      isActive: isMessagesActive,
      onClick: () => {
        setShowSearchOverlay(false);
        handleNavigateWithAuth("/chat");
      },
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: Calendar,
      isActive: isScheduleActive,
      onClick: () => {
        setShowSearchOverlay(false);
        handleNavigateWithAuth(schedulePath);
      },
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      isActive: isProfileActive,
      onClick: () => {
        setShowSearchOverlay(false);
        handleNavigateWithAuth("/profile?tab=My Profile");
      },
    },
  ];

  return (
    <>
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.isActive;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.onClick}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-150 cursor-pointer active:scale-95 select-none ${
                  active ? "text-[#FA4F2E]" : "text-gray-500 hover:text-gray-900"
                }`}
                title={tab.label}
              >
                {/* Active Top Indicator */}
                {active && (
                  <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-[#FA4F2E]" />
                )}

                <div className="relative flex items-center justify-center">
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.4 : 1.9}
                    className="transition-transform duration-150"
                  />
                  {tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#FA4F2E] text-white text-[9px] font-bold flex items-center justify-center shadow-sm pointer-events-none">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[11px] mt-1 tracking-tight leading-tight ${
                    active ? "font-semibold text-[#FA4F2E]" : "font-medium text-gray-500"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Instant Search Overlay */}
      <HeaderSearchOverlay
        open={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
      />
    </>
  );
}
