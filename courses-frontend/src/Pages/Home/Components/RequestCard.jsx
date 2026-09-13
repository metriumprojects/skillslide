import React, { memo } from "react";
import { Heart, Plus, Loader2 } from "lucide-react";
import { BiSolidZap } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { startChat } from "../../../redux/reducers/ChatReducer";
import { toast } from "react-toastify";

// Optimize Cloudinary URLs to load small thumbnails instead of full images
const getOptimizedUrl = (url, width = 256) => {
  if (!url || typeof url !== "string") return url;
  // Cloudinary: insert transformation before /upload/ or /v1234/
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
  }
  return url;
};

const RequestCard = memo(function RequestCard({
  req,
  isFavorite,
  onSave,
  onCreateLesson,
  onSendExistingLesson,
  openPropose,
  setOpenPropose,
  userInfo,
  isLoading,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { startChatLoading } = useSelector((state) => state.chat);
  const formattedDate = (() => {
    const timestamp = req?.updatedAt || req?.createdAt;
    if (!timestamp) return "Date not available";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "Date not available";
    const datePart = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} • ${timePart}`;
  })();

  const getModeText = () => {
    if (req?.isOnline === true && req?.supportsInPerson === true) {
      return "Online & in person";
    }
    if (req?.supportsInPerson === true && req?.isOnline === false) {
      return "In person";
    }
    return "Online";
  };

  const handleMessageCreator = async () => {
    if (!req?.user?._id) {
      toast.error("User information not available");
      return;
    }

    if (!userInfo?._id) {
      toast.info("Please log in to send a message.");
      navigate("/login");
      return;
    }

    if (userInfo?._id === req.user._id) {
      toast.info("You cannot message yourself.");
      return;
    }

    try {
      const data = await dispatch(startChat({ targetUserId: req.user._id })).unwrap();
      const roomId = data?.room?._id;

      if (!roomId) {
        toast.error("Could not start the chat. Please try again.");
        return;
      }

      toast.success("Chat ready.");
      navigate(`/chat/${roomId}`);
    } catch (error) {
      const message = typeof error === "string" ? error : "Failed to start chat.";
      toast.error(message);
    }
  };

  return (
    <div className="bg-[#F7F7F7] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5">
      {/* 1. Profile Pic with Name & Date/Time in front of it */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 shrink-0">
          <img
            src={
              req?.user?.image?.url ||
              "https://i.ibb.co/tpV3m2GW/no-image.png"
            }
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            alt="profile-img"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {req?.user?.name || "unknown"}
          </span>
          <span className="text-xs text-gray-500">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* 2. Small bubbles / pills */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm">
        <span className="px-2.5 sm:px-3 py-1 rounded-full bg-white border border-gray-200 font-medium text-gray-900">
          ${req?.price}
        </span>
        <span className="px-2.5 sm:px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
          {getModeText()}
        </span>
        {req?.location && (
          <span className="px-2.5 sm:px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
            {req.location}
          </span>
        )}
        {req?.category && (
          <span className="px-2.5 sm:px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
            {req.category}
          </span>
        )}
      </div>

      {/* 3. Images */}
      {req?.images?.length > 0 && (
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1">
          {req.images.slice(0, 3).map((img, index) => (
            <img
              key={img.public_id || img.url || index}
              src={getOptimizedUrl(img.url, 256)}
              alt={`request-img-${index}`}
              loading="lazy"
              decoding="async"
              className="w-28 sm:w-36 md:w-44 h-28 sm:h-36 md:h-44 rounded-2xl object-cover bg-gray-200 shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ))}
        </div>
      )}

      {/* 4. Details: Title & Description */}
      <div>
        <h2 className="text-sm sm:text-base font-semibold text-gray-900">{req.title}</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
          {req?.description
            ? req.description.split(/\r?\n/).map((line, idx) => (
                <React.Fragment key={idx}>
                  {line}
                  <br />
                </React.Fragment>
              ))
            : "No description available."}
        </p>
      </div>

          {/* Footer */}
          {userInfo?.role === "teacher" ? (
            <div className="flex flex-wrap items-center justify-start gap-2 pt-2 sm:pt-3">
              <button 
                onClick={handleMessageCreator}
                disabled={startChatLoading}
                className="bg-[#E9EAEE] text-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm hover:bg-gray-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {startChatLoading ? "Starting..." : "Message"}
              </button>

              <button
                onClick={() =>
                  onSendExistingLesson && onSendExistingLesson(req)
                }
                className="bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center gap-2 text-xs sm:text-sm hover:bg-black/90 transition-colors whitespace-nowrap cursor-pointer"
              >
                Send an existing lesson proposal <BiSolidZap className="w-3 sm:w-4 h-3 sm:h-4" />
              </button>

              <button
                onClick={() => onCreateLesson && onCreateLesson(req)}
                className="bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center gap-2 text-xs sm:text-sm hover:bg-black/90 transition-colors whitespace-nowrap cursor-pointer"
              >
                Create and send a new lesson proposal <Plus className="w-3 sm:w-4 h-3 sm:h-4" />
              </button>

              <button
                onClick={() => onSave(req?._id)}
                disabled={isLoading}
                className="bg-[#E9EAEE] hover:bg-gray-200 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    {isFavorite ? "Saved" : "Save"}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-start gap-2 pt-2 sm:pt-3">
              <button 
                onClick={handleMessageCreator}
                disabled={startChatLoading}
                className="bg-[#E9EAEE] text-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm hover:bg-gray-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {startChatLoading ? "Starting..." : "Message"}
              </button>
              <button
                onClick={() => onSave(req?._id)}
                disabled={isLoading}
                className="bg-[#E9EAEE] hover:bg-gray-200 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    {isFavorite ? "Saved" : "Save"}
                  </>
                )}
              </button>
            </div>
          )}
    </div>
  );
});

export default RequestCard;
