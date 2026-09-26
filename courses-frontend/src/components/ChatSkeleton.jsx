import React from "react";
import MainLayout from "./MainLayout";

/**
 * ChatConversationSkeleton
 * Skeleton for the conversation panel on the right side of the chat.
 */
export function ChatConversationSkeleton({ statusText = "Loading conversation..." }) {
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-white animate-pulse">
      {/* Top Header */}
      <div className="p-4 border-b-2 border-gray-300 flex items-center justify-between gap-3 bg-white shadow-sm h-[73.6px] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="h-4 w-36 sm:w-48 bg-gray-200 rounded" />
            <div className="h-2.5 w-24 bg-gray-200 rounded" />
          </div>
        </div>
        {statusText && (
          <span className="text-xs text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full shrink-0 border border-gray-200">
            {statusText}
          </span>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 space-y-4 p-4 overflow-hidden bg-gray-50 flex flex-col justify-end">
        {/* Incoming message */}
        <div className="flex items-start gap-2.5 max-w-[85%] md:max-w-[70%]">
          <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 mt-1" />
          <div className="space-y-1.5">
            <div className="h-10 w-48 sm:w-60 bg-gray-200 rounded-2xl rounded-tl-sm p-3" />
            <div className="h-2 w-12 bg-gray-200 rounded ml-1" />
          </div>
        </div>

        {/* Outgoing message */}
        <div className="flex items-end justify-end w-full">
          <div className="space-y-1.5 flex flex-col items-end max-w-[85%] md:max-w-[70%]">
            <div className="h-12 w-56 sm:w-72 bg-primary/20 rounded-2xl rounded-tr-sm p-3" />
            <div className="h-2 w-12 bg-gray-200 rounded mr-1" />
          </div>
        </div>

        {/* Incoming message with preview */}
        <div className="flex items-start gap-2.5 max-w-[85%] md:max-w-[70%]">
          <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 mt-1" />
          <div className="space-y-2">
            <div className="w-48 sm:w-64 h-24 sm:h-28 bg-gray-200 rounded-2xl rounded-tl-sm" />
            <div className="h-2 w-16 bg-gray-200 rounded ml-1" />
          </div>
        </div>

        {/* Outgoing short message */}
        <div className="flex items-end justify-end w-full">
          <div className="space-y-1.5 flex flex-col items-end max-w-[85%] md:max-w-[70%]">
            <div className="h-9 w-32 sm:w-44 bg-primary/20 rounded-2xl rounded-tr-sm" />
            <div className="h-2 w-10 bg-gray-200 rounded mr-1" />
          </div>
        </div>
      </div>

      {/* Input Footer */}
      <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 h-11 bg-gray-100 rounded-full" />
        <div className="w-11 h-11 rounded-full bg-primary/25 shrink-0" />
      </div>
    </div>
  );
}

/**
 * ChatSkeleton
 * Full page skeleton matching Chat.jsx layout inside MainLayout.
 * Used as Suspense fallback for instant 0ms perceived navigation.
 */
export default function ChatSkeleton() {
  return (
    <MainLayout width="100%">
      <div className="flex md:h-full border-2 border-gray-300 overflow-hidden shadow-lg bg-white h-[calc(100dvh-150px)] md:h-[88vh] relative my-2 md:my-[32px] rounded-lg">
        {/* Left Sidebar Skeleton */}
        <div className="h-full w-full md:w-1/3 lg:w-1/4 md:border-r-2 border-gray-300 bg-white flex flex-col shrink-0 animate-pulse">
          {/* Sidebar Sticky Header */}
          <div className="p-4 border-b border-gray-300 bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10 h-[73.6px] flex items-center justify-between">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-8 w-8 bg-gray-200 rounded-full" />
          </div>

          {/* Sidebar Conversation List Items */}
          <div className="divide-y divide-gray-100 overflow-hidden flex-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                    <div className="h-2.5 bg-gray-200 rounded w-12" />
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Conversation Panel Skeleton */}
        <div className="hidden md:flex flex-1 flex-col h-full w-full bg-white">
          <ChatConversationSkeleton statusText="Loading chat..." />
        </div>
      </div>
    </MainLayout>
  );
}
