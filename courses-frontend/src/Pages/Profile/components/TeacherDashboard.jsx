import React, { useState, useEffect } from "react";
import { FaUser, FaChartLine, FaClock, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CancelBooking, CompleteLessons, teacherMainUpcomingBookings, teacherPastLessons } from "../../../redux/reducers/BookingReducer";
import ReviewModal from "./ReviewModal";
import moment from "moment-timezone";
import { toast } from "react-toastify";
import { useCurrency } from "../../../currency/CurrencyContext";
import ButtonSpinner from "../../../components/ButtonSpinner";
import { navigateToChat } from "../../../utils/chatNavigation";
import { preloadRoute } from "../../../utils/routePreloader";

export default function LessonsDashboard() {
  const { formatPrice } = useCurrency();
  const [openReview, setOpenReview] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // New state for tab management
  const [completingId, setCompletingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Pagination states for upcoming lessons
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingLimit] = useState(10);
  const [upcomingTotal, setUpcomingTotal] = useState(0);
  
  // Pagination states for past lessons
  const [pastPage, setPastPage] = useState(1);
  const [pastLimit] = useState(10);
  const [pastTotal, setPastTotal] = useState(0);

  // Pagination states for canceled lessons
  const [canceledPage, setCanceledPage] = useState(1);
  const [canceledLimit] = useState(10);
  const [canceledTotal, setCanceledTotal] = useState(0);

  // Get data from Redux store
  const { 
    teacherMainUpcomingData, 
    teacherPastLessonsData,
    teacherCanceledLessonsData = [], // Add canceled lessons data
    loadingStates 
  } = useSelector((state) => state.book);
  const { userInfo } = useSelector((state) => state.auth);
  const { rooms } = useSelector((state) => state.chat);

  // Fetch data on component mount
  useEffect(() => {
    const now = new Date();
    const pad = (n) => (n < 10 ? '0' + n : n);

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    const scheduledAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Fetch upcoming lessons with pagination
    dispatch(teacherMainUpcomingBookings({ 
      scheduledAt, 
      timezone,
      page: upcomingPage,
      limit: upcomingLimit 
    })).then((response) => {
      // Assuming your API response has total count
      if (response?.payload?.total) {
        setUpcomingTotal(response.payload.total);
      }
    });
    
    // Fetch past lessons with pagination
    dispatch(teacherPastLessons({ 
      scheduledAt, 
      timezone,
      page: pastPage,
      limit: pastLimit 
    })).then((response) => {
      // Assuming your API response has total count
      if (response?.payload?.total) {
        setPastTotal(response.payload.total);
      }
    });

    // TODO: Add API call for canceled lessons when available
    // dispatch(teacherCanceledLessons({ 
    //   scheduledAt, 
    //   timezone,
    //   page: canceledPage,
    //   limit: canceledLimit 
    // })).then((response) => {
    //   if (response?.payload?.total) {
    //     setCanceledTotal(response.payload.total);
    //   }
    // });
  }, [dispatch, upcomingPage, upcomingLimit, pastPage, pastLimit, canceledPage, canceledLimit]);



  // Function to get time in specific format for display
  const getTimeDisplay = (utcTimeString) => {
    if (!utcTimeString) return { date: "Not scheduled", time: "" };
    
    try {
      const localTime = moment.utc(utcTimeString).local();
      return {
        date: localTime.format("MM/DD/YY"), // e.g., "12/02/25"
        time: localTime.format("h:mmA") + " " + moment.tz(moment.tz.guess()).zoneAbbr(), // e.g., "2:00PM EST"
      };
    } catch (error) {
      return { date: "Invalid date", time: "" };
    }
  };

  // Get next lesson from upcoming data (first item)
  const nextLesson = teacherMainUpcomingData && teacherMainUpcomingData.length > 0 
    ? [teacherMainUpcomingData[0]] 
    : [];

  // Get upcoming lessons excluding the first one (for upcoming table)
  const upcomingLessons = teacherMainUpcomingData && teacherMainUpcomingData.length > 1 
    ? teacherMainUpcomingData.slice(0)
    : [];

  const handleCancel = (lesson) => {
    if(lesson){
      const isCurriculum =
        lesson?.type === "curriculum" ||
        !!lesson?.curriculumTitle ||
        lesson?.isCurriculum === true;
      const confirmText = isCurriculum
        ? "Are you sure you want to cancel this entire curriculum? Any remaining sessions will be refunded to the student."
        : "Are you sure you want to cancel this lesson?";

      if (window.confirm && !window.confirm(confirmText)) {
        return;
      }

      const idKey = lesson.bookingId || lesson._id;
      setCancellingId(idKey);
      dispatch(
        CancelBooking({
          bookId: lesson?.bookingId,
          type: isCurriculum ? "curriculum" : lesson?.type,
          lId: isCurriculum ? undefined : lesson?.lId,
          cancelEntireCurriculum: isCurriculum,
        })
      ).then((res) => {
        if (res?.payload.status) {
          toast.success(res?.payload?.message);
          // Refresh data after successful cancellation
          const now = new Date();
          const scheduledAt = now.toISOString().slice(0, 16);
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          // Refresh both tables with current pagination
          dispatch(teacherMainUpcomingBookings({ 
            scheduledAt, 
            timezone,
            page: upcomingPage,
            limit: upcomingLimit 
          }));
          
          dispatch(teacherPastLessons({ 
            scheduledAt, 
            timezone,
            page: pastPage,
            limit: pastLimit 
          }));
        } else {
          toast.error(res?.payload);
        }
      }).finally(() => {
        setCancellingId(null);
      });
    }
  };

  const handleComplete = (lesson) => {
    if(lesson){
      const idKey = lesson.bookingId || lesson._id;
      setCompletingId(idKey);
      dispatch(CompleteLessons({bookId:lesson?.bookingId, type:lesson?.type, lId:lesson?.lId})).then((res) => {
        if (res?.payload.status) {
          toast.success(res?.payload?.message);
          // Refresh data
          const now = new Date();
          const scheduledAt = now.toISOString().slice(0, 16);
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          // Refresh both tables with current pagination
          dispatch(teacherMainUpcomingBookings({ 
            scheduledAt, 
            timezone,
            page: upcomingPage,
            limit: upcomingLimit 
          }));
          
          dispatch(teacherPastLessons({ 
            scheduledAt, 
            timezone,
            page: pastPage,
            limit: pastLimit 
          }));
        } else {
          toast.error(res?.payload?.message || "Error completing lesson");
        }
      }).finally(() => {
        setCompletingId(null);
      });
    }
  };

  const handleReview = (lesson) => {
    setSelectedLesson(lesson);
    setOpenReview(true);
  };

  const handleMessageStudent = (lesson) => {
    if (!lesson) {
      toast.error("Lesson information not available");
      return;
    }

    const studentId = lesson.userId;
    if (!studentId) {
      toast.error("Student information not available");
      return;
    }

    navigateToChat({
      navigate,
      targetUserId: studentId,
      userInfo,
      rooms,
    });
  };


  // Calculate total pages for pagination
  const upcomingTotalPages = Math.ceil(upcomingTotal / upcomingLimit);
  const pastTotalPages = Math.ceil(pastTotal / pastLimit);
  const canceledTotalPages = Math.ceil(canceledTotal / canceledLimit);

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex gap-6 justify-start text-sm sm:text-base font-medium mt-[32px] mb-[32px] overflow-x-auto hide-scrollbar">
        <button 
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'upcoming' 
              ? "border-b-2 border-black text-black font-semibold"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Upcoming Lessons
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('past')}
          className={`pb-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'past' 
              ? "border-b-2 border-black text-black font-semibold"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Past Lessons
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('canceled')}
          className={`pb-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'canceled' 
              ? "border-b-2 border-black text-black font-semibold"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Canceled Lessons
        </button>
      </div>


      {/* ✅ Upcoming Lessons Tab */}
      {activeTab === 'upcoming' && (
        <>
          {upcomingTotalPages > 1 && (
            <div className="flex justify-end items-center mb-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUpcomingPage(prev => Math.max(1, prev - 1))}
                  disabled={upcomingPage === 1}
                  className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronLeft />
                </button>
                <span className="text-sm">
                  Page {upcomingPage} of {upcomingTotalPages}
                </span>
                <button
                  onClick={() => setUpcomingPage(prev => Math.min(upcomingTotalPages, prev + 1))}
                  disabled={upcomingPage === upcomingTotalPages}
                  className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto rounded-2xl mb-10">
            <table className="w-full rounded-2xl overflow-hidden">
              <thead className="bg-[#E9EAEE] text-left text-sm">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Hour</th>
                  <th className="p-3">Curriculum</th>
                  <th className="p-3">Lesson</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {teacherMainUpcomingData.length > 0 ? (
                  teacherMainUpcomingData.map((lesson, index) => {
                    const timeDisplay = getTimeDisplay(lesson.scheduledAt);
                    const isCurriculum =
                      lesson.type === "curriculum" ||
                      !!lesson.curriculumTitle ||
                      lesson.isCurriculum === true;
                    return (
                      <tr key={index} className="bg-[#F5F5F5]">
                        <td className="p-3">{timeDisplay.date}</td>
                        <td className="p-3">{timeDisplay.time}</td>
                        <td className="p-3 font-medium">
                          {lesson.curriculumTitle || "-"}
                        </td>
                        <td className="p-3">
                          {lesson.lessonTitle || "-"}
                        </td>
                        <td className="p-3">{lesson.name || "Unknown Student"}</td>
                        <td className="p-3">{formatPrice(lesson.amount, lesson.currency || "USD")}</td>
                        <td className="p-3">
                          <span className="bg-primary text-white px-4 py-2 rounded font-medium">
                            Upcoming
                          </span>
                        </td>
                        <td className="p-3 flex flex-wrap gap-3">
                          <button 
                            onClick={() => handleMessageStudent(lesson)}
                            onMouseEnter={() => preloadRoute("chat")}
                            onTouchStart={() => preloadRoute("chat")}
                            className="bg-[#E9EAEE] text-black px-4 py-2 rounded-full transition-colors cursor-pointer"
                          >
                            Message Student
                          </button>
                          <button 
                            onClick={() => handleCancel(lesson)}
                            disabled={cancellingId === (lesson.bookingId || lesson._id)}
                            className="inline-flex items-center gap-1.5 bg-[#E9EAEE] text-black px-4 py-2 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingId === (lesson.bookingId || lesson._id) && <ButtonSpinner size={14} />}
                            {cancellingId === (lesson.bookingId || lesson._id) ? "Cancelling..." : isCurriculum ? "Cancel curriculum" : "Cancel lesson"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="p-3 text-center text-gray-500 bg-[#F5F5F5]">
                      No upcoming lessons
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ✅ Past Lessons Tab */}
      {activeTab === 'past' && (
        <>
          {pastTotalPages > 1 && (
            <div className="flex justify-end items-center mb-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPastPage(prev => Math.max(1, prev - 1))}
                  disabled={pastPage === 1}
                  className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronLeft />
                </button>
                <span className="text-sm">
                  Page {pastPage} of {pastTotalPages}
                </span>
                <button
                  onClick={() => setPastPage(prev => Math.min(pastTotalPages, prev + 1))}
                  disabled={pastPage === pastTotalPages}
                  className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto rounded-2xl mb-10">
            <table className="w-full rounded-2xl overflow-hidden">
              <thead className="bg-[#E9EAEE] text-left text-sm">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Hour</th>
                  <th className="p-3">Lesson</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {teacherPastLessonsData && teacherPastLessonsData.length > 0 ? (
                  teacherPastLessonsData.map((lesson, index) => {
                    const timeDisplay = getTimeDisplay(lesson.scheduledAt);
                    return (
                      <tr key={index} className="bg-[#F5F5F5]">
                        <td className="p-3">{timeDisplay.date}</td>
                        <td className="p-3">{timeDisplay.time}</td>
                        <td className="p-3">{lesson.lessonTitle}</td>
                        <td className="p-3">{lesson.name || "Unknown Student"}</td>
                        <td className="p-3">{formatPrice(lesson.amount, lesson.currency || "USD")}</td>
                        <td className="p-3">
                          {lesson?.status === "completed" ? (
                            <span className="px-4 py-2 rounded ">
                              Completed
                            </span>
                          ) : (
                            <span className="text-black px-4 py-2 rounded ">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {lesson?.status !== "completed" ? (
                            <div className="flex flex-wrap gap-3">
                              <button 
                                onClick={() => handleMessageStudent(lesson)}
                                onMouseEnter={() => preloadRoute("chat")}
                                onTouchStart={() => preloadRoute("chat")}
                                className="bg-[#E9EAEE] text-black px-4 py-2 rounded-full transition-colors cursor-pointer"
                              >
                                Message Student
                              </button>
                              <button 
                                onClick={() => handleCancel(lesson)}
                                disabled={cancellingId === (lesson.bookingId || lesson._id)}
                                className="inline-flex items-center gap-1.5 bg-[#E9EAEE] text-black px-4 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {cancellingId === (lesson.bookingId || lesson._id) && <ButtonSpinner size={14} />}
                                {cancellingId === (lesson.bookingId || lesson._id) ? "Cancelling..." : "Cancel lesson"}
                              </button>
                              <button 
                                onClick={() => handleComplete(lesson)}
                                disabled={completingId === (lesson.bookingId || lesson._id)}
                                className="inline-flex items-center gap-1.5 bg-[#E9EAEE] text-black px-4 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {completingId === (lesson.bookingId || lesson._id) && <ButtonSpinner size={14} />}
                                {completingId === (lesson.bookingId || lesson._id) ? "Completing..." : "Mark lesson as complete"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-3">
                              <button 
                                className="bg-[#E9EAEE] text-black px-4 py-2 rounded-full transition-colors"
                              >
                                Completed
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="p-3 text-center text-gray-500 bg-[#F5F5F5]">
                      No past lessons
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ✅ Canceled Lessons Tab */}
      {activeTab === 'canceled' && (
        <>
          {canceledTotalPages > 1 && (
            <div className="flex justify-end items-center mb-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCanceledPage(prev => Math.max(1, prev - 1))}
                  disabled={canceledPage === 1}
                  className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronLeft />
                </button>
                <span className="text-sm">
                  Page {canceledPage} of {canceledTotalPages}
                </span>
                <button
                  onClick={() => setCanceledPage(prev => Math.min(canceledTotalPages, prev + 1))}
                  disabled={canceledPage === canceledTotalPages}
                  className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto rounded-2xl mb-10">
            <table className="w-full rounded-2xl overflow-hidden">
              <thead className="bg-[#E9EAEE] text-left text-sm">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Hour</th>
                  <th className="p-3">Curriculum</th>
                  <th className="p-3">Lesson</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Canceled By</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {teacherCanceledLessonsData && teacherCanceledLessonsData.length > 0 ? (
                  teacherCanceledLessonsData.map((lesson, index) => {
                    const timeDisplay = getTimeDisplay(lesson.scheduledAt);
                    return (
                      <tr key={index} className="bg-[#F5F5F5]">
                        <td className="p-3">{timeDisplay.date}</td>
                        <td className="p-3">{timeDisplay.time}</td>
                        <td className="p-3">{lesson.curriculumTitle || 'N/A'}</td>
                        <td className="p-3">{lesson.lessonTitle}</td>
                        <td className="p-3">{lesson.name || "Unknown Student"}</td>
                        <td className="p-3">{formatPrice(lesson.amount, lesson.currency || "USD")}</td>
                        <td className="p-3">
                          <span className="bg-red-500 text-white px-4 py-2 rounded font-medium">
                            Canceled
                          </span>
                        </td>
                        <td className="p-3">{lesson.canceledBy || "Unknown"}</td>
                        <td className="p-3">
                          <button 
                            onClick={() => handleMessageStudent(lesson)}
                            onMouseEnter={() => preloadRoute("chat")}
                            onTouchStart={() => preloadRoute("chat")}
                            className="bg-[#E9EAEE] text-black px-4 py-2 rounded-full transition-colors cursor-pointer"
                          >
                            Message Student
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="p-3 text-center text-gray-500 bg-[#F5F5F5]">
                      No canceled lessons
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}


      {/* Review Modal */}
      <ReviewModal 
        open={openReview} 
        onClose={() => {
          setOpenReview(false);
          setSelectedLesson(null);
        }} 
        lesson={selectedLesson}
      />
    </div>
  );
}
