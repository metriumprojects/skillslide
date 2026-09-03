import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import MainLayout from "../../components/MainLayout";
import Sidebar from "./components/Sidebar";
import { socketHost } from "../../redux/api";
import {
  appendIncomingMessage,
  fetchChatConnections,
  fetchChatMessages,
  markRoomRead,
  sendChatMessage,
  updateChatMessage,
} from "../../redux/reducers/ChatReducer";
import { useCurrency } from "../../currency/CurrencyContext";
import {
  Image as ImageIcon,
  MessageCircleMore,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { IoSendSharp } from "react-icons/io5";

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeId = (entity) => {
  if (!entity) return "";
  if (typeof entity === "string") return entity;
  return entity._id || entity.id || "";
};

const getRoomPeer = (room, currentUserId) => {
  if (!room) return null;
  const me = String(currentUserId || "");

  const student = room.student;
  const teacher = room.teacher;
  const studentId = normalizeId(student);
  const teacherId = normalizeId(teacher);

  if (studentId && studentId === me) {
    return teacher || null;
  }

  if (teacherId && teacherId === me) {
    return student || null;
  }

  return teacher || student || null;
};

const extractLessonData = (message) => {
  if (!message) return null;

  if (message.lesson && typeof message.lesson === "object") {
    return {
      id: message.lesson._id,
      title: message.lesson.title,
      price: message.lesson.price,
      duration: message.lesson.duration,
      image: message.lesson.images?.[0]?.url,
    };
  }

  if (message.lessonSnapshot) {
    return {
      id: message.lesson || message.lessonSnapshot.lessonId,
      title: message.lessonSnapshot.title,
      price: message.lessonSnapshot.price,
      duration: message.lessonSnapshot.duration,
      image: message.lessonSnapshot.image,
    };
  }

  return null;
};

export default function Chat() {
  const { formatPrice } = useCurrency();
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const {
    rooms,
    roomsLoading,
    roomsError,
    messagesByRoom,
    messagesLoading,
    messagesError,
    messagesRoomId,
    sendMessageLoading,
  } = useSelector((state) => state.chat);
  const viewerRole = userInfo?.role || "";
  const viewerId = userInfo?._id || "";

  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const socketRef = useRef(null);
  const activeRoomRef = useRef(roomId);
  const viewerIdRef = useRef(viewerId);
  const chatScrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    activeRoomRef.current = roomId;
    setShowMobileSidebar(!roomId);
  }, [roomId]);

  useEffect(() => {
    viewerIdRef.current = viewerId;
  }, [viewerId]);

  useEffect(() => {
    if (!userInfo?._id) return;
    dispatch(fetchChatConnections());
  }, [dispatch, userInfo?._id]);

  useEffect(() => {
    if (!roomId || !userInfo?._id) return;
    dispatch(fetchChatMessages({ roomId }));
  }, [dispatch, roomId, userInfo?._id]);

  useEffect(() => {
    const socketInstance = io(socketHost, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current = socketInstance;

    const handleReceiveMessage = (incoming) => {
      dispatch(
        appendIncomingMessage({
          roomId: incoming.roomId,
          message: incoming,
          viewerId: viewerIdRef.current,
        })
      );

      if (incoming.roomId === activeRoomRef.current && viewerIdRef.current) {
        socketInstance.emit("markRead", {
          roomId: incoming.roomId,
          userId: viewerIdRef.current,
        });
        dispatch(markRoomRead(incoming.roomId));
      }
    };

    const handleMessagesRead = ({ roomId: readRoomId }) => {
      dispatch(markRoomRead(readRoomId));
    };

    const handleMessageUpdated = (updatedMessage) => {
      dispatch(updateChatMessage(updatedMessage));
    };

    socketInstance.on("receiveMessage", handleReceiveMessage);
    socketInstance.on("messagesRead", handleMessagesRead);
    socketInstance.on("messageUpdated", handleMessageUpdated);

    return () => {
      socketInstance.off("receiveMessage", handleReceiveMessage);
      socketInstance.off("messagesRead", handleMessagesRead);
      socketInstance.off("messageUpdated", handleMessageUpdated);
      socketInstance.disconnect();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!roomId || !socketRef.current || !viewerIdRef.current) return;
    socketRef.current.emit("joinRoom", roomId);
    socketRef.current.emit("markRead", {
      roomId,
      userId: viewerIdRef.current,
    });
    dispatch(markRoomRead(roomId));
  }, [dispatch, roomId]);

  const messages = roomId ? messagesByRoom[roomId] || [] : [];
  const isMessagesLoading = messagesLoading && messagesRoomId === roomId;
  const currentError =
    roomsError || (messagesRoomId === roomId ? messagesError : null);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages]);

  const activeRoom = useMemo(
    () => rooms.find((room) => room._id === roomId),
    [rooms, roomId]
  );

  const activePeer = useMemo(
    () => getRoomPeer(activeRoom, viewerId),
    [activeRoom, viewerId]
  );

  const sendDisabled =
    !roomId ||
    (!message.trim() && !selectedImage) ||
    (Boolean(selectedImage) && sendMessageLoading);

  const handleLessonNavigate = (lessonId) => {
    if (!lessonId) return;
    navigate(`/lesson-booking/${lessonId}`);
  };

  useEffect(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (!roomId) {
      setMessage("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [roomId]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!roomId) return;

    const trimmed = message.trim();

    if (selectedImage) {
      try {
        await dispatch(
          sendChatMessage({
            roomId,
            message: trimmed || undefined,
            image: selectedImage,
          })
        ).unwrap();
        setMessage("");
        handleRemoveImage();
      } catch (error) {
        const errMessage =
          typeof error === "string"
            ? error
            : error?.message || "Failed to send message.";
        toast.error(errMessage);
      }
      return;
    }

    if (!trimmed || !socketRef.current || !viewerIdRef.current) {
      return;
    }

    socketRef.current.emit("sendMessage", {
      roomId,
      userId: viewerIdRef.current,
      message: trimmed,
    });
    setMessage("");
  };

  const activePeerName =
    activePeer?.name || activePeer?.email || "Conversation";
  const activePeerAvatar =
    activePeer?.image?.url ||
    activePeer?.avatar ||
    `https://i.ibb.co/JFFpmtfn/user-icon-image-13.png`;

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

  return (
    <MainLayout width="100%">
      <div className="flex md:h-full border-2 border-gray-300 overflow-hidden shadow-lg bg-white h-[88vh] relative my-10">
        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Sidebar - Desktop and Mobile */}
        <div className={`h-screen md:h-[90vh]
          fixed md:static inset-y-0 left-0 z-50
          w-full md:w-1/3 lg:w-1/4
          transform transition-transform duration-300 ease-in-out
          md:transform-none md:border-r-2 border-gray-300 bg-white
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar
            rooms={rooms}
            loading={roomsLoading && rooms.length === 0}
            activeRoomId={roomId}
            viewerRole={viewerRole}
            currentUserId={viewerId}
          />
        </div>

        <div className="flex-1 flex flex-col h-[85vh] md:h-[90vh] w-full">
          {currentError && (
            <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-200">
              {currentError}
            </div>
          )}

          {!roomId || !activeRoom ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3.5 font-semibold text-xl text-center p-6">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden absolute top-4 left-4 p-2 bg-primary text-white rounded-lg shadow-lg hover:bg-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <MessageCircleMore className="text-primary" size={80} />
              <span className="text-gray-800">Pick up where you left off</span>
              <p className="text-gray-500 font-medium text-base">
                Select one of your conversations to continue.
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b-2 border-gray-300 flex items-center gap-3 bg-white shadow-sm">
                <button
                  className="md:hidden text-gray-600 p-2 hover:bg-gray-100 rounded-lg -ml-2"
                  onClick={() => setShowMobileSidebar(true)}
                  aria-label="Open conversations"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <img
                  src={activePeerAvatar}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                  alt={activePeerName}
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <h2 className="text-base md:text-lg font-semibold truncate">{activePeerName}</h2>
                  {activeRoom?.curriculum?.title && (
                    <span className="text-xs text-gray-500 truncate">
                      {activeRoom.curriculum.title}
                    </span>
                  )}
                </div>
              </div>

              <div
                ref={chatScrollRef}
                className="flex-1 space-y-3 p-4 overflow-y-auto bg-gray-50"
              >
                {isMessagesLoading ? (
                  <div className="text-center text-gray-500 py-4 text-sm">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-4 text-sm">
                    Say hello to start the conversation.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const senderId =
                      msg?.userId?._id || msg?.userId || msg?.user?._id;
                    const isMine =
                      viewerIdRef.current &&
                      senderId &&
                      String(senderId) === String(viewerIdRef.current);
                    const lessonData = extractLessonData(msg);

                    return (
                      <div
                        key={msg._id || msg.createdAt}
                        className={`w-full flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[75%] lg:max-w-[65%] rounded-2xl px-3 py-2 md:px-3 md:py-3 shadow-sm ${
                            isMine
                              ? "bg-primary text-white rounded-br-sm"
                              : "bg-white text-gray-900 rounded-bl-sm"
                          }`}
                        >
                          {msg.image && (
                            <img
                              src={msg.image.url || msg.image}
                              alt="Shared image"
                              className="rounded-lg max-w-full max-h-64 mb-2 cursor-pointer"
                              onClick={() =>
                                window.open(
                                  msg.image.url || msg.image,
                                  "_blank"
                                )
                              }
                            />
                          )}



                          {lessonData && (
                            <div className="bg-white text-gray-900 rounded-xl p-2 md:p-3 border border-gray-200 mb-2 shadow-sm">
                              <div className="flex gap-2 md:gap-3">
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                  <img
                                    src={
                                      lessonData.image ||
                                      "https://i.ibb.co/JFFpmtfn/user-icon-image-13.png"
                                    }
                                    alt={lessonData.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="space-y-0.5 md:space-y-1 flex-1 min-w-0">
                                  <p className="font-semibold text-xs md:text-sm line-clamp-2">
                                    {lessonData.title}
                                  </p>
                                  {lessonData.price !== undefined && (
                                    <p className="text-xs md:text-sm text-gray-600 font-medium">
                                      {formatPrice(lessonData.price)}
                                    </p>
                                  )}
                                  {lessonData.duration && (
                                    <p className="text-[10px] md:text-xs text-gray-500">
                                      Duration: {lessonData.duration}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleLessonNavigate(lessonData.id)}
                                className="mt-2 md:mt-3 w-full bg-primary text-white text-xs md:text-sm font-medium py-1.5 md:py-2 rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Book Lesson
                              </button>
                            </div>
                          )}

                          {msg.message && (
                            <div className="text-sm whitespace-pre-line">
                              {msg.message}
                            </div>
                          )}
                          <div className="mt-1 text-[11px] opacity-80 text-right">
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 md:p-4 border-t-2 border-gray-300 bg-white">
                {imagePreview && (
                  <div className="mb-2 relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 md:gap-3">
                  <label className="cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors">
                    <ImageIcon size={20} className="text-gray-600 md:w-6 md:h-6" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={!roomId || sendMessageLoading}
                      ref={fileInputRef}
                    />
                  </label>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={message}
                      disabled={!roomId || sendMessageLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !sendDisabled) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full border border-gray-300 rounded-full px-4 py-2 md:py-2.5 pr-12 focus:outline-none focus:border-primary disabled:bg-gray-100 text-sm md:text-base"
                    />

                    <button
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 disabled:opacity-50 hover:scale-110 transition-transform"
                      onClick={handleSend}
                      disabled={sendDisabled}
                      aria-label="Send message"
                    >
                      <IoSendSharp size={18} className="text-primary md:w-5 md:h-5" />
                    </button>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
