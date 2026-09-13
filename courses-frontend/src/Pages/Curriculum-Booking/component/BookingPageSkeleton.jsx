import React from "react";

export default function BookingPageSkeleton({ isCurriculum = false }) {
  return (
    <div className="w-full min-h-screen pb-8">
      {/* Desktop Breadcrumb Skeleton */}
      <div className="hidden md:flex items-center w-full pt-6 md:pt-8">
        <div className="h-4 w-44 bg-gray-200 rounded-full animate-pulse" />
      </div>

      {/* Badges / Action Row Skeleton */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-[32px]">
        <div className="h-[30px] w-24 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-[30px] w-20 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-[30px] w-36 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-[30px] w-28 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-[30px] w-24 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-[30px] w-20 bg-gray-200 rounded-full animate-pulse" />
      </div>

      {/* Title Skeleton */}
      <div className="w-full mt-[32px]">
        <div className="h-8 w-3/5 sm:w-2/5 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Main Multi-Column Grid Skeleton */}
      <div
        className={`grid gap-5 sm:gap-6 mt-[32px] h-fit w-full items-start ${
          isCurriculum
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {/* COLUMN 1: Teacher Card Skeleton */}
        <div className="w-full flex flex-col gap-3.5">
          {/* Eyebrow & Name Bubble */}
          <div className="w-full bg-[#E9EAEE] p-5 rounded-[24px] flex items-center justify-between gap-3 h-[76px] animate-pulse">
            <div className="flex flex-col gap-1.5 w-2/3">
              <div className="h-2.5 w-20 bg-gray-300/80 rounded-full" />
              <div className="h-4 w-32 bg-gray-300/80 rounded-full" />
            </div>
            <div className="h-8 w-20 bg-white/90 rounded-full" />
          </div>

          {/* Profile Photo */}
          <div className="w-full aspect-square rounded-[20px] bg-gray-200 animate-pulse" />

          {/* Tags Bubble */}
          <div className="w-full bg-[#E9EAEE] p-5 rounded-[24px] flex flex-col gap-3 min-h-[160px] animate-pulse">
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-28 bg-gray-300/80 rounded-full" />
              <div className="h-6 w-20 bg-gray-300/80 rounded-full" />
              <div className="h-6 w-24 bg-gray-300/80 rounded-full" />
            </div>
            <div className="h-3 w-full bg-gray-300/80 rounded-full mt-2" />
            <div className="h-3 w-4/5 bg-gray-300/80 rounded-full" />
          </div>
        </div>

        {/* COLUMN 2: Image Gallery Skeleton */}
        <div className="w-full flex flex-col gap-3">
          <div className="aspect-[4/3] w-full rounded-[20px] bg-gray-200 animate-pulse" />
          <div className="aspect-[4/3] w-full rounded-[20px] bg-gray-200 animate-pulse hidden xl:block" />
        </div>

        {/* COLUMN 3: Description Skeleton */}
        <div className="w-full bg-[#E9EAEE] rounded-[24px] p-5 sm:p-6 flex flex-col space-y-4 min-h-[380px] animate-pulse">
          <div className="h-5 w-28 bg-gray-300/80 rounded-full" />
          <div className="space-y-2.5 pt-2">
            <div className="h-3.5 w-full bg-gray-300/80 rounded-full" />
            <div className="h-3.5 w-11/12 bg-gray-300/80 rounded-full" />
            <div className="h-3.5 w-4/5 bg-gray-300/80 rounded-full" />
            <div className="h-3.5 w-3/4 bg-gray-300/80 rounded-full" />
          </div>
          <div className="h-5 w-32 bg-gray-300/80 rounded-full pt-4" />
          <div className="space-y-2.5">
            <div className="h-3.5 w-full bg-gray-300/80 rounded-full" />
            <div className="h-3.5 w-5/6 bg-gray-300/80 rounded-full" />
          </div>
        </div>

        {/* COLUMN 4 (if Curriculum): Units Skeleton */}
        {isCurriculum && (
          <div className="w-full bg-[#E9EAEE] rounded-[24px] p-5 sm:p-6 flex flex-col space-y-4 min-h-[380px] animate-pulse">
            <div className="h-5 w-36 bg-gray-300/80 rounded-full" />
            <div className="space-y-3 pt-2">
              <div className="h-16 w-full bg-white/80 rounded-2xl" />
              <div className="h-16 w-full bg-white/80 rounded-2xl" />
              <div className="h-16 w-full bg-white/80 rounded-2xl" />
            </div>
          </div>
        )}

        {/* LAST COLUMN: Calendar Card Skeleton */}
        <div className="w-full bg-white border border-gray-200 rounded-[24px] p-5 sm:p-6 shadow-sm flex flex-col space-y-4 min-h-[460px] animate-pulse">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="h-5 w-32 bg-gray-200 rounded-full" />
            <div className="h-7 w-20 bg-gray-200 rounded-full" />
          </div>
          <div className="grid grid-cols-7 gap-2 pt-2">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-100" />
            ))}
          </div>
          <div className="h-12 w-full bg-primary/20 rounded-full mt-4" />
        </div>
      </div>
    </div>
  );
}
