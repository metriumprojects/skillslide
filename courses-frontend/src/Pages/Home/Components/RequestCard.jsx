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
    if (!req?.updatedAt) return "Date not available";
    const date = new Date(req.updatedAt);
    if (Number.isNaN(date.getTime())) return "Date not available";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
    <div className="bg-[#F7F7F7] rounded-2xl p-3 sm:p-4 md:p-5">
      <div className="flex flex-col md:flex-row gap-3 md:gap-5">
        {/* Images */}
        {req?.images?.length > 0 ? (
          <div className="flex gap-2 sm:gap-3 shrink-0 h-fit overflow-x-auto md:overflow-visible">
            {req?.images.slice(0, 3).map((img, index) => (
              <img
                key={img.public_id || img.url || index}
                src={getOptimizedUrl(img.url, 256)}
                alt={`request-img-${index}`}
                loading="lazy"
                decoding="async"
                className="w-24 sm:w-32 md:w-48 h-24 sm:h-32 md:h-48 rounded-2xl object-cover bg-gray-200 shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ))}
          </div>
        ) : (
          <div className="w-24 sm:w-32 md:w-48 h-24 sm:h-32 md:h-48 rounded-2xl bg-gray-200 shrink-0" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <p className="text-xs sm:text-sm text-gray-600">{formattedDate}</p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                {req?.user?.name || "unknown"}
              </span>
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded overflow-hidden bg-gray-300 shrink-0">
                <img
                  src={
                    req?.user?.image?.url ||
                    "https://i.ibb.co/tpV3m2GW/no-image.png"
                  }
                  loading="lazy"
                  className="h-full w-full object-cover"
                  alt="profile-img"
                />
              </div>
            </div>
          </div>

          <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <span className="px-2 sm:px-3 py-1 rounded-full bg-white border border-gray-200 font-medium text-gray-900">
              ${req?.price}
            </span>
            <span className="px-2 sm:px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
              {getModeText()}
            </span>
            {req?.location && (
              <span className="px-2 sm:px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                {req.location}
              </span>
            )}
            {req?.category && (
              <span className="px-2 sm:px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                {req.category}
              </span>
            )}
          </div>

          <div className="mt-2 sm:mt-3">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-900">{req.title}</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
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
          {userInfo?.role === "teacher" && (
            <div className="flex justify-between items-center pt-2 sm:pt-3">
              {openPropose === req._id ? (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => onCreateLesson && onCreateLesson(req)}
                    className="bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center gap-2 text-xs sm:text-sm hover:bg-black/90 transition-colors whitespace-nowrap"
                  >
                    Create New <Plus className="w-3 sm:w-4 h-3 sm:h-4" />
                  </button>

                  <button
                    onClick={() =>
                      onSendExistingLesson && onSendExistingLesson(req)
                    }
                    className="bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center gap-2 text-xs sm:text-sm hover:bg-black/90 transition-colors whitespace-nowrap"
                  >
                    Send Existing <BiSolidZap className="w-3 sm:w-4 h-3 sm:h-4" />
                  </button>

                  <button
                    className="bg-red-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm hover:bg-red-600 transition-colors"
                    onClick={() => setOpenPropose(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={handleMessageCreator}
                    disabled={startChatLoading}
                    className="flex-1 sm:flex-none bg-[#E9EAEE] text-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm  transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {startChatLoading ? "Starting..." : "Message"}
                  </button>
                  <button
                    onClick={() => setOpenPropose(req._id)}
                    className="flex-1 sm:flex-none bg-[#E9EAEE] text-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center justify-center space-x-1 text-xs sm:text-sm  transition-colors"
                  >
                    <span>Propose</span>
                  </button>
                </div>
              )}
              
              <button
                onClick={() => onSave(req?._id)}
                disabled={isLoading}
                className=" bg-[#E9EAEE] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md flex items-center gap-1.5 whitespace-nowrap  transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
});

export default RequestCard;
