import React, { useState, useMemo, useEffect, useRef } from "react";
import moment from "moment-timezone";
import { HiDotsHorizontal } from "react-icons/hi";
import { FaRegClock, FaChevronDown } from "react-icons/fa";
import ButtonSpinner from "../../../components/ButtonSpinner";
import { preloadRoute } from "../../../utils/routePreloader";
import { MobileScheduleSkeleton } from "../../../components/ProfileTabSkeletons";

/**
 * Responsive stacked card view for mobile (<768px)
 * Displays grouped schedule cards with expandable title, primary action,
 * and 44x44px touch-accessible overflow menu.
 */
export default function ScheduleMobileView({
  lessons = [],
  isLoading = false,
  activeTab = "upcoming", // "upcoming" | "past"
  formatPrice,
  getTimeDisplay,
  handleMessageTeacher,
  handleCancel,
  cancellingId,
  openingManageId,
  onManageLesson,
  handleReview,
  emptyTitle = "No lessons scheduled",
  emptySubtitle = "When you book a lesson or curriculum, it will appear here.",
}) {
  // Track expanded card IDs for 2-line title toggle
  const [expandedCards, setExpandedCards] = useState({});
  // Track active overflow menu ID
  const [activeMenuId, setActiveMenuId] = useState(null);

  const menuContainerRef = useRef(null);

  // Close overflow menu on outside click or escape
  useEffect(() => {
    if (!activeMenuId) return;

    const handleClickOutside = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMenuId]);

  // Group lessons by scheduled date for clear mobile sections
  const groupedLessons = useMemo(() => {
    if (!Array.isArray(lessons) || lessons.length === 0) return [];

    const map = new Map();
    const groups = [];

    lessons.forEach((lesson) => {
      let dateKey = "unscheduled";
      let label = "Unscheduled";

      if (lesson.scheduledAt) {
        try {
          const localMoment = moment.utc(lesson.scheduledAt).local();
          dateKey = localMoment.format("YYYY-MM-DD");

          const now = moment();
          const isToday = localMoment.isSame(now, "day");
          const isTomorrow = localMoment.isSame(now.clone().add(1, "day"), "day");
          const isYesterday = localMoment.isSame(now.clone().subtract(1, "day"), "day");

          if (isToday) {
            label = `Today · ${localMoment.format("MMM D, YYYY")}`;
          } else if (isTomorrow) {
            label = `Tomorrow · ${localMoment.format("MMM D, YYYY")}`;
          } else if (isYesterday) {
            label = `Yesterday · ${localMoment.format("MMM D, YYYY")}`;
          } else {
            label = localMoment.format("dddd, MMM D, YYYY");
          }
        } catch {
          dateKey = "invalid";
          label = "Scheduled Date";
        }
      }

      if (!map.has(dateKey)) {
        const newGroup = { dateKey, label, items: [] };
        map.set(dateKey, newGroup);
        groups.push(newGroup);
      }
      map.get(dateKey).items.push(lesson);
    });

    return groups;
  }, [lessons]);

  const toggleExpand = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setActiveMenuId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return <MobileScheduleSkeleton count={3} />;
  }

  if (!lessons || lessons.length === 0) {
    return (
      <div className="w-full bg-[#F5F5F5] py-12 px-4 rounded-2xl text-center animate-fadeIn">
        <div className="w-12 h-12 rounded-full bg-gray-200/90 flex items-center justify-center mb-3 mx-auto text-gray-400">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-700">{emptyTitle}</p>
        {emptySubtitle && (
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">{emptySubtitle}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5" ref={menuContainerRef}>
      {groupedLessons.map((group) => (
        <section key={group.dateKey} aria-label={group.label}>
          {/* Date header divider */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span>{group.label}</span>
            </div>
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-[11px] font-medium text-gray-400 shrink-0">
              {group.items.length} {group.items.length === 1 ? "lesson" : "lessons"}
            </span>
          </div>

          {/* Stacked Cards for this date */}
          <div className="space-y-3">
            {group.items.map((lesson, idx) => {
              const lessonId = lesson.bookingId || lesson._id || `lesson-${idx}`;
              const timeDisplay = getTimeDisplay(lesson.scheduledAt);
              const isCurriculum =
                lesson.type === "curriculum" ||
                !!lesson.curriculumTitle ||
                lesson.isCurriculum === true;
              const isExpanded = !!expandedCards[lessonId];
              const isMenuOpen = activeMenuId === lessonId;

              // Title fallback
              const title = lesson.lessonTitle || lesson.curriculumTitle || "Scheduled Session";

              // Secondary line: Curriculum type + Teacher name
              const curriculumType = lesson.curriculumTitle
                ? lesson.curriculumTitle
                : isCurriculum
                ? "Curriculum"
                : "Individual Lesson";
              const teacherName = lesson.name || "Unknown Teacher";
              const secondaryLine = `${curriculumType} · Teacher ${teacherName}`;

              // Status badge styling with high WCAG contrast
              let statusBadge;
              if (activeTab === "upcoming") {
                statusBadge = (
                  <span className="bg-primary text-white text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
                    Upcoming
                  </span>
                );
              } else if (lesson?.status === "completed") {
                statusBadge = (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Completed
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="bg-amber-100 text-amber-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Pending
                  </span>
                );
              }

              // Determine primary vs secondary actions
              const isPastCompletedNeedsReview =
                activeTab === "past" && lesson?.status === "completed" && lesson?.review === false;

              return (
                <article
                  key={lessonId}
                  className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative animate-fadeIn transition-all"
                >
                  {/* Top row: Date + time on left, Status badge on right */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium truncate">
                      <FaRegClock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">
                        {timeDisplay.date}
                        {timeDisplay.time ? ` · ${timeDisplay.time}` : ""}
                      </span>
                    </div>
                    <div className="shrink-0">{statusBadge}</div>
                  </div>

                  {/* Lesson title: truncated to 2 lines max, tappable to expand */}
                  <div
                    onClick={() => toggleExpand(lessonId)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    className="cursor-pointer group select-none text-left"
                  >
                    <h4
                      className={`text-base font-bold text-[#1A2B49] leading-snug transition-all ${
                        isExpanded ? "" : "line-clamp-2"
                      }`}
                    >
                      {title}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5 group-hover:text-primary">
                      <span>{isExpanded ? "Show less" : "Tap to expand"}</span>
                      <FaChevronDown
                        className={`w-2.5 h-2.5 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Secondary muted line below title: Curriculum type + Teacher name */}
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-1 font-normal">
                    {secondaryLine}
                  </p>

                  {/* Bottom row separated by divider: Amount on left, Actions on right */}
                  <div className="border-t border-gray-100 mt-3 pt-3 flex items-center justify-between gap-3">
                    {/* Amount */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                        Amount
                      </span>
                      <span className="text-base font-bold text-[#1A2B49]">
                        {formatPrice(lesson.amount, lesson.currency || "USD")}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 relative">
                      {/* Primary Action Button (min 44px tap target) */}
                      {isPastCompletedNeedsReview ? (
                        <button
                          type="button"
                          onClick={() => handleReview && handleReview(lesson)}
                          className="min-h-[44px] px-4 py-2 bg-[#E9EAEE] hover:bg-gray-300 text-black text-xs font-semibold rounded-full transition-colors cursor-pointer flex items-center justify-center active:scale-95"
                        >
                          Leave a review
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMessageTeacher && handleMessageTeacher(lesson)}
                          onMouseEnter={() => preloadRoute("chat")}
                          onTouchStart={() => preloadRoute("chat")}
                          className="min-h-[44px] px-4 py-2 bg-[#E9EAEE] hover:bg-gray-300 text-black text-xs font-semibold rounded-full transition-colors cursor-pointer flex items-center justify-center active:scale-95"
                        >
                          Message
                        </button>
                      )}

                      {/* "⋯" Overflow Menu Trigger (min 44x44px tap target) */}
                      {activeTab === "upcoming" ? (
                        <div className="relative">
                          <button
                            type="button"
                            aria-label="More lesson actions"
                            aria-expanded={isMenuOpen}
                            onClick={(e) => toggleMenu(lessonId, e)}
                            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-[#E9EAEE] hover:bg-gray-300 active:scale-95 text-black transition-colors cursor-pointer"
                          >
                            <HiDotsHorizontal className="w-5 h-5 text-gray-700" />
                          </button>

                          {/* Accessible floating dropdown menu */}
                          {isMenuOpen && (
                            <div
                              role="menu"
                              className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-30 animate-fadeIn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Cancel curriculum / Cancel lesson */}
                              <button
                                type="button"
                                role="menuitem"
                                disabled={cancellingId === lessonId}
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleCancel && handleCancel(lesson);
                                }}
                                className="w-full min-h-[44px] px-4 py-2.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {cancellingId === lessonId ? (
                                  <>
                                    <ButtonSpinner size={14} />
                                    <span>Cancelling...</span>
                                  </>
                                ) : (
                                  <span>{isCurriculum ? "Cancel curriculum" : "Cancel lesson"}</span>
                                )}
                              </button>

                              {/* Manage curriculum / Manage lesson */}
                              <button
                                type="button"
                                role="menuitem"
                                disabled={openingManageId === lessonId}
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onManageLesson && onManageLesson(lesson);
                                }}
                                className="w-full min-h-[44px] px-4 py-2.5 text-left text-xs font-medium text-gray-800 hover:bg-gray-100 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {openingManageId === lessonId ? (
                                  <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                                    <span>Opening...</span>
                                  </>
                                ) : (
                                  <span>{isCurriculum ? "Manage curriculum" : "Manage lesson"}</span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : isPastCompletedNeedsReview ? (
                        /* In past tab, if Leave a Review is primary, Message is accessible in overflow */
                        <div className="relative">
                          <button
                            type="button"
                            aria-label="More lesson actions"
                            aria-expanded={isMenuOpen}
                            onClick={(e) => toggleMenu(lessonId, e)}
                            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-[#E9EAEE] hover:bg-gray-300 active:scale-95 text-black transition-colors cursor-pointer"
                          >
                            <HiDotsHorizontal className="w-5 h-5 text-gray-700" />
                          </button>

                          {isMenuOpen && (
                            <div
                              role="menu"
                              className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-30 animate-fadeIn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleMessageTeacher && handleMessageTeacher(lesson);
                                }}
                                className="w-full min-h-[44px] px-4 py-2.5 text-left text-xs font-medium text-gray-800 hover:bg-gray-100 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <span>Message Teacher</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
