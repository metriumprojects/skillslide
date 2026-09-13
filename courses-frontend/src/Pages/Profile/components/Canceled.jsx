import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { userCancelBookings } from "../../../redux/reducers/BookingReducer";
import { startChat } from "../../../redux/reducers/ChatReducer";
import moment from "moment-timezone";
import { toast } from "react-toastify";
import { useCurrency } from "../../../currency/CurrencyContext";

export default function Canceled() {
  const { formatPrice } = useCurrency();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { userCanceldata, loadingStates } = useSelector((state) => state.book);
  const { startChatLoading } = useSelector((state) => state.chat);

  // Pagination states
  const [canceledPage, setCanceledPage] = useState(1);
  const [canceledLimit] = useState(10);
  const [canceledTotal, setCanceledTotal] = useState(0);

  useEffect(() => {
    dispatch(userCancelBookings({ page: canceledPage, limit: canceledLimit })).then((response) => {
      if (response?.payload?.total) {
        setCanceledTotal(response.payload.total);
      }
    });
  }, [dispatch, canceledPage, canceledLimit]);

  const getTimeDisplay = (utcTimeString) => {
    if (!utcTimeString) return { date: "-", time: "-" };
    try {
      const localTime = moment.utc(utcTimeString).local();
      return {
        date: localTime.format("MM/DD/YY"),
        time: localTime.format("h:mmA") + " " + moment.tz(moment.tz.guess()).zoneAbbr(),
      };
    } catch (error) {
      return { date: "-", time: "-" };
    }
  };

  const handleMessageTeacher = async (lesson) => {
    const teacherId = lesson.userId || lesson.teacher?._id;
    if (!teacherId) {
      toast.error("Teacher information not available");
      return;
    }

    if (!userInfo?._id) {
      toast.info("Please log in to send a message.");
      navigate("/login");
      return;
    }

    if (userInfo?._id === teacherId) {
      toast.info("You cannot message yourself.");
      return;
    }

    try {
      const data = await dispatch(startChat({ targetUserId: teacherId })).unwrap();
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

  const handleRebook = (lesson) => {
    if (lesson.type === "curriculum" && lesson.curriculumId) {
      navigate(`/curriculum-booking/${lesson.curriculumId}`);
    } else if (lesson.lId) {
      navigate(`/lesson-booking/${lesson.lId}`);
    } else if (lesson.curriculum?._id) {
      navigate(`/curriculum-booking/${lesson.curriculum._id}`);
    } else if (lesson.lesson?._id) {
      navigate(`/lesson-booking/${lesson.lesson._id}`);
    } else {
      toast.info("Booking details not found for re-booking");
    }
  };

  const canceledTotalPages = Math.ceil(canceledTotal / canceledLimit) || 1;
  const lessonsList = Array.isArray(userCanceldata) ? userCanceldata : [];

  return (
    <div className="w-full mt-6">
      {/* Pagination Controls */}
      {canceledTotalPages > 1 && (
        <div className="flex justify-end items-center mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCanceledPage((prev) => Math.max(1, prev - 1))}
              disabled={canceledPage === 1}
              className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaChevronLeft />
            </button>
            <span className="text-sm">
              Page {canceledPage} of {canceledTotalPages}
            </span>
            <button
              onClick={() => setCanceledPage((prev) => Math.min(canceledTotalPages, prev + 1))}
              disabled={canceledPage === canceledTotalPages}
              className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Canceled Lessons Table matching StudentDashboard */}
      <div className="overflow-x-auto rounded-2xl mb-10">
        <table className="w-full rounded-2xl overflow-hidden">
          <thead className="bg-[#E9EAEE] text-left text-sm">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Hour</th>
              <th className="p-3">Curriculum</th>
              <th className="p-3">Lesson</th>
              <th className="p-3">Teacher</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {lessonsList.length > 0 ? (
              lessonsList.map((lesson, index) => {
                const dateToDisplay = lesson.cancelledAt || lesson.scheduledAt || lesson.updatedAt;
                const timeDisplay = getTimeDisplay(dateToDisplay);
                const curriculumTitle =
                  lesson.curriculumTitle ||
                  (lesson.curriculum?.title ? lesson.curriculum.title : "-");
                const lessonTitle =
                  lesson.lessonTitle ||
                  lesson.lesson?.title ||
                  (lesson.type === "curriculum" ? "-" : "Lesson");
                const teacherName =
                  lesson.name ||
                  lesson.teacher?.name ||
                  "Unknown Teacher";
                const amount = lesson.amount ?? lesson.lesson?.price ?? lesson.curriculum?.price ?? 0;
                const currency = lesson.currency || lesson.lesson?.currency || lesson.curriculum?.currency || "USD";
                const isRefunded = lesson.isRefunded || lesson.paymentStatus === "cancelled";

                return (
                  <tr key={lesson._id || index} className="bg-[#F5F5F5]">
                    <td className="p-3">
                      <div>{timeDisplay.date}</div>
                      {lesson.scheduledAt && lesson.cancelledAt && (
                        <div className="text-[11px] text-gray-500">
                          Scheduled: {getTimeDisplay(lesson.scheduledAt).date}
                        </div>
                      )}
                    </td>
                    <td className="p-3">{timeDisplay.time}</td>
                    <td className="p-3 font-medium">{curriculumTitle}</td>
                    <td className="p-3">{lessonTitle}</td>
                    <td className="p-3">{teacherName}</td>
                    <td className="p-3">{formatPrice(amount, currency)}</td>
                    <td className="p-3">
                      <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-medium inline-block">
                        {isRefunded ? "Refunded" : "Canceled"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleMessageTeacher(lesson)}
                          disabled={startChatLoading}
                          className="bg-[#E9EAEE] hover:bg-gray-300 text-black px-4 py-2 rounded-full text-sm transition-colors disabled:opacity-60 cursor-pointer"
                        >
                          {startChatLoading ? "Starting..." : "Message"}
                        </button>
                        <button
                          onClick={() => handleRebook(lesson)}
                          className="bg-[#E9EAEE] hover:bg-gray-300 text-black px-4 py-2 rounded-full text-sm transition-colors cursor-pointer"
                        >
                          Book Again
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500 bg-[#F5F5F5]">
                  No canceled lessons yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}