import { BookOpen, Users, MapPin, Info, MessageCircle, Star, CheckCircle2, ChevronDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { startChat } from '../../../redux/reducers/ChatReducer';
import { toast } from 'react-toastify';
import UserAvatarPlaceholder from '../../../components/UserAvatarPlaceholder';


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
  const [isTeacherOpen, setIsTeacherOpen] = useState(true);
  
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
      <div className={`w-full flex flex-col gap-3.5 ${className}`}>
        {/* Bubble 1: Collapsible Eyebrow + Teacher Name (Center aligned 2 rows) */}
        <button
          type="button"
          onClick={() => setIsTeacherOpen(!isTeacherOpen)}
          className="w-full bg-[#E9EAEE] rounded-[18px] sm:rounded-[20px] px-4 sm:px-5 py-3 flex justify-between items-center text-left text-[#1A2B49] shadow-none hover:bg-[#dfe1e6] transition-colors cursor-pointer"
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-xs sm:text-sm font-semibold text-[#1A2B49] leading-tight">
              Meet your teacher
            </span>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[#1A2B49] leading-snug truncate mt-0.5">
              {displayName}
            </h2>
          </div>
          <ChevronDown
            className={`transition-transform duration-200 text-gray-700 shrink-0 ${
              isTeacherOpen ? "rotate-180" : ""
            }`}
            size={20}
          />
        </button>

        {isTeacherOpen && (
          <>

        {/* Profile Picture + Attached Description Bubble */}
        <div className="w-full bg-[#E9EAEE] rounded-[20px] overflow-hidden flex flex-col shadow-none">
          {/* Full-width Profile Picture */}
          <Link to={`/user-profile/${teacher?._id}?role=teacher`} className="block w-full overflow-hidden">
            {displayImage?.url && displayImage?.url !== "https://i.ibb.co/tpV3m2GW/no-image.png" ? (
              <img
                src={displayImage.url}
                alt={displayName}
                loading="lazy"
                decoding="async"
                className="w-full aspect-square object-cover block"
              />
            ) : (
              <div className="w-full aspect-square bg-[#E9EAEE] flex items-center justify-center p-12">
                <UserAvatarPlaceholder className="w-24 h-24 text-[#1A2B49]" />
              </div>
            )}
          </Link>

          {/* Description attached directly below picture inside the bubble */}
          {displayBio && (
            <div className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-[#1A2B49] italic leading-relaxed break-words [overflow-wrap:anywhere]">
                "{displayBio}"
              </p>
            </div>
          )}
        </div>

        {/* Separate Grey Bubble for Metadata Badges (Verified teacher, timezone, students, lessons, rating) */}
        <div className="w-full bg-[#E9EAEE] p-4 sm:p-5 rounded-[20px] flex flex-col items-start gap-2.5 shadow-none">
          {/* 1. Verified Teacher Badge */}
          <span className="inline-flex items-center gap-2 text-[#1A2B49] text-[13px] sm:text-sm font-medium shrink-0">
            <CheckCircle2 className="w-4 h-4 text-[#1A2B49] shrink-0" strokeWidth={2} />
            <span>Verified teacher</span>
          </span>

          {/* 2. Timezone Bubble */}
          {displayTimeZone && (
            <span className="inline-flex items-center gap-2 text-[#1A2B49] text-[13px] sm:text-sm font-medium shrink-0 max-w-full">
              <MapPin className="w-4 h-4 text-[#1A2B49] shrink-0" />
              <span className="truncate" title={displayTimeZone}>{displayTimeZone}</span>
            </span>
          )}

          {/* 3. Students Bubble */}
          <span className="inline-flex items-center gap-2 text-[#1A2B49] text-[13px] sm:text-sm font-medium shrink-0">
            <Users className="w-4 h-4 text-[#1A2B49] shrink-0" />
            <span>{displayStudents} Students</span>
          </span>

          {/* 4. Lessons Bubble */}
          <span className="inline-flex items-center gap-2 text-[#1A2B49] text-[13px] sm:text-sm font-medium shrink-0">
            <BookOpen className="w-4 h-4 text-[#1A2B49] shrink-0" />
            <span>{displayLessons || 0} Lessons</span>
          </span>

          {/* 5. Rating Bubble (Unfilled Star & Rating %) */}
          <span className="inline-flex items-center gap-2 text-[#1A2B49] text-[13px] sm:text-sm font-medium shrink-0">
            <Star className="w-4 h-4 text-[#1A2B49] shrink-0" strokeWidth={2} />
            <span>{displayRating > 0 ? `${displayRating}%` : "100%"}</span>
          </span>

              {/* Message Button (Below rating tag with dark blue border & dynamic teacher name) */}
              <button
                type="button"
                onClick={handleStartChat}
                title={displayName ? `Message ${displayName}` : "Message Teacher"}
                className="inline-flex items-center gap-2 bg-transparent hover:bg-[#008494] hover:border-[#008494] hover:text-white border border-[#1A2B49] text-[#1A2B49] px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-none mt-1 max-w-full"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">Message {displayName}</span>
              </button>
            </div>
          </>
        )}
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
                loading="lazy"
                decoding="async"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center p-2.5 shrink-0">
                <UserAvatarPlaceholder className="w-full h-full text-[#1A2B49]" />
              </div>
            )}
          </Link>

          {/* Details Column */}
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-[#1A2B49] leading-tight">
              Meet your teacher
            </span>

            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-[#1A2B49] truncate leading-snug">
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
