import { toast } from "react-toastify";
import { preloadRoute } from "./routePreloader";

/**
 * Navigate to chat with zero perceived latency (0ms).
 * If a room between the current user and the target user already exists in Redux state,
 * it immediately routes to `/chat/${roomId}`.
 * Otherwise, it navigates immediately to `/chat?targetUserId=${targetUserId}`
 * where Chat renders a skeleton loader while initializing the room in background.
 */
export const navigateToChat = ({ navigate, targetUserId, userInfo, rooms = [] }) => {
  if (!userInfo?._id) {
    toast.info("Please log in to send a message.");
    navigate("/login");
    return;
  }

  if (!targetUserId) {
    toast.error("User information not available");
    return;
  }

  const targetIdStr = String(targetUserId);
  const myIdStr = String(userInfo._id);

  if (myIdStr === targetIdStr) {
    toast.info("This is your profile.");
    return;
  }

  // Preload chat chunk so it resolves in 0ms
  preloadRoute("chat");

  // Check if room already exists in memory
  const existingRoom = rooms?.find((r) => {
    const tId = String(r.teacher?._id || r.teacher || "");
    const sId = String(r.student?._id || r.student || "");
    return (
      (tId === targetIdStr && sId === myIdStr) ||
      (tId === myIdStr && sId === targetIdStr)
    );
  });

  if (existingRoom?._id) {
    navigate(`/chat/${existingRoom._id}`);
  } else {
    navigate(`/chat?targetUserId=${targetIdStr}`);
  }
};
