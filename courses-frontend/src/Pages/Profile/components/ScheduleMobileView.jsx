import React, { useMemo } from "react";
import moment from "moment-timezone";
import {
  FaRegClock,
  FaBookOpen,
  FaUser,
  FaRegCommentAlt,
  FaCalendarTimes,
  FaClipboardList,
  FaStar,
} from "react-icons/fa";
import ButtonSpinner from "../../../components/ButtonSpinner";
import { preloadRoute } from "../../../utils/routePreloader";
import { MobileScheduleSkeleton } from "../../../components/ProfileTabSkeletons";

/**
 * Responsive stacked card view for mobile (<768px)
 * Layout & Hierarchy:
 * - Top row: Large bold time (primary element) + small muted timezone on left; Status badge on right
 * - Lesson title: Bold, second-largest text, max 2 lines with ellipsis, tappable for details
 * - Meta row: Curriculum type + teacher name with book icon on left; Amount as small muted text on right
 * - Action row: Below a divider line, three equal-width ~32px pill buttons (Message, Cancel with danger tint, Manage)
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
  // Group lessons by scheduled date for clear mobile sections
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

      const cardUid = `${lesson.bookingId || "bk"}_${lesson.lId || lesson._id || "ls"}_${lesson.scheduledAt || ""}_${originalIndex}`;

      map.get(dateKey).items.push({
        ...lesson,
        _cardUid: cardUid,
      });
    });

    return groups;
  }, [lessons]);

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
          {/* Section Date header */}
          <div className="flex flex-col items-start mb-2 px-1 gap-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span>{group.label}</span>
            </div>
            <span className="text-[11px] font-medium text-gray-400 pl-3.5 text-left">
              {group.items.length} {group.items.length === 1 ? "lesson" : "lessons"}
            </span>
          </div>

          {/* Stacked Cards for this date */}
          <div className="space-y-3">
            {group.items.map((lesson, idx) => {
              const cardId = lesson._cardUid || `card-${idx}`;
              const cancelIdKey = lesson.bookingId || lesson._id;
              const isCurriculum =
                lesson.type === "curriculum" ||
                !!lesson.curriculumTitle ||
                lesson.isCurriculum === true;

              // Extract time and timezone parts
              let timeStr = "";
              let tzStr = "";

              if (lesson.scheduledAt) {
                try {
                  const localMoment = moment.utc(lesson.scheduledAt).local();
                  timeStr = localMoment.format("h:mm A");
                  tzStr = moment.tz(moment.tz.guess()).zoneAbbr() || "";
                } catch {
                  const td = getTimeDisplay(lesson.scheduledAt);
                  timeStr = td.time || "Time not set";
                }
              } else {
                const td = getTimeDisplay(lesson.scheduledAt);
                timeStr = td.time || "Time not set";
              }

              // Title fallback
              const title = lesson.lessonTitle || lesson.curriculumTitle || "Scheduled Session";

              // Teacher name
              const teacherName = lesson.name || "Unknown Teacher";

              // Curriculum subtitle text
              const curriculumText = lesson.curriculumTitle
                ? `${lesson.curriculumTitle} · Curriculum`
                : isCurriculum
                ? "Curriculum"
                : "Single Lesson";

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

              // Determine primary vs secondary actions for past tab
              const isPastCompletedNeedsReview =
                activeTab === "past" && lesson?.status === "completed" && lesson?.review === false;

              return (
                <article
                  key={cardId}
                  className="bg-[#F5F5F5] rounded-2xl p-4 relative animate-fadeIn transition-all"
                >
                  {/* Status badge: Placed above time, left-aligned */}
                  <div className="flex items-center justify-start">
                    {statusBadge}
                  </div>

                  {/* Large bold time (primary element) + small muted timezone on left */}
                  <div className="flex items-baseline gap-1.5 mt-4">
                    <span className="text-xl sm:text-2xl font-black text-[#1A2B49] tracking-tight leading-none">
                      {timeStr}
                    </span>
                    {tzStr && (
                      <span className="text-xs font-semibold text-gray-400 uppercase">
                        {tzStr}
                      </span>
                    )}
                  </div>

                  {/* Lesson title: Bold, second-largest text, max 2 lines ellipsis, tappable for details */}
                  <h4
                    onClick={() => onManageLesson && onManageLesson(lesson)}
                    role="button"
                    tabIndex={0}
                    title={title}
                    className="text-base font-bold text-[#1A2B49] leading-snug line-clamp-2 mt-2 cursor-pointer hover:text-primary transition-colors text-left"
                  >
                    {title}
                  </h4>

                  {/* Meta row: Curriculum with book icon */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                    <FaBookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{curriculumText}</span>
                  </div>

                  {/* Price on next line, left-aligned */}
                  <div className="text-xs font-medium text-gray-500 mt-1 text-left">
                    {formatPrice(lesson.amount, lesson.currency || "USD")}
                  </div>

                  {/* Teacher Name (with icon on separate next line) */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    <FaUser className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate font-medium text-gray-600">
                      {teacherName}
                    </span>
                  </div>

                  {/* Action row: Three equal-width buttons (~32px, pill-shaped, no grey divider line) */}
                  {activeTab === "upcoming" ? (
                    <div className="mt-3.5 flex items-center gap-2">
                      {/* Message */}
                      <button
                        type="button"
                        onClick={() => handleMessageTeacher && handleMessageTeacher(lesson)}
                        onMouseEnter={() => preloadRoute("chat")}
                        onTouchStart={() => preloadRoute("chat")}
                        className="flex-1 min-w-0 h-8 px-2 bg-white hover:bg-gray-50 text-[#1A2B49] border border-[#1A2B49] text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                      >
                        <FaRegCommentAlt className="w-3 h-3 text-[#1A2B49] shrink-0" />
                        <span className="truncate">Message</span>
                      </button>

                      {/* Cancel (subtle red/danger tint) */}
                      <button
                        type="button"
                        disabled={cancellingId === cancelIdKey}
                        onClick={() => handleCancel && handleCancel(lesson)}
                        className="flex-1 min-w-0 h-8 px-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs disabled:opacity-50"
                      >
                        {cancellingId === cancelIdKey ? (
                          <>
                            <ButtonSpinner size={12} />
                            <span className="truncate">Cancelling...</span>
                          </>
                        ) : (
                          <>
                            <FaCalendarTimes className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate">Cancel</span>
                          </>
                        )}
                      </button>

                      {/* Manage */}
                      <button
                        type="button"
                        disabled={openingManageId === cancelIdKey}
                        onClick={() => onManageLesson && onManageLesson(lesson)}
                        className="flex-1 min-w-0 h-8 px-2 bg-white hover:bg-gray-50 text-[#1A2B49] border border-[#1A2B49] text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs disabled:opacity-50"
                      >
                        {openingManageId === cancelIdKey ? (
                          <>
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent shrink-0" />
                            <span className="truncate">Opening...</span>
                          </>
                        ) : (
                          <>
                            <FaClipboardList className="w-3 h-3 text-[#1A2B49] shrink-0" />
                            <span className="truncate">Manage</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Past lessons action row (no grey divider line) */
                    <div className="mt-3.5 flex items-center gap-2">
                      {/* Message */}
                      <button
                        type="button"
                        onClick={() => handleMessageTeacher && handleMessageTeacher(lesson)}
                        onMouseEnter={() => preloadRoute("chat")}
                        onTouchStart={() => preloadRoute("chat")}
                        className="flex-1 min-w-0 h-8 px-2 bg-white hover:bg-gray-50 text-[#1A2B49] border border-[#1A2B49] text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                      >
                        <FaRegCommentAlt className="w-3 h-3 text-[#1A2B49] shrink-0" />
                        <span className="truncate">Message</span>
                      </button>

                      {/* Leave Review if completed and unreviewed */}
                      {isPastCompletedNeedsReview && (
                        <button
                          type="button"
                          onClick={() => handleReview && handleReview(lesson)}
                          className="flex-1 min-w-0 h-8 px-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                        >
                          <FaStar className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">Review</span>
                        </button>
                      )}

                      {/* Manage */}
                      {onManageLesson && (
                        <button
                          type="button"
                          onClick={() => onManageLesson(lesson)}
                          className="flex-1 min-w-0 h-8 px-2 bg-white hover:bg-gray-50 text-[#1A2B49] border border-[#1A2B49] text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                        >
                          <FaClipboardList className="w-3 h-3 text-[#1A2B49] shrink-0" />
                          <span className="truncate">Manage</span>
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
