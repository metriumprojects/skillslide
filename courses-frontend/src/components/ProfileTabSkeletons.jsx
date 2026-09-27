import React from "react";

/**
 * Skeleton card matching the exact dimensions and layout of the booking tile in Upcoming.jsx
 */
export function BookingCardSkeleton() {
  return (
    <article className="mb-4 min-w-0 flex flex-col animate-pulse">
      {/* Aspect-square image container skeleton */}
      <div className="relative aspect-square w-full rounded-[20px] bg-gray-200 overflow-hidden">
        {/* Rating pill top-left */}
        <div className="absolute left-3 top-3 h-6 w-14 rounded-full bg-gray-300/80" />
        {/* Bookmark circle top-right */}
        <div className="absolute right-3 top-3 h-7 w-7 rounded-full bg-gray-300/80" />
      </div>

      {/* Details skeleton */}
      <div className="pt-2 flex flex-col flex-1">
        {/* Title: 2 lines */}
        <div className="h-4 w-4/5 bg-gray-200 rounded mt-1" />
        <div className="h-4 w-3/5 bg-gray-200 rounded mt-1.5" />

        {/* Price & duration */}
        <div className="h-3.5 w-1/2 bg-gray-200 rounded mt-2.5" />

        {/* Teacher pill */}
        <div className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-gray-200 py-1 pl-1 pr-3 w-fit">
          <div className="h-6 w-6 rounded-full bg-gray-300 shrink-0" />
          <div className="h-3 w-20 bg-gray-300 rounded" />
        </div>

        {/* Scheduled time info */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-gray-200 shrink-0" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>

        {/* Manage button pill */}
        <div className="mt-3.5 h-11 w-full rounded-full bg-gray-200" />
      </div>
    </article>
  );
}

/**
 * Grid of booking card skeletons matching the responsive grid in Upcoming.jsx
 */
export function BookingGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-5 gap-6">
      {[...Array(count)].map((_, i) => (
        <BookingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Shimmering skeleton rows for Table views (StudentDashboard, TeacherDashboard, Canceled)
 */
export function TableSkeletonRows({
  rows = 3,
  hasCurriculum = true,
  actionCount = 1,
  hasCanceledBy = false,
}) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="bg-[#F5F5F5] border-b border-white animate-pulse">
          {/* Date */}
          <td className="p-3">
            <div className="h-4 w-16 bg-gray-300/80 rounded" />
          </td>
          {/* Hour */}
          <td className="p-3">
            <div className="h-4 w-14 bg-gray-300/80 rounded" />
          </td>
          {/* Curriculum */}
          {hasCurriculum && (
            <td className="p-3">
              <div className="h-4 w-28 bg-gray-300/80 rounded" />
            </td>
          )}
          {/* Lesson */}
          <td className="p-3">
            <div className="h-4 w-24 bg-gray-300/80 rounded" />
          </td>
          {/* Teacher / Student */}
          <td className="p-3">
            <div className="h-4 w-20 bg-gray-300/80 rounded" />
          </td>
          {/* Amount */}
          <td className="p-3">
            <div className="h-4 w-12 bg-gray-300/80 rounded" />
          </td>
          {/* Status badge */}
          <td className="p-3">
            <div className="h-6 w-20 bg-gray-300/80 rounded-full" />
          </td>
          {/* Canceled By */}
          {hasCanceledBy && (
            <td className="p-3">
              <div className="h-4 w-16 bg-gray-300/80 rounded" />
            </td>
          )}
          {/* Actions */}
          <td className="p-3">
            <div className="flex gap-2 flex-wrap">
              {[...Array(actionCount)].map((_, actIdx) => (
                <div key={actIdx} className="h-8 w-20 bg-gray-300/80 rounded-full" />
              ))}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * Height-balanced, polished empty state for Table views
 * Matches the vertical height of TableSkeletonRows (3 rows)
 * Eliminates sudden height collapse or layout shifting when a table has 0 records.
 */
export function TableEmptyState({
  colSpan = 8,
  title = "No lessons found",
  subtitle = "",
  iconType = "calendar", // "calendar" | "canceled"
}) {
  return (
    <tr className="animate-fadeIn">
      <td colSpan={colSpan} className="py-12 px-4 text-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-gray-500">
          <div className="w-12 h-12 rounded-full bg-gray-200/90 flex items-center justify-center mb-3 text-gray-400">
            {iconType === "canceled" ? (
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <p className="text-base font-semibold text-gray-700">{title}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">{subtitle}</p>}
        </div>
      </td>
    </tr>
  );
}

/**
 * Shimmering stacked card skeleton for mobile schedule view (<768px)
 */
export function MobileScheduleSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-[#F5F5F5] rounded-2xl p-4"
        >
          {/* Top row: Large Time + Status badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="h-6 w-24 bg-gray-300/80 rounded" />
            <div className="h-5 w-16 bg-gray-300/80 rounded-full" />
          </div>

          {/* Lesson title */}
          <div className="h-4 w-4/5 bg-gray-300/80 rounded mt-2" />

          {/* Meta row: Curriculum on left, Amount on right */}
          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="h-3 w-40 bg-gray-300/80 rounded" />
            <div className="h-3 w-14 bg-gray-300/80 rounded" />
          </div>

          {/* Teacher line */}
          <div className="h-3 w-28 bg-gray-300/80 rounded mt-1" />

          {/* Action row: three equal-width buttons (no divider line) */}
          <div className="mt-3.5 flex items-center gap-2">
            <div className="h-8 flex-1 bg-white border border-gray-200 rounded-full" />
            <div className="h-8 flex-1 bg-white border border-gray-200 rounded-full" />
            <div className="h-8 flex-1 bg-white border border-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
