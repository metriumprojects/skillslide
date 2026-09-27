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
  rows = 5,
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
