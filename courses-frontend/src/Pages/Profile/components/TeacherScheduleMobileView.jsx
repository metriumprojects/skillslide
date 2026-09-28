import React, { useMemo } from "react";
import moment from "moment-timezone";
import {
  FaUser,
  FaUsers,
  FaBookOpen,
  FaRegCommentAlt,
  FaCalendarTimes,
  FaCheck,
} from "react-icons/fa";
import ButtonSpinner from "../../../components/ButtonSpinner";
import { preloadRoute } from "../../../utils/routePreloader";
import { MobileScheduleSkeleton } from "../../../components/ProfileTabSkeletons";

/**
 * Responsive stacked card view for Teacher Dashboard on mobile (<768px)
 * Designed specifically for teachers:
 * - Shows lesson format badge (Single Lesson / Group Lesson / Curriculum)
 * - Omits teacher/student avatar as requested
 * - Displays large bold time, lesson title, curriculum info, attached dark blue price
 * - Teacher-tailored actions (Message Student, Cancel lesson/curriculum, Mark Complete)
 */
export default function TeacherScheduleMobileView({
  lessons = [],
  isLoading = false,
  activeTab = "upcoming", // "upcoming" | "past" | "canceled"
  formatPrice,
  getTimeDisplay,
  handleMessageStudent,
  handleCancel,
  handleComplete,
  cancellingId,
  completingId,
  emptyTitle = "No lessons scheduled",
  emptySubtitle = "When a student books a lesson or curriculum, it will appear here.",
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
              const isGroup = Boolean(
                lesson.group === true ||
                lesson.isGroup === true ||
                lesson.groupLesson === true ||
                lesson.slotGroup === true ||
                lesson.lessonGroup === true
              );

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

              // Currency & price: Strip raw "US" prefix and attach currency symbol directly in dark blue
              const targetCurrency = lesson.currency || "USD";
              let formattedPrice = "";
              if (typeof formatPrice === "function") {
                try {
                  formattedPrice = formatPrice(lesson.amount, targetCurrency, { currencyDisplay: "narrowSymbol" });
                } catch {
                  formattedPrice = `$${lesson.amount || 0}`;
                }
              } else {
                formattedPrice = `$${lesson.amount || 0}`;
              }
              const displayPrice = typeof formattedPrice === "string"
                ? formattedPrice.replace(/^US/i, "").trim()
                : `$${lesson.amount || 0}`;

              // Status badge styling
              let statusBadge = null;
              if (activeTab === "upcoming") {
                statusBadge = (
                  <span className="bg-primary text-white text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
                    Upcoming
                  </span>
                );
              } else if (activeTab === "canceled" || lesson?.status === "cancelled" || lesson?.status === "canceled") {
                statusBadge = (
                  <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Canceled
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

              return (
                <article
                  key={cardId}
                  className="bg-[#F5F5F5] rounded-2xl p-4 relative animate-fadeIn transition-all"
                >
                  {/* Top row: Status badge on left */}
                  <div className="flex items-center justify-start">
                    {statusBadge}
                  </div>

                  {/* Large bold time (primary element) + small muted timezone on left */}
                  <div className="flex items-baseline gap-1.5 mt-3.5">
                    <span className="text-xl sm:text-2xl font-black text-[#1A2B49] tracking-tight leading-none">
                      {timeStr}
                    </span>
                    {tzStr && (
                      <span className="text-xs font-semibold text-gray-400 uppercase">
                        {tzStr}
                      </span>
                    )}
                  </div>

                  {/* Lesson title: Bold, second-largest text, max 2 lines ellipsis */}
                  <h4
                    title={title}
                    className="text-base font-bold text-[#1A2B49] leading-snug line-clamp-2 mt-2 text-left"
                  >
                    {title}
                  </h4>

                  {/* Price row: Dollar attached directly to amount, dark blue color */}
                  <div className="text-xs font-medium text-[#1A2B49] mt-1.5 text-left">
                    {displayPrice}
                  </div>

                  {/* Format row: below price on left side with icon (Group Lesson / Single Lesson / Curriculum) */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 text-left">
                    {isGroup ? (
                      <>
                        <FaUsers className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Group Lesson</span>
                      </>
                    ) : isCurriculum ? (
                      <>
                        <FaBookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">
                          {lesson.curriculumTitle ? `${lesson.curriculumTitle} · Curriculum` : "Curriculum"}
                        </span>
                      </>
                    ) : (
                      <>
                        <FaUser className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Single Lesson</span>
                      </>
                    )}
                  </div>

                  {/* Canceled by metadata row */}
                  {activeTab === "canceled" && lesson.canceledBy && (
                    <div className="text-xs text-rose-600 font-medium mt-1 text-left">
                      Canceled by: {lesson.canceledBy}
                    </div>
                  )}

                  {/* Action row */}
                  {activeTab === "upcoming" ? (
                    <div className="mt-3.5 flex items-center gap-2">
                      {/* Message Student */}
                      <button
                        type="button"
                        onClick={() => handleMessageStudent && handleMessageStudent(lesson)}
                        onMouseEnter={() => preloadRoute("chat")}
                        onTouchStart={() => preloadRoute("chat")}
                        className="flex-1 min-w-0 h-8 px-2 bg-white hover:bg-gray-50 text-[#1A2B49] border border-[#1A2B49] text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                      >
                        <FaRegCommentAlt className="w-3 h-3 text-[#1A2B49] shrink-0" />
                        <span className="truncate">Message Student</span>
                      </button>

                      {/* Cancel Lesson / Curriculum */}
                      <button
                        type="button"
                        disabled={cancellingId === cancelIdKey}
                        onClick={() => handleCancel && handleCancel(lesson)}
                        className="flex-1 min-w-0 h-8 px-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-600 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs disabled:opacity-50"
                      >
                        {cancellingId === cancelIdKey ? (
                          <>
                            <ButtonSpinner size={12} />
                            <span className="truncate">Cancelling...</span>
                          </>
                        ) : (
                          <>
                            <FaCalendarTimes className="w-3 h-3 text-rose-600 shrink-0" />
                            <span className="truncate">
                              {isCurriculum ? "Cancel curriculum" : "Cancel lesson"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : activeTab === "past" ? (
                    <div className="mt-3.5 flex items-center gap-2">
                      {lesson?.status !== "completed" ? (
                        <>
                          {/* Message Student */}
                          <button
                            type="button"
                            onClick={() => handleMessageStudent && handleMessageStudent(lesson)}
                            onMouseEnter={() => preloadRoute("chat")}
                            onTouchStart={() => preloadRoute("chat")}
                            className="flex-1 min-w-0 h-8 px-2 bg-white hover:bg-gray-50 text-[#1A2B49] border border-[#1A2B49] text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                          >
                            <FaRegCommentAlt className="w-3 h-3 text-[#1A2B49] shrink-0" />
                            <span className="truncate">Message</span>
                          </button>

                          {/* Cancel Lesson */}
                          <button
                            type="button"
                            disabled={cancellingId === cancelIdKey}
                            onClick={() => handleCancel && handleCancel(lesson)}
                            className="flex-1 min-w-0 h-8 px-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-600 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs disabled:opacity-50"
                          >
                            {cancellingId === cancelIdKey ? (
                              <>
                                <ButtonSpinner size={12} />
                                <span className="truncate">Cancelling...</span>
                              </>
                            ) : (
                              <>
                                <FaCalendarTimes className="w-3 h-3 text-rose-600 shrink-0" />
                                <span className="truncate">Cancel</span>
                              </>
                            )}
                          </button>

                          {/* Mark lesson as complete */}
                          <button
                            type="button"
                            disabled={completingId === cancelIdKey}
                            onClick={() => handleComplete && handleComplete(lesson)}
                            className="flex-1 min-w-0 h-8 px-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-600 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs disabled:opacity-50"
                          >
                            {completingId === cancelIdKey ? (
                              <>
                                <ButtonSpinner size={12} />
                                <span className="truncate">Completing...</span>
                              </>
                            ) : (
                              <>
                                <FaCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">Complete</span>
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Message Student */}
                          <button
                            type="button"
                            onClick={() => handleMessageStudent && handleMessageStudent(lesson)}
                            onMouseEnter={() => preloadRoute("chat")}
                            onTouchStart={() => preloadRoute("chat")}
                            className="flex-1 min-w-0 h-8 px-2 bg-white hover:bg-gray-50 text-[#1A2B49] border border-[#1A2B49] text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                          >
                            <FaRegCommentAlt className="w-3 h-3 text-[#1A2B49] shrink-0" />
                            <span className="truncate">Message Student</span>
                          </button>

                          {/* Completed indicator */}
                          <div className="flex-1 min-w-0 h-8 px-2 bg-gray-100 text-gray-500 border border-gray-200 text-xs font-medium rounded-full flex items-center justify-center gap-1.5 shadow-2xs cursor-default">
                            <FaCheck className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">Completed</span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Canceled Tab */
                    <div className="mt-3.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMessageStudent && handleMessageStudent(lesson)}
                        onMouseEnter={() => preloadRoute("chat")}
                        onTouchStart={() => preloadRoute("chat")}
                        className="w-full h-8 px-2 bg-white hover:bg-gray-50 text-[#1A2B49] border border-[#1A2B49] text-xs font-medium rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                      >
                        <FaRegCommentAlt className="w-3 h-3 text-[#1A2B49] shrink-0" />
                        <span className="truncate">Message Student</span>
                      </button>
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
