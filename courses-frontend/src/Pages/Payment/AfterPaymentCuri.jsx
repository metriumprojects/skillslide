import { Calendar, CircleCheck, MessageCircle, MessageSquare, Check, ChevronLeft, CalendarX } from "lucide-react";
import MainLayout from "../../components/MainLayout";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { CancelBooking, confirmBooking, getcuriBooking, ReShaduleCurriLessonBooking } from "../../redux/reducers/BookingReducer";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getLessonAvailability, getTeacherAvailability, getTeacherUnAvailability } from "../../redux/reducers/AvailabilityReducer";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import { MyCalendar } from "./MyCalendar";
import { toast } from "react-toastify";
import { sendChatMessage, startChat } from "../../redux/reducers/ChatReducer";
import { useCurrency } from "../../currency/CurrencyContext";

export default function AfterPaymentCurri() {
  const { formatPrice } = useCurrency();
  const { bookId } = useParams();
  const [searchParams] = useSearchParams();
  const isManage = searchParams.get("manage") === "true";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { getcuriBookingdata, teacherId, getcuridata } = useSelector((state) => state.book);
  const {
    weeklyAvailability,
    dateAvailability,
          lessonWeeklyAvailability,
      lessonDateAvailability,
    timeZone,
    dateUnAvailability,
  } = useSelector((state) => state.availability);

  // State for selected date and time for each lesson
  const [selectedDates, setSelectedDates] = useState({});
  const [selectedTimes, setSelectedTimes] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmInProgress, setBookingConfirmInProgress] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  
  // Ref to track if confirmBooking has been called
  const confirmBookingCalled = useRef(false);
  
  // Ref to prevent duplicate message sends
  const messageSendInProgress = useRef(false);

  useEffect(() => {
    dispatch(getcuriBooking(bookId));
  }, [dispatch, bookId]);

  useEffect(() => {
    if (teacherId && getcuridata?.curriculum?.calenderId) {
      dispatch(getLessonAvailability({ id: getcuridata?.curriculum?.calenderId }));
      dispatch(getTeacherUnAvailability({ id: teacherId }));
    }
  }, [dispatch, teacherId, getcuridata?.curriculum?.calenderId]);

  const handleDateSelect = (lessonId, date) => {
    setSelectedDates(prev => ({
      ...prev,
      [lessonId]: date
    }));
  };

  const handleTimeSelect = (lessonId, time) => {
    setSelectedTimes(prev => ({
      ...prev,
      [lessonId]: time
    }));
  };

  // Filter lessons to show only pending ones for scheduling.
  // Single lesson bookings store date/time on the booking itself (not lessonPosition).
  const isLessonBooking = getcuridata?.type === "lesson";
  const pendingLessons = isLessonBooking
    ? (!getcuridata?.scheduledAt || getcuridata?.status === "cancelled" ? [getcuridata] : [])
    : getcuriBookingdata?.filter(
        (lesson) =>
          lesson.status !== "completed" &&
          (lesson.status !== "scheduled" || !lesson.scheduledAt)
      ) || [];
  const curriculumScheduledLessons = isLessonBooking
    ? []
    : getcuriBookingdata?.filter((lesson) => lesson.status === "scheduled" && lesson.scheduledAt) || [];

  const fallbackBookingDateTime = (() => {
    try {
      return JSON.parse(localStorage.getItem("bookingDateTime") || "null");
    } catch {
      return null;
    }
  })();

  const lessonScheduledAt = getcuridata?.scheduledAt || fallbackBookingDateTime?.newDate || null;
  const lessonTimezone = getcuridata?.timezone || fallbackBookingDateTime?.timezone || null;

  const singleLessonScheduled = isLessonBooking && lessonScheduledAt
    ? [{
        _id: getcuridata._id,
        position: 1,
        status: "scheduled",
        scheduledAt: lessonScheduledAt,
        timezone: lessonTimezone,
        lId: {
          _id: getcuridata.lesson?._id,
          title: getcuridata.lesson?.title,
          duration: getcuridata.lesson?.duration,
        },
      }]
    : [];

  const scheduledLessons = isLessonBooking ? singleLessonScheduled : curriculumScheduledLessons;

  // Format date for scheduled lessons
  const formatScheduledDate = (dateString) => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Not scheduled";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLessonScheduleBounds = (lesson) => {
    const start = new Date(lesson?.scheduledAt);
    if (Number.isNaN(start.getTime())) return null;

    const durationRaw = lesson?.lId?.duration || getcuridata?.lesson?.duration || "60";
    const durationValue = Number.parseInt(durationRaw, 10) || 60;
    const durationMinutes = /hour/i.test(String(durationRaw))
      ? durationValue * 60
      : durationValue;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const lessonTitle = lesson?.lId?.title || getcuridata?.lesson?.title || "Lesson";
    const teacherName = getcuridata?.teacher?.name || "your teacher";

    return { start, end, lessonTitle, teacherName };
  };

  const formatIcsDate = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  const escapeIcsText = (value) =>
    String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");

  const getGoogleCalendarUrl = (lesson) => {
    const bounds = getLessonScheduleBounds(lesson);
    if (!bounds) return null;

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `Skillslide lesson: ${bounds.lessonTitle}`,
      dates: `${formatIcsDate(bounds.start)}/${formatIcsDate(bounds.end)}`,
      details: `Your Skillslide lesson with ${bounds.teacherName}.`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const downloadIcalFile = (lesson) => {
    const bounds = getLessonScheduleBounds(lesson);
    if (!bounds) {
      toast.error("Lesson date and time are missing");
      return;
    }

    const uid = `${lesson?._id || bookId || "skillslide"}@skillslide.com`;
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Skillslide//Lesson Booking//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(bounds.start)}`,
      `DTEND:${formatIcsDate(bounds.end)}`,
      `SUMMARY:${escapeIcsText(`Skillslide lesson: ${bounds.lessonTitle}`)}`,
      `DESCRIPTION:${escapeIcsText(`Your Skillslide lesson with ${bounds.teacherName}.`)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = String(bounds.lessonTitle).replace(/[^\w\-]+/g, "_").slice(0, 40) || "lesson";
    link.href = url;
    link.download = `skillslide-${safeTitle}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const calendarLesson = scheduledLessons.find((lesson) => lesson?.scheduledAt) || null;
  const googleCalendarUrl = calendarLesson ? getGoogleCalendarUrl(calendarLesson) : null;

  const handleSchedule = (lessonId, bookingInfo) => {
    dispatch(ReShaduleCurriLessonBooking({
      bookingId: bookId, 
      lId: lessonId, // Pass the lesson ID
      newDate: bookingInfo.newDate, 
      timezone: bookingInfo.timezone
    })).then((res) => {
      if (res?.payload?.status) {
        toast.success(res?.payload?.message || "Lesson scheduled successfully");
        // Clear selected date & time for this lesson
        setSelectedDates(prev => {
          const next = { ...prev };
          delete next[lessonId];
          return next;
        });
        setSelectedTimes(prev => {
          const next = { ...prev };
          delete next[lessonId];
          return next;
        });
        // Refresh the data after successful scheduling
        dispatch(getcuriBooking(bookId));
      } else {
        toast.error(res?.payload?.message || "Failed to schedule lesson");
      }
    }).catch((error) => {
      toast.error("An error occurred while scheduling the lesson");
      console.error("Scheduling error:", error);
    });
  };

  const handleCancelSchedule = async (lesson) => {
    const lessonId = lesson.lId?._id || lesson.lId;
    if (!lessonId && !isLessonBooking) {
      toast.error("Lesson details not found");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this scheduled lesson? You will be able to reschedule it right away using the calendar.")) {
      return;
    }

    try {
      setCancellingId(lesson._id);
      const res = await dispatch(
        CancelBooking({
          bookId,
          type: isLessonBooking ? "lesson" : "curriculum",
          lId: lessonId,
        })
      ).unwrap();

      toast.success(res?.message || "Schedule cancelled. Select a new date and time below to reschedule.");
      
      // Refresh curriculum booking data so the cancelled lesson appears in pendingLessons
      await dispatch(getcuriBooking(bookId)).unwrap();

      // Smooth scroll down to the calendar section so the user can immediately reschedule
      setTimeout(() => {
        const el = document.getElementById("schedule-calendar-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 250);
    } catch (error) {
      toast.error(error?.message || error || "Failed to cancel schedule");
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    // If accessed in manage mode, skip confirmBooking and fetch existing booking directly
    if (isManage) {
      dispatch(getcuriBooking(bookId)).then(() => {
        setBookingConfirmInProgress(false);
      }).catch(() => {
        setBookingConfirmInProgress(false);
      });
      return;
    }

    // Prevent multiple calls using ref - only call once on component mount
    if (confirmBookingCalled.current) {
      return;
    }
    
    // Get booking data from localStorage
    const bookingDateTimeData = localStorage.getItem('bookingDateTime');
    
    let bookingData = {
      bookingId: bookId,
      type: "succeeded"
    };

    // Parse and include booking metadata if available
    if (bookingDateTimeData) {
      try {
        const parsedData = JSON.parse(bookingDateTimeData);
        
        // Add all relevant fields from localStorage
        if (parsedData.group !== undefined) {
          bookingData.group = parsedData.group;
        } else {
          bookingData.group = false;
        }
        
        // Add usecapacity if it exists
        if (parsedData.usecapacity !== undefined) {
          bookingData.usecapacity = parsedData.usecapacity;
        }
        
        // Also add other useful fields if they exist
        if (parsedData.slotId) {
          bookingData.slotId = parsedData.slotId;
        }
        
        if (parsedData.discount !== undefined) {
          bookingData.discount = parsedData.discount;
        }
        
      } catch (error) {
        bookingData.group = false;
      }
    } else {
      bookingData.group = false;
    }

    confirmBookingCalled.current = true;
    dispatch(confirmBooking(bookingData)).then(async () => {
      await dispatch(getcuriBooking(bookId));
      setBookingConfirmInProgress(false);
    }).catch(() => {
      setBookingConfirmInProgress(false);
    });
  }, [bookId, dispatch, isManage]);

  // message
    const handleSend = async () => {
      // Prevent duplicate sends
      if (messageSendInProgress.current) {
        toast.warning("Message is already being sent...");
        return;
      }

      if (!teacherId) {
        toast.error("Request details are missing.");
        return;
      }
  
      try {
        messageSendInProgress.current = true;
        setSubmitting(true);
        
        // Wait a moment to ensure confirmBooking has completed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { room } = await dispatch(
          startChat({
            targetUserId: teacherId,
          })
        ).unwrap();
  
        // await dispatch(
        //   sendChatMessage({
        //     roomId: room._id,
        //   })
        // ).unwrap();
        
        if(room){
          navigate(`/chat/${room?._id}`);
        }
      } catch (error) {
        toast.error("Failed to send Message.");
      } finally {
        setSubmitting(false);
        messageSendInProgress.current = false;
      }
    };

  return (
    <MainLayout width="100%">
      <div className="w-full pt-[32px] pb-10 min-h-[77vh]">
        {/* Back to Upcoming link when in manage mode */}
        {isManage && (
          <div className="w-full max-w-[1520px] mb-6">
            <Link
              to="/profile?tab=Upcoming"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              <ChevronLeft size={18} />
              Back to Upcoming
            </Link>
          </div>
        )}

        {/* Success Message Card - Centered (Only shown when not managing) */}
        {!isManage && (
          <div className="w-full max-w-[1520px] mx-auto bg-[#142038] rounded-2xl p-8 sm:p-10 mb-8 flex flex-col items-center text-center">
            {/* Top orange checkmark circle badge */}
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-3.5">
              <div className="w-7 h-7 rounded-full border-[2.5px] border-primary flex items-center justify-center bg-primary/20">
                <Check size={14} className="text-primary stroke-[3]" />
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              You're enrolled!
            </h2>

            {/* Description */}
            <p className="text-gray-300 max-w-4xl text-sm sm:text-base leading-relaxed mb-6">
              {(() => {
                const count = pendingLessons.length;
                const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
                const countWord = words[count] || count;
                
                if (count === 0) {
                  return "You’ve successfully scheduled your first lesson - wonderful progress! All lessons in your curriculum are scheduled. Whenever you’re ready, continue your learning journey with confidence.";
                }
                
                return `You’ve successfully scheduled your first lesson - wonderful progress! You have ${countWord} more ${count === 1 ? "lesson" : "lessons"} remaining in your curriculum. Whenever you’re ready, please go ahead and schedule ${count === 1 ? "it" : "them"} so you can continue your learning journey with confidence.`;
              })()}
            </p>

            {/* Message Teacher button */}
            <button
              disabled={submitting || bookingConfirmInProgress}
              onClick={handleSend}
              className="border border-white/40 hover:border-white text-white px-6 py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent hover:bg-white/10 cursor-pointer"
            >
              <MessageSquare size={16} />
              {bookingConfirmInProgress ? "Setting up..." : submitting ? "Sending..." : "Message Teacher"}
            </button>
          </div>
        )}

        {/* Scheduled Lessons Summary */}
        {scheduledLessons.length > 0 && (
          <div className="w-full max-w-[1520px] mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {isLessonBooking ? "Scheduled Lesson" : "Scheduled Lessons"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {scheduledLessons.map((lesson) => (
                <div key={lesson._id} className="bg-white rounded-2xl p-5 shadow-[0_0_16px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Lesson {lesson.position}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Scheduled
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2 break-words">
                    {lesson.lId?.title}
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p>Scheduled for:</p>
                    <p className="font-medium">
                      {formatScheduledDate(lesson.scheduledAt)}
                    </p>
                    <p className="text-xs mt-1">Timezone: {lesson.timezone || "Not set"}</p>
                  </div>
                  {(getGoogleCalendarUrl(lesson) || getLessonScheduleBounds(lesson)) && (
                    <div className="mt-4 flex flex-col items-start gap-2">
                      {getGoogleCalendarUrl(lesson) && (
                        <a
                          href={getGoogleCalendarUrl(lesson)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-fit items-center gap-2 rounded-full border border-[#051842] px-4 py-2 text-sm font-medium text-[#051842] hover:bg-[#051842] hover:text-white transition-colors"
                        >
                          <Calendar size={16} />
                          Google Calendar
                        </a>
                      )}
                      {getLessonScheduleBounds(lesson) && (
                        <button
                          type="button"
                          onClick={() => downloadIcalFile(lesson)}
                          className="flex w-fit items-center gap-2 rounded-full border border-[#051842] px-4 py-2 text-sm font-medium text-[#051842] hover:bg-[#051842] hover:text-white transition-colors cursor-pointer"
                        >
                          <Calendar size={16} />
                          Add to iCal
                        </button>
                      )}
                      {getLessonScheduleBounds(lesson) && (
                        <button
                          type="button"
                          onClick={() => downloadIcalFile(lesson)}
                          className="flex w-fit items-center gap-2 rounded-full border border-[#051842] px-4 py-2 text-sm font-medium text-[#051842] hover:bg-[#051842] hover:text-white transition-colors cursor-pointer"
                        >
                          <Calendar size={16} />
                          Add to Outlook
                        </button>
                      )}
                    </div>
                  )}

                  {/* Cancel Schedule Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={cancellingId === lesson._id}
                      onClick={() => handleCancelSchedule(lesson)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-500 text-red-600 hover:bg-red-50 px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <CalendarX size={16} />
                      {cancellingId === lesson._id ? "Cancelling..." : "Cancel Schedule"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Section for Pending Lessons */}
        {pendingLessons.length > 0 && (
          <div id="schedule-calendar-section" className="w-full max-w-[1520px]">
            <h2 className="text-xl font-semibold mb-3">
              Schedule Your Remaining Lessons ({pendingLessons.length} remaining)
            </h2>

            {!isLessonBooking && (
              <div className="mb-4">
                <Link
                  to="/profile"
                  className="flex w-fit items-center gap-2 rounded-full border border-[#051842] px-4 py-2 text-sm font-medium text-[#051842] hover:bg-[#051842] hover:text-white transition-colors"
                >
                  <Calendar size={16} />
                  Schedule Later
                </Link>
              </div>
            )}
            
            {/* Swiper for horizontal calendar display */}
            <Swiper
              spaceBetween={20}
              slidesPerView={1}
              breakpoints={{
                640: {
                  slidesPerView: 1,
                },
                768: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
              }}
              pagination={{
                clickable: true,
              }}
              modules={[Pagination]}
              className="w-full pb-10 !overflow-visible"
            >
              {pendingLessons.map((lesson) => (
                <SwiperSlide key={lesson._id}>
                  <MyCalendar
                    selectedDate={selectedDates[lesson._id]}
                    onSelect={(date) => handleDateSelect(lesson._id, date)}
                    selectedTime={selectedTimes[lesson._id]}
                    onSelectTime={(time) => handleTimeSelect(lesson._id, time)}
                    weeklyAvailability={lessonWeeklyAvailability}
                    dateAvailability={lessonDateAvailability}
                    teacherTimezone={timeZone}
                    isDisabled={lesson.status === "scheduled"}
                    lessonTitle={lesson.lId?.title}
                    lessonNumber={lesson.position}
                    lessonId={lesson.lId?._id} // Pass lesson ID
                    bookingId={bookId} // Pass booking ID from params
                    onSchedule={handleSchedule} // Pass schedule function
                    dateUnAvailability={dateUnAvailability}
                    duration={lesson.lId?.duration}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* If all lessons are scheduled */}
        {pendingLessons.length === 0 && scheduledLessons.length > 0 && (
          <div className="w-full max-w-[1520px] bg-white rounded-2xl p-6 shadow-[0_0_16px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CircleCheck size={26} className="text-green-600" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-1 text-gray-900">All Lessons Scheduled!</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                All your lessons have been scheduled. You'll receive reminders before each lesson.
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
