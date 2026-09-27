import React, { useState, useMemo, useEffect, useRef } from "react";
import moment from "moment-timezone";
import { HiDotsHorizontal } from "react-icons/hi";
import { FaRegClock, FaChevronDown } from "react-icons/fa";
import ButtonSpinner from "../../../components/ButtonSpinner";
import { preloadRoute } from "../../../utils/routePreloader";
import { MobileScheduleSkeleton } from "../../../components/ProfileTabSkeletons";

/**
 * Responsive stacked card view for mobile (<768px)
 * Displays grouped schedule cards with expandable title & full details drawer,
 * primary action, and 44x44px touch-accessible overflow menu.
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
  // Track expanded card IDs for 2-line title and details toggle
  const [expandedCards, setExpandedCards] = useState({});
  // Track active overflow menu ID
  const [activeMenuId, setActiveMenuId] = useState(null);

  const activeMenuRef = useRef(null);

  // Close overflow menu on outside click or escape
  useEffect(() => {
    if (!activeMenuId) return;

    const handleClickOutside = (e) => {
      if (activeMenuRef.current && !activeMenuRef.current.contains(e.target)) {
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
  // Assigns guaranteed unique _cardUid to each lesson instance
  const groupedLessons = useMemo(() => {
    if (!Array.isArray(lessons) || lessons.length === 0) return [];

    const map = new Map();
    const groups = [];

    lessons.forEach((lesson, originalIndex) => {
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

      // Unique card ID to prevent multi-card menu or expand collisions
      const cardUid = `${lesson.bookingId || "bk"}_${lesson.lId || lesson._id || "ls"}_${lesson.scheduledAt || ""}_${originalIndex}`;

      map.get(dateKey).items.push({
        ...lesson,
        _cardUid: cardUid,
      });
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
    <div className="space-y-5">
      {groupedLessons.map((group) => (
        <section key={group.dateKey} aria-label={group.label}>
          {/* Date header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span>{group.label}</span>
            </div>
            <span className="text-[11px] font-medium text-gray-400 shrink-0">
              {group.items.length} {group.items.length === 1 ? "lesson" : "lessons"}
            </span>
          </div>

          {/* Stacked Cards for this date */}
          <div className="space-y-3">
            {group.items.map((lesson, idx) => {
              const cardId = lesson._cardUid || `card-${idx}`;
              const cancelIdKey = lesson.bookingId || lesson._id;
              const timeDisplay = getTimeDisplay(lesson.scheduledAt);
              const isCurriculum =
                lesson.type === "curriculum" ||
                !!lesson.curriculumTitle ||
                lesson.isCurriculum === true;
              const isExpanded = !!expandedCards[cardId];
              const isMenuOpen = activeMenuId === cardId;

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
                  key={cardId}
                  className="bg-[#F5F5F5] rounded-2xl p-4 relative animate-fadeIn transition-all"
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

                  {/* Lesson title: tappable to expand/view full details */}
                  <div
                    onClick={() => toggleExpand(cardId)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    className="cursor-pointer group select-none text-left"
                  >
                    <h4
                      className={`text-base font-bold text-[#1A2B49] leading-snug transition-all ${
                        isExpanded ? "line-clamp-none break-words" : "line-clamp-2"
                      }`}
                    >
                      {title}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-primary font-medium mt-1 group-hover:underline">
                      <span>{isExpanded ? "Hide details" : "Tap to view full details"}</span>
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

                  {/* Expanded Full Details Drawer (Clean white bubble inside grey bubble, no grey lines) */}
                  {isExpanded && (
                    <div className="bg-white rounded-xl p-3.5 mt-3 space-y-2 text-xs shadow-2xs animate-fadeIn">
                      {lesson.lessonTitle && (
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-gray-400 font-medium shrink-0">Lesson:</span>
                          <span className="font-semibold text-[#1A2B49] text-right break-words">
                            {lesson.lessonTitle}
                          </span>
                        </div>
                      )}
                      {isCurriculum && lesson.curriculumTitle && (
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-gray-400 font-medium shrink-0">Curriculum:</span>
                          <span className="font-semibold text-[#1A2B49] text-right break-words">
                            {lesson.curriculumTitle}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-400 font-medium shrink-0">Teacher:</span>
                        <span className="font-semibold text-[#1A2B49] text-right">{teacherName}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-400 font-medium shrink-0">Time:</span>
                        <span className="font-semibold text-[#1A2B49] text-right">
                          {timeDisplay.date} {timeDisplay.time ? `· ${timeDisplay.time}` : ""}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-400 font-medium shrink-0">Type:</span>
                        <span className="font-semibold text-[#1A2B49] text-right">
                          {isCurriculum ? "Curriculum Session" : "Individual Lesson"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-400 font-medium shrink-0">Amount:</span>
                        <span className="font-bold text-[#1A2B49] text-right">
                          {formatPrice(lesson.amount, lesson.currency || "USD")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Bottom row: Amount on left, Actions on right (no grey line) */}
                  <div className="mt-3.5 pt-1 flex items-center justify-between gap-3">
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
                      {/* Primary Action Button (fill white with text color border, min 44px tap target) */}
                      {isPastCompletedNeedsReview ? (
                        <button
                          type="button"
                          onClick={() => handleReview && handleReview(lesson)}
                          className="min-h-[44px] px-5 py-2 bg-white hover:bg-gray-50 text-[#1A2B49] border border-[#1A2B49] text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-2xs"
                        >
                          Leave a review
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMessageTeacher && handleMessageTeacher(lesson)}
                          onMouseEnter={() => preloadRoute("chat")}
                          onTouchStart={() => preloadRoute("chat")}
                          className="min-h-[44px] px-5 py-2 bg-white hover:bg-gray-50 text-[#1A2B49] border border-[#1A2B49] text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-2xs"
                        >
                          Message
                        </button>
                      )}

                      {/* "⋯" Overflow Menu Trigger (fill white with text color border, min 44x44px tap target) */}
                      {activeTab === "upcoming" ? (
                        <div className="relative" ref={isMenuOpen ? activeMenuRef : null}>
                          <button
                            type="button"
                            aria-label="More lesson actions"
                            aria-expanded={isMenuOpen}
                            onClick={(e) => toggleMenu(cardId, e)}
                            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 text-[#1A2B49] border border-[#1A2B49] active:scale-95 transition-all cursor-pointer shadow-2xs"
                          >
                            <HiDotsHorizontal className="w-5 h-5 text-[#1A2B49]" />
                          </button>

                          {/* Accessible floating dropdown menu */}
                          {isMenuOpen && (
                            <div
                              role="menu"
                              className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-200 py-1.5 z-40 animate-fadeIn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Cancel curriculum / Cancel lesson */}
                              <button
                                type="button"
                                role="menuitem"
                                disabled={cancellingId === cancelIdKey}
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleCancel && handleCancel(lesson);
                                }}
                                className="w-full min-h-[44px] px-4 py-2.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {cancellingId === cancelIdKey ? (
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
                                disabled={openingManageId === cancelIdKey}
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onManageLesson && onManageLesson(lesson);
                                }}
                                className="w-full min-h-[44px] px-4 py-2.5 text-left text-xs font-medium text-[#1A2B49] hover:bg-gray-100 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {openingManageId === cancelIdKey ? (
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
                        <div className="relative" ref={isMenuOpen ? activeMenuRef : null}>
                          <button
                            type="button"
                            aria-label="More lesson actions"
                            aria-expanded={isMenuOpen}
                            onClick={(e) => toggleMenu(cardId, e)}
                            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 text-[#1A2B49] border border-[#1A2B49] active:scale-95 transition-all cursor-pointer shadow-2xs"
                          >
                            <HiDotsHorizontal className="w-5 h-5 text-[#1A2B49]" />
                          </button>

                          {isMenuOpen && (
                            <div
                              role="menu"
                              className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-200 py-1.5 z-40 animate-fadeIn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleMessageTeacher && handleMessageTeacher(lesson);
                                }}
                                className="w-full min-h-[44px] px-4 py-2.5 text-left text-xs font-medium text-[#1A2B49] hover:bg-gray-100 flex items-center gap-2 transition-colors cursor-pointer"
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
