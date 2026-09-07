import { BookOpen, Users, MapPin, Info, MessageCircle } from 'lucide-react';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { startChat } from '../../../redux/reducers/ChatReducer';
import { toast } from 'react-toastify';


const TeacherCard = ({
  teacher,
  name,
  averageRating,
  classesHosted,
  classesAttended,
  bio,
  image,
  lession,
  location,
  timeZone,
  className = "mt-2",
  rightContent,
  bottomContent,
  layout = "row"
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
   const { userInfo } = useSelector((state) => state.auth);
  
  const displayName = name || teacher?.name || teacher?.email;
  const displayRating = averageRating || teacher?.averageRating || 0;
  const displayBio = bio || teacher?.bio;
  const displayImage = image || teacher?.image;
  const displayStudents = classesHosted ?? teacher?.classesHosted ?? 0;
  const displayLessons = lession ;
  const resolvedTimeZone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const displayTimeZone = timeZone || teacher?.timeZone || resolvedTimeZone;
  const displayLocation = location || teacher?.location || "Online";

  const handleStartChat = async () => {
    if (!userInfo?._id) {
      toast.info("Please log in to send a message.");
      navigate("/login");
      return;
    }

    if (!teacher?._id) {
      toast.error("Teacher information not available");
      return;
    }

    if (userInfo?._id === teacher._id) {
      toast.info("This is your profile.");
      return;
    }

    try {
      const data = await dispatch(startChat({ targetUserId: teacher._id })).unwrap();
      const roomId = data?.room?._id;

      if (!roomId) {
        toast.error("Could not start the chat. Please try again.");
        return;
      }

      toast.success("Chat ready.");
      navigate(`/chat/${roomId}`);
    } catch (error) {
      const message =
        typeof error === "string" ? error : "Failed to start chat.";
      toast.error(message);
    }
  };

  if (layout === "column") {
    return (
      <div className={`w-full bg-[#E9EAEE] p-5 rounded-[24px] flex flex-col h-fit shadow-none ${className}`}>
        {/* Top Header: Eyebrow + Teacher Name & Message Button */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 leading-tight">
              Meet your teacher
            </span>
            <h2 className="text-base sm:text-lg font-normal text-black leading-snug truncate mt-0.5">
              {displayName}
            </h2>
          </div>

          {/* Message Bubble Button */}
          <button
            type="button"
            onClick={handleStartChat}
            title="Message Teacher"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-black px-3.5 py-1.5 rounded-full text-xs font-normal shadow-sm cursor-pointer transition-colors shrink-0"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Message</span>
          </button>
        </div>

        {/* Full-width Profile Picture */}
        <Link to={`/user-profile/${teacher?._id}?role=teacher`} className="block w-full mt-3.5">
          {displayImage?.url && displayImage?.url !== "https://i.ibb.co/tpV3m2GW/no-image.png" ? (
            <img
              src={displayImage.url}
              alt={displayName}
              className="w-full aspect-square rounded-2xl object-cover block"
            />
          ) : (
            <div className="w-full aspect-square rounded-2xl bg-[#1A4BFF] text-white flex items-center justify-center font-bold text-4xl">
              {displayName?.charAt(0)?.toUpperCase() || "T"}
            </div>
          )}
        </Link>

        {/* Details & Badges stacked below, all left-aligned */}
        <div className="flex flex-col items-start gap-2 mt-3 w-full">
          {/* Bubbles Flow Row: All uniform size, wrapping naturally to next line */}
          <div className="flex flex-wrap items-center gap-2 w-full">
            {/* 1. Verified Teacher Badge */}
            <span className="inline-flex items-center gap-1.5 bg-[#E8F8EE] text-[#0E8345] border border-[#B7EBD0] px-3 py-1 rounded-full text-xs font-medium shadow-sm shrink-0">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <circle cx="10" cy="10" r="9" fill="#0E8345" />
                <path d="M6 10L8.5 12.5L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Verified teacher</span>
            </span>

            {/* 2. 1-Star & 100% Bubble */}
            <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200/90 text-gray-900 px-3 py-1 rounded-full text-xs font-medium shadow-sm shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" className="shrink-0 text-amber-400">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{displayRating > 0 ? `${displayRating}%` : "100%"}</span>
            </span>

            {/* 3. Timezone Bubble */}
            {displayTimeZone && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200/90 text-gray-900 px-3 py-1 rounded-full text-xs font-medium shadow-sm shrink-0 max-w-full">
                <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                <span className="truncate" title={displayTimeZone}>{displayTimeZone}</span>
              </span>
            )}

            {/* 4. Students Bubble */}
            <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200/90 text-gray-900 px-3 py-1 rounded-full text-xs font-medium shadow-sm shrink-0">
              <Users className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              <span>{displayStudents} Students</span>
            </span>

            {/* 5. Lessons Bubble */}
            <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200/90 text-gray-900 px-3 py-1 rounded-full text-xs font-medium shadow-sm shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              <span>{displayLessons || 0} Lessons</span>
            </span>
          </div>

          {/* Bio / Quote (italic, left-aligned) */}
          {displayBio && (
            <p className="text-xs text-gray-500 italic mt-1 line-clamp-3 leading-relaxed break-words [overflow-wrap:anywhere]">
              "{displayBio}"
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-[#E9EAEE] px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl flex flex-col gap-3.5 ${className}`}>
      {/* Top Row: Left (Avatar + Details) & Right (Actions) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Avatar */}
          <Link to={`/user-profile/${teacher?._id}?role=teacher`} className="shrink-0">
            {displayImage?.url && displayImage?.url !== "https://i.ibb.co/tpV3m2GW/no-image.png" ? (
              <img
                src={displayImage.url}
                alt={displayName}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1A4BFF] text-white flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                {displayName?.charAt(0)?.toUpperCase() || "T"}
              </div>
            )}
          </Link>

          {/* Details Column */}
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-gray-400 leading-tight">
              MEET YOUR TEACHER
            </span>

            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-black truncate leading-snug">
                {displayName}
              </h4>
              {displayRating > 0 && (
                <span className="text-xs sm:text-sm text-gray-600 font-normal">
                  ({displayRating}%)
                </span>
              )}
            </div>

            {/* Stats: Lessons & Students */}
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-gray-500">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="16" y2="12"/>
                  <line x1="3" y1="18" x2="11" y2="18"/>
                </svg>
                <span>{displayLessons || 0} Lessons</span>
              </span>

              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-500">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{displayStudents} Students</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Info items, buttons & Chat Button (Right aligned) */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 ml-auto">
          {rightContent}

          {/* Circular Chat Button */}
          <button
            type="button"
            onClick={handleStartChat}
            title="Message Teacher"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-300/80 bg-white/90 hover:bg-white flex items-center justify-center text-gray-600 hover:text-black hover:border-gray-400 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Content: 4 start bubbles under teacher profile */}
      {bottomContent && (
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-0.5">
          {bottomContent}
        </div>
      )}
    </div>
  );
};


export default TeacherCard
