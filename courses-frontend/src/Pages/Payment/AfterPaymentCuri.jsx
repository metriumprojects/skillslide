import { Calendar, CircleCheck, MessageCircle, MessageSquare, Check, ChevronLeft, ChevronRight, Home, CalendarX, RotateCcw, Clock } from "lucide-react";
import { BiSolidZap } from "react-icons/bi";
import MainLayout from "../../components/MainLayout";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { CancelBooking, confirmBooking, getcuriBooking, ReShaduleCurriLessonBooking, ReShaduleLessonBooking } from "../../redux/reducers/BookingReducer";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getLessonAvailability, getTeacherAvailability, getTeacherUnAvailability } from "../../redux/reducers/AvailabilityReducer";
import { MyCalendar } from "./MyCalendar";
import { toast } from "react-toastify";
import { sendChatMessage, startChat } from "../../redux/reducers/ChatReducer";
import { useCurrency } from "../../currency/CurrencyContext";
import Card from "../Home/Components/Card";
import CurriculumCard from "../Home/Components/CurriculumCard";
import { getCardImageUrl, getAvatarUrl } from "../../utils/imageUtils";

export default function AfterPaymentCurri({ bookIdOverride }) {
  const { formatPrice } = useCurrency();
  const { bookId: paramBookId } = useParams();
  const [searchParams] = useSearchParams();
  const bookId = bookIdOverride || paramBookId;
  const isManage = searchParams.get("manage") === "true" || !!bookIdOverride;
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
  const { favorites } = useSelector((state) => state.favorite || {});
  const { userInfo } = useSelector((state) => state.auth || {});

  // State for selected date and time for each lesson
  const [selectedDates, setSelectedDates] = useState({});
  const [selectedTimes, setSelectedTimes] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmInProgress, setBookingConfirmInProgress] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [reschedulingLesson, setReschedulingLesson] = useState(null);
  const [activePendingLessonId, setActivePendingLessonId] = useState(null);
  
  // Ref to track if confirmBooking has been called
  const confirmBookingCalled = useRef(false);
  
  // Ref to prevent duplicate message sends
  const messageSendInProgress = useRef(false);

  useEffect(() => {
    dispatch(getcuriBooking(bookId));
  }, [dispatch, bookId]);

  const activeTeacherId =
    getcuridata?.teacher?._id ||
    (typeof getcuridata?.teacher === "string" ? getcuridata.teacher : null) ||
    teacherId;

  const currentLessonItem =
    getcuridata?.lesson ||
    getcuridata?.listing ||
    getcuridata?.curriculum;

  const calenderId =
    currentLessonItem?.calenderId ||
    getcuridata?.curriculum?.calenderId ||
    getcuridata?.lesson?.calenderId;

  useEffect(() => {
    if (!activeTeacherId) return;

    // Fetch teacher unavailability
    dispatch(getTeacherUnAvailability({ id: activeTeacherId }));

    // Fetch general teacher availability
    dispatch(getTeacherAvailability({ id: activeTeacherId }));

    // If lesson or curriculum has a specific calendar ID, fetch lesson availability too
    if (calenderId) {
      dispatch(getLessonAvailability({ id: calenderId }));
    }
  }, [dispatch, activeTeacherId, calenderId]);

  // If lesson-specific calendar exists and has slots, use it; otherwise fallback to teacher weekly availability
  const hasLessonSlots = Object.values(lessonWeeklyAvailability || {}).some(
    (d) => d && Array.isArray(d.slots) && d.slots.length > 0
  );
  const effectiveWeeklyAvailability = (calenderId && hasLessonSlots)
    ? lessonWeeklyAvailability
    : (weeklyAvailability && Object.keys(weeklyAvailability).length > 0 ? weeklyAvailability : (lessonWeeklyAvailability || {}));

  const hasLessonDateSlots = Array.isArray(lessonDateAvailability) && lessonDateAvailability.length > 0;
  const effectiveDateAvailability = (calenderId && hasLessonDateSlots)
    ? lessonDateAvailability
    : (dateAvailability && dateAvailability.length > 0 ? dateAvailability : (lessonDateAvailability || []));

  const effectiveTeacherTimezone =
    timeZone ||
    getcuridata?.timezone ||
    getcuridata?.teacher?.timezone ||
    "UTC";

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
  const isCancelled = getcuridata?.status === "cancelled";

  const fallbackBookingDateTime = (() => {
    if (isCancelled) return null;
    try {
      return JSON.parse(localStorage.getItem("bookingDateTime") || "null");
    } catch {
      return null;
    }
  })();

  const lessonScheduledAt = isCancelled
    ? null
    : (getcuridata?.scheduledAt || fallbackBookingDateTime?.newDate || null);
  const lessonTimezone = isCancelled
    ? null
    : (getcuridata?.timezone || fallbackBookingDateTime?.timezone || null);

  const isPastParam = searchParams.get("past") === "true";

  const checkIsLessonPast = (lesson) => {
    if (isPastParam) return true;
    if (getcuridata?.status === "completed") return true;
    if (lesson?.status === "completed") return true;
    if (lesson?.scheduledAt && new Date(lesson.scheduledAt) < new Date()) return true;
    return false;
  };

  const isSingleLessonPast =
    isLessonBooking &&
    (isPastParam ||
      getcuridata?.status === "completed" ||
      Boolean(lessonScheduledAt && new Date(lessonScheduledAt) < new Date()));

  const singleLessonScheduled = isLessonBooking && !isCancelled && lessonScheduledAt
    ? [{
        _id: getcuridata._id,
        position: 1,
        status: isSingleLessonPast ? "completed" : "scheduled",
        scheduledAt: lessonScheduledAt,
        timezone: lessonTimezone,
        lId: {
          _id: getcuridata.lesson?._id,
          title: getcuridata.lesson?.title,
          duration: getcuridata.lesson?.duration,
        },
      }]
    : [];

  const pendingLessons = isLessonBooking
    ? (!isCancelled && !lessonScheduledAt ? [getcuridata] : [])
    : getcuriBookingdata?.filter(
        (lesson) =>
          lesson.status !== "completed" &&
          lesson.status !== "cancelled" &&
          (lesson.status !== "scheduled" || !lesson.scheduledAt) &&
          (!lesson.scheduledAt || new Date(lesson.scheduledAt) >= new Date())
      ) || [];

  const curriculumScheduledLessons = isLessonBooking || isCancelled
    ? []
    : getcuriBookingdata?.filter(
        (lesson) =>
          (lesson.status === "scheduled" ||
            lesson.status === "completed" ||
            (lesson.scheduledAt && new Date(lesson.scheduledAt) < new Date())) &&
          lesson.scheduledAt
      ) || [];

  const scheduledLessons = isLessonBooking ? singleLessonScheduled : curriculumScheduledLessons;

  const isCurriculumAllPast =
    !isLessonBooking &&
    (isPastParam ||
      getcuridata?.status === "completed" ||
      (curriculumScheduledLessons.length > 0 &&
        pendingLessons.length === 0 &&
        curriculumScheduledLessons.every((l) => checkIsLessonPast(l))));

  const lessonItem = getcuridata?.lesson || getcuridata?.listing;
  const lessonId = lessonItem?._id || getcuridata?.lesson?._id || getcuridata?.lessonId;
  const lessonCoverUrl =
    lessonItem?.coverImage?.url ||
    (Array.isArray(lessonItem?.images) && (lessonItem.images[0]?.url || (typeof lessonItem.images[0] === "string" ? lessonItem.images[0] : null))) ||
    getcuridata?.coverImage?.url ||
    (Array.isArray(getcuridata?.images) && (getcuridata.images[0]?.url || (typeof getcuridata.images[0] === "string" ? getcuridata.images[0] : null))) ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80";
  const lessonTitle = lessonItem?.title || getcuridata?.title || scheduledLessons[0]?.lId?.title || "Lesson";
  const lessonDuration = lessonItem?.duration || getcuridata?.duration || 60;
  const lessonPrice = getcuridata?.amount || getcuridata?.totalPrice || getcuridata?.price || lessonItem?.price;
  const lessonCurrency = getcuridata?.currency || "USD";
  const lessonRating = lessonItem?.averageRating === 0 ? 100 : (lessonItem?.averageRating ?? 100);
  const teacher = getcuridata?.teacher;

  const cardTeacher = teacher || lessonItem?.createdBy || {
    _id: teacherId,
    name: "Teacher",
    image: { url: "/default-avatar.svg" },
    averageRating: 100,
  };

  const formatDurationText = (duration) => {
    if (!duration) return "1 hour";
    const str = String(duration).trim();
    if (/[hm]|hour|min|sec/i.test(str)) {
      return str;
    }
    return `${str} min`;
  };

  const courseForCard = {
    ...(lessonItem || {}),
    _id: lessonId || lessonItem?._id || "lesson",
    title: lessonTitle,
    coverImage: { url: lessonCoverUrl },
    price: lessonPrice,
    currency: lessonCurrency,
    duration: formatDurationText(lessonDuration),
    averageRating: lessonRating,
    createdBy: cardTeacher,
  };

  const curriculumItem = getcuridata?.curriculum || getcuridata?.listing;
  const curriculumId = curriculumItem?._id || getcuridata?.curriculum?._id || getcuridata?.curriculumId;
  const curriculumCoverUrl =
    curriculumItem?.coverImage?.url ||
    (Array.isArray(curriculumItem?.images) && (curriculumItem.images[0]?.url || (typeof curriculumItem.images[0] === "string" ? curriculumItem.images[0] : null))) ||
    getcuridata?.coverImage?.url ||
    (Array.isArray(getcuridata?.images) && (getcuridata.images[0]?.url || (typeof getcuridata.images[0] === "string" ? getcuridata.images[0] : null))) ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80";
  const curriculumTitle = curriculumItem?.title || getcuridata?.title || "Curriculum";
  const itemCategory =
    (isLessonBooking
      ? lessonItem?.category || getcuridata?.category || getcuridata?.lesson?.category
      : curriculumItem?.category || getcuridata?.category || getcuridata?.curriculum?.category) ||
    curriculumItem?.category ||
    lessonItem?.category ||
    getcuridata?.category ||
    null;
  const curriculumPrice = getcuridata?.amount || getcuridata?.totalPrice || getcuridata?.price || curriculumItem?.price;
  const curriculumCurrency = getcuridata?.currency || "USD";
  const curriculumRating = curriculumItem?.averageRating === 0 ? 100 : (curriculumItem?.averageRating ?? 100);

  const curriculumForCard = {
    ...(curriculumItem || {}),
    _id: curriculumId || "curriculum",
    title: curriculumTitle,
    coverImage: { url: curriculumCoverUrl },
    price: curriculumPrice,
    currency: curriculumCurrency,
    averageRating: curriculumRating,
    createdBy: cardTeacher,
  };

  const currentPendingLesson =
    pendingLessons.find(
      (l) => (l.lId?._id || l.lId || l._id) === activePendingLessonId
    ) || pendingLessons[0] || null;

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
    const action = isLessonBooking
      ? ReShaduleLessonBooking({
          bookingId: bookId,
          newDate: bookingInfo.newDate,
          timezone: bookingInfo.timezone,
        })
      : ReShaduleCurriLessonBooking({
          bookingId: bookId,
          lId: lessonId,
          newDate: bookingInfo.newDate,
          timezone: bookingInfo.timezone,
        });

    return dispatch(action).then(async (res) => {
      if (res?.payload?.status) {
        toast.success(res?.payload?.message || "Lesson scheduled successfully");
        setIsRescheduling(false);
        setReschedulingLesson(null);
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
        try {
          localStorage.removeItem("bookingDateTime");
        } catch {}
        // Refresh the data after successful scheduling
        await dispatch(getcuriBooking(bookId));
      } else {
        toast.error(res?.payload?.message || "Failed to schedule lesson");
      }
    }).catch((error) => {
      toast.error("An error occurred while scheduling the lesson");
      console.error("Scheduling error:", error);
    });
  };

  const handleCancelLesson = async (lesson) => {
    const formattedPrice = isLessonBooking
      ? (lessonPrice ? formatPrice(lessonPrice, lessonCurrency) : "the booking amount")
      : (curriculumPrice ? formatPrice(curriculumPrice, curriculumCurrency) : "the booking amount");
    const itemType = isLessonBooking ? "lesson" : "curriculum";
    const confirmMsg = `Are you sure you want to cancel this ${itemType}? Your ${isLessonBooking ? "booking" : "entire curriculum booking"} will be cancelled and an immediate full refund of ${formattedPrice} will be processed back to your original payment method.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setCancellingId(lesson?._id || bookId);
      const lessonId = lesson?.lId?._id || lesson?.lId;
      const res = await dispatch(
        CancelBooking({
          bookId,
          type: isLessonBooking ? "lesson" : "curriculum",
          cancelEntireCurriculum: isLessonBooking ? undefined : true,
          lId: lessonId,
        })
      ).unwrap();

      toast.success(res?.message || `${isLessonBooking ? "Lesson" : "Curriculum"} cancelled and refund processed successfully.`);

      try {
        localStorage.removeItem("bookingDateTime");
      } catch (err) {
        console.error(err);
      }

      await dispatch(getcuriBooking(bookId)).unwrap();
    } catch (error) {
      toast.error(error?.message || error || `Failed to cancel ${itemType}`);
    } finally {
      setCancellingId(null);
    }
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
      <div className="w-full pt-[20px] sm:pt-[24px] pb-10 min-h-[77vh]">
        {/* Grey Bar with Breadcrumb Navigation (Matching Lesson & Curriculum Booking) */}
        <div className="-mx-3 md:-mx-10 px-3 md:px-10 bg-[#F5F5F5] py-2.5 mb-[30px]">
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
            <Link to="/" className="hover:text-[#1A2B49] hover:underline transition-colors flex items-center gap-1.5">
              <Home size={14} className="text-gray-500 shrink-0" />
              <span>Home</span>
            </Link>
            {itemCategory && (
              <>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
                <Link
                  to={`/?category=${itemCategory}`}
                  className="hover:text-[#1A2B49] hover:underline transition-colors"
                >
                  {itemCategory}
                </Link>
              </>
            )}
            {isManage && (
              <>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
                <Link
                  to="/profile?tab=All My Bookings"
                  className="hover:text-[#1A2B49] hover:underline transition-colors"
                >
                  All My Bookings
                </Link>
              </>
            )}
            <ChevronRight size={14} className="text-gray-400 shrink-0" />
            <span className="text-[#1A2B49] font-medium truncate max-w-[200px] sm:max-w-md">
              {isLessonBooking ? (lessonTitle || "Lesson Details") : (curriculumTitle || "Curriculum Details")}
            </span>
          </nav>
        </div>

        {/* Success Message Card - Centered (Only shown when not managing) */}
        {/* Success or Cancelled Message Card - Centered */}
        {isCancelled ? (
          <div className="w-full bg-[#1A2B49] rounded-2xl p-8 sm:p-10 mb-8 flex flex-col items-center text-center">
            {/* Top red refund badge */}
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center mb-3.5 shadow-sm">
              <RotateCcw size={24} className="text-red-400 stroke-[2.5]" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Booking Cancelled & Refunded
            </h2>

            <p className="text-gray-300 max-w-2xl text-sm sm:text-base leading-relaxed mb-6">
              This lesson booking has been cancelled. A full refund of{" "}
              <span className="font-semibold text-white">
                {formatPrice(
                  getcuridata?.meta?.refund?.refundAmount || lessonPrice,
                  getcuridata?.meta?.refund?.currency || lessonCurrency
                )}
              </span>{" "}
              has been processed back to your original payment method. Depending on your bank, it may take 5–10 business days to appear on your statement.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                className="bg-primary hover:bg-[#e04324] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                Browse Lessons
              </Link>
              <Link
                to="/profile?tab=Bookings"
                className="border border-white/40 hover:border-white text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors bg-transparent hover:bg-white/10"
              >
                View My Bookings
              </Link>
            </div>
          </div>
        ) : !isManage ? (
          <div className="w-full bg-[#1A2B49] rounded-2xl p-8 sm:p-10 mb-8 flex flex-col items-center text-center">
            {/* Top orange checkmark circle badge */}
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-3.5 shadow-sm">
              <Check size={26} className="text-white stroke-[3]" />
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              You're enrolled!
            </h2>

            {/* Description */}
            <p className="text-gray-300 max-w-4xl text-sm sm:text-base leading-relaxed mb-6">
              {isLessonBooking
                ? "You’ve successfully enrolled in this lesson! Review your scheduled time below or message your teacher if you have any questions."
                : (() => {
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
        ) : null}

        {/* For Single Lesson Booking: Side-by-Side (Lesson Tile on Left + Scheduled Card/Calendar on Right) */}
        {isLessonBooking ? (
          isCancelled ? (
            <div className="w-full mb-8">
              <h2 className="text-xl font-semibold mb-4 text-[#1A2B49]">
                Lesson Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl items-start">
                {/* Left: Lesson Tile (Home page Card style - Cancelled) */}
                <article className="min-w-0 group opacity-85">
                  <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-gray-100">
                    <img
                      src={getCardImageUrl(lessonCoverUrl) || lessonCoverUrl}
                      alt={lessonTitle}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold leading-none text-white backdrop-blur-sm">
                      Cancelled
                    </span>
                  </div>

                  <div className="pt-2">
                    <h3 className="line-clamp-3 text-base font-semibold leading-[1.22] text-black">
                      {lessonTitle}
                    </h3>
                    <p className="mt-1 text-base text-[#6A6A6A]">
                      {lessonPrice ? `${formatPrice(lessonPrice, lessonCurrency, { currencyDisplay: "narrowSymbol" })} for ` : ""}
                      {formatDurationText(lessonDuration)}
                    </p>
                    {cardTeacher && (
                      <Link
                        to={userInfo?._id === cardTeacher?._id ? "/profile" : `/user-profile/${cardTeacher?._id}?role=teacher`}
                        className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-[#f3f3f3] py-1 pl-1 pr-3 text-base text-black"
                      >
                        <img
                          src={
                            getAvatarUrl(cardTeacher?.image?.url) ||
                            cardTeacher?.image?.url ||
                            "/default-avatar.svg"
                          }
                          loading="lazy"
                          decoding="async"
                          alt={cardTeacher?.name}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                        <span className="truncate">
                          {cardTeacher?.name || "Teacher"} ({cardTeacher?.averageRating === 0 ? 100 : cardTeacher?.averageRating ?? 100}%)
                        </span>
                      </Link>
                    )}
                  </div>
                </article>

                {/* Right: Refund Information Card */}
                <div className="bg-white rounded-2xl p-5 shadow-[0_0_16px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] flex flex-col justify-between">
                  <div>
                    <div className="mb-3 flex flex-col items-start gap-1">
                      <span className="inline-block text-xs font-medium bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                        Refund Processed
                      </span>
                      <span className="text-xs text-gray-400">
                        {getcuridata?.meta?.refund?.refundedAt
                          ? new Date(getcuridata.meta.refund.refundedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : new Date().toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      Refund Information
                    </h3>

                    <div className="space-y-3">
                      <div className="pb-2.5 border-b border-gray-100">
                        <span className="block text-xs font-medium text-gray-500">Refund Amount</span>
                        <span className="block text-base font-semibold text-gray-900 mt-0.5">
                          {formatPrice(
                            getcuridata?.meta?.refund?.refundAmount || lessonPrice,
                            getcuridata?.meta?.refund?.currency || lessonCurrency
                          )}
                        </span>
                      </div>
                      <div className="pb-2.5 border-b border-gray-100">
                        <span className="block text-xs font-medium text-gray-500">Booking Status</span>
                        <span className="block text-sm font-semibold text-red-600 capitalize mt-0.5">
                          {getcuridata?.status || "Cancelled"}
                        </span>
                      </div>
                      <div className="pb-2.5 border-b border-gray-100">
                        <span className="block text-xs font-medium text-gray-500">Payment Status</span>
                        <span className="block text-sm font-semibold text-red-600 capitalize mt-0.5">
                          {getcuridata?.paymentStatus || "Cancelled"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-gray-500">Destination</span>
                        <span className="block text-sm font-medium text-gray-700 mt-0.5">
                          Original Payment Method
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <Link
                      to="/"
                      className="w-full flex items-center justify-center gap-2 rounded-full bg-[#051842] hover:bg-[#1A2B49] text-white py-2.5 text-sm font-medium transition-colors"
                    >
                      Explore Other Lessons
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (scheduledLessons.length > 0 || pendingLessons.length > 0 || isRescheduling) && (
            <div className="w-full mb-8">
              <h2 className="text-xl font-semibold mb-4 text-[#1A2B49]">
                {isManage ? (isSingleLessonPast ? "Completed Lesson Details" : "Lesson Details") : (scheduledLessons.length > 0 ? "Scheduled Lesson" : "Schedule Your Lesson")}
              </h2>

              <div className={`grid grid-cols-1 ${isRescheduling ? "lg:grid-cols-3 max-w-7xl" : "md:grid-cols-2 max-w-4xl"} gap-6 items-start transition-all duration-300`}>
                {/* 1. Left: Lesson Tile (Home page Card style) */}
                <div className="w-full flex flex-col">
                  <Card
                    course={courseForCard}
                    favorites={favorites}
                    linkTo={lessonId ? `/lesson-booking/${lessonId}` : undefined}
                  />
                </div>

                {/* 2. Scheduled Details Column (stays visible when rescheduling) */}
                {scheduledLessons.length > 0 && (
                  <div className="w-full flex flex-col gap-4">
                    {/* Status Banner on top of scheduled lesson card (matching curriculum layout) */}
                    {isSingleLessonPast ? (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <CircleCheck size={22} className="text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-green-900">Lesson Completed</h4>
                          <p className="text-xs text-green-700 mt-0.5">
                            This lesson has ended. We hope you had a great learning session!
                          </p>
                        </div>
                      </div>
                    ) : !isRescheduling ? (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <CircleCheck size={22} className="text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-green-900">Lesson Scheduled!</h4>
                          <p className="text-xs text-green-700 mt-0.5">
                            Your lesson is scheduled. You'll receive reminders before your lesson.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <Clock size={20} className="text-amber-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-amber-900">
                            You have 1 lesson unscheduled
                          </h4>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Select a new date and time in the calendar to reschedule.
                          </p>
                        </div>
                      </div>
                    )}

                    {scheduledLessons.map((lesson) => (
                      <div
                        key={lesson._id}
                        className={`bg-white rounded-2xl p-5 shadow-[0_0_16px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] flex flex-col transition-all ${
                          isRescheduling ? "ring-2 ring-amber-500" : isSingleLessonPast ? "border border-green-200" : ""
                        }`}
                      >
                        <div>
                          {/* Tag on left with no top gap */}
                          <div className="flex items-center justify-start mb-3">
                            <span
                              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                isSingleLessonPast
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : isRescheduling
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {isSingleLessonPast ? "Completed" : isRescheduling ? "Unscheduled" : "Scheduled"}
                            </span>
                          </div>

                          <div className="text-sm text-gray-600">
                            <p className="text-xs text-gray-500 mb-0.5">
                              {isSingleLessonPast ? "Completed on:" : "Scheduled for:"}
                            </p>
                            <p className="text-base font-semibold text-gray-900">
                              {formatScheduledDate(lesson.scheduledAt)}
                            </p>
                            <p className="text-xs mt-1 text-gray-500">
                              Timezone: {lesson.timezone || "Not set"}
                            </p>
                          </div>

                          {isSingleLessonPast ? (
                            /* Past Lesson Action */
                            <div className="mt-4 flex flex-col items-start w-full">
                              <Link
                                to={lessonId ? `/lesson-booking/${lessonId}` : "/"}
                                className="w-full flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-[#e04324] text-white py-2.5 px-5 text-sm font-medium transition-colors shadow-sm cursor-pointer"
                              >
                                <BiSolidZap className="w-4 h-4" />
                                Book this lesson again
                              </Link>
                            </div>
                          ) : (
                            /* Upcoming scheduled lesson actions */
                            <div className="mt-4 flex flex-col items-start gap-2">
                              {getGoogleCalendarUrl(lesson) && (
                                <a
                                  href={getGoogleCalendarUrl(lesson)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex w-fit items-center gap-2 rounded-full border border-[#051842] px-4 py-2 text-sm font-medium text-[#051842] hover:bg-[#051842] hover:text-white transition-colors"
                                >
                                  <Calendar size={16} />
                                  Add to Google Calendar
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

                              {/* Reschedule & Cancel buttons with exact same gap */}
                              <button
                                type="button"
                                onClick={() => setIsRescheduling(true)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#051842] hover:bg-[#1A2B49] text-white px-4 py-2 text-sm font-medium transition-colors cursor-pointer shadow-sm"
                              >
                                <RotateCcw size={15} />
                                Reschedule
                              </button>
                              <button
                                type="button"
                                disabled={cancellingId === lesson._id || cancellingId === bookId}
                                onClick={() => handleCancelLesson(lesson)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-red-500 text-red-600 hover:bg-red-50 px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <CalendarX size={15} />
                                {cancellingId === lesson._id || cancellingId === bookId ? "Cancelling..." : "Cancel lesson"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Right: Reschedule Calendar (shown on right of scheduled card when isRescheduling is true) */}
                {isRescheduling && (
                  <div id="schedule-calendar-section" className="w-full bg-white rounded-2xl p-5 shadow-[0_0_16px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] flex flex-col">
                    <div className="mb-4 flex flex-col items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsRescheduling(false)}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                        Keep current schedule
                      </button>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Reschedule Lesson</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Pick a new date and time</p>
                      </div>
                    </div>
                    <MyCalendar
                      selectedDate={selectedDates[lessonId || bookId]}
                      onSelect={(date) => handleDateSelect(lessonId || bookId, date)}
                      selectedTime={selectedTimes[lessonId || bookId]}
                      onSelectTime={(time) => handleTimeSelect(lessonId || bookId, time)}
                      weeklyAvailability={effectiveWeeklyAvailability}
                      dateAvailability={effectiveDateAvailability}
                      teacherTimezone={effectiveTeacherTimezone}
                      isDisabled={false}
                      lessonTitle={lessonTitle}
                      lessonId={lessonId}
                      bookingId={bookId}
                      onSchedule={(lId, bookingInfo) => handleSchedule(lId || lessonId, bookingInfo)}
                      dateUnAvailability={dateUnAvailability}
                      duration={lessonDuration}
                    />
                  </div>
                )}

                {/* 4. When not yet scheduled at all (initial scheduling) */}
                {scheduledLessons.length === 0 && pendingLessons.length > 0 && (
                  <div id="schedule-calendar-section" className="w-full bg-white rounded-2xl p-5 shadow-[0_0_16px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-gray-900">Schedule Your Lesson</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Pick a date and time for your lesson</p>
                    </div>
                    <MyCalendar
                      selectedDate={selectedDates[pendingLessons[0]._id]}
                      onSelect={(date) => handleDateSelect(pendingLessons[0]._id, date)}
                      selectedTime={selectedTimes[pendingLessons[0]._id]}
                      onSelectTime={(time) => handleTimeSelect(pendingLessons[0]._id, time)}
                      weeklyAvailability={effectiveWeeklyAvailability}
                      dateAvailability={effectiveDateAvailability}
                      teacherTimezone={effectiveTeacherTimezone}
                      isDisabled={pendingLessons[0].status === "scheduled"}
                      lessonTitle={pendingLessons[0].lId?.title || lessonTitle}
                      lessonId={pendingLessons[0].lId?._id || pendingLessons[0].lesson?._id || lessonId}
                      bookingId={bookId}
                      onSchedule={handleSchedule}
                      dateUnAvailability={dateUnAvailability}
                      duration={pendingLessons[0].lId?.duration || pendingLessons[0].lesson?.duration || lessonDuration}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        ) : isCancelled ? (
          <div className="w-full mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#1A2B49]">
              Curriculum Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl items-start">
              {/* Left: Curriculum Tile (Home page Card style - Cancelled) */}
              <article className="min-w-0 group opacity-85">
                <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-gray-100">
                  <img
                    src={getCardImageUrl(curriculumCoverUrl) || curriculumCoverUrl}
                    alt={curriculumTitle}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold leading-none text-white backdrop-blur-sm">
                    Cancelled
                  </span>
                </div>

                <div className="pt-2">
                  <h3 className="line-clamp-3 text-base font-semibold leading-[1.22] text-black">
                    {curriculumTitle}
                  </h3>
                  <p className="mt-1 text-base text-[#6A6A6A]">
                    {curriculumPrice ? `${formatPrice(curriculumPrice, curriculumCurrency, { currencyDisplay: "narrowSymbol" })} · ` : ""}
                    Curriculum
                  </p>
                  {cardTeacher && (
                    <Link
                      to={userInfo?._id === cardTeacher?._id ? "/profile" : `/user-profile/${cardTeacher?._id}?role=teacher`}
                      className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-[#f3f3f3] py-1 pl-1 pr-3 text-base text-black"
                    >
                      <img
                        src={
                          getAvatarUrl(cardTeacher?.image?.url) ||
                          cardTeacher?.image?.url ||
                          "/default-avatar.svg"
                        }
                        loading="lazy"
                        decoding="async"
                        alt={cardTeacher?.name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                      <span className="truncate">
                        {cardTeacher?.name || "Teacher"} ({cardTeacher?.averageRating === 0 ? 100 : cardTeacher?.averageRating ?? 100}%)
                      </span>
                    </Link>
                  )}
                </div>
              </article>

              {/* Right: Refund Information Card */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_0_16px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] flex flex-col justify-between">
                <div>
                  <div className="mb-3 flex flex-col items-start gap-1">
                    <span className="inline-block text-xs font-medium bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                      Refund Processed
                    </span>
                    <span className="text-xs text-gray-400">
                      {getcuridata?.meta?.refund?.refundedAt
                        ? new Date(getcuridata.meta.refund.refundedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    Refund Information
                  </h3>

                  <div className="space-y-3">
                    <div className="pb-2.5 border-b border-gray-100">
                      <span className="block text-xs font-medium text-gray-500">Refund Amount</span>
                      <span className="block text-base font-semibold text-gray-900 mt-0.5">
                        {formatPrice(
                          getcuridata?.meta?.refund?.refundAmount || curriculumPrice,
                          getcuridata?.meta?.refund?.currency || curriculumCurrency
                        )}
                      </span>
                    </div>
                    <div className="pb-2.5 border-b border-gray-100">
                      <span className="block text-xs font-medium text-gray-500">Booking Status</span>
                      <span className="block text-sm font-semibold text-red-600 capitalize mt-0.5">
                        {getcuridata?.status || "Cancelled"}
                      </span>
                    </div>
                    <div className="pb-2.5 border-b border-gray-100">
                      <span className="block text-xs font-medium text-gray-500">Payment Status</span>
                      <span className="block text-sm font-semibold text-red-600 capitalize mt-0.5">
                        {getcuridata?.paymentStatus || "Cancelled"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-gray-500">Destination</span>
                      <span className="block text-sm font-medium text-gray-700 mt-0.5">
                        Original Payment Method
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <Link
                    to="/"
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-[#051842] hover:bg-[#1A2B49] text-white py-2.5 text-sm font-medium transition-colors"
                  >
                    Explore Other Lessons
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Multi-lesson curriculum layout: Side-by-Side */
          <div className="w-full mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#1A2B49]">
              {isManage ? (isCurriculumAllPast ? "Completed Curriculum Details" : "Curriculum Details") : "Curriculum Details"}
            </h2>

            <div
              className={`grid grid-cols-1 ${
                reschedulingLesson
                  ? "lg:grid-cols-3 max-w-7xl"
                  : scheduledLessons.length > 0 && pendingLessons.length > 0 && !isCurriculumAllPast
                  ? "lg:grid-cols-3 max-w-7xl"
                  : "md:grid-cols-2 max-w-4xl"
              } gap-6 items-start transition-all duration-300`}
            >
              {/* 1. Left: Curriculum Card (Home page style) */}
              <div className="w-full flex flex-col">
                <CurriculumCard
                  course={curriculumForCard}
                  linkTo={curriculumId ? `/curriculum-booking/${curriculumId}` : undefined}
                />
              </div>

              {/* 2. Scheduled Lessons Column (Shown when there are scheduled lessons) */}
              {scheduledLessons.length > 0 && (
                <div className="w-full flex flex-col gap-4">
                  {/* Status Banner on top of scheduled lessons (Lesson 1 card) */}
                  {isCurriculumAllPast ? (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <CircleCheck size={22} className="text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-green-900">Curriculum Completed</h4>
                        <p className="text-xs text-green-700 mt-0.5">
                          All lessons in this curriculum have been completed.
                        </p>
                      </div>
                    </div>
                  ) : pendingLessons.length === 0 && !reschedulingLesson ? (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <CircleCheck size={22} className="text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-green-900">All Lessons Scheduled!</h4>
                        <p className="text-xs text-green-700 mt-0.5">
                          All your curriculum lessons are scheduled. You'll receive reminders before each lesson.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Clock size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-amber-900">
                          You have {pendingLessons.length + (reschedulingLesson ? 1 : 0)}{" "}
                          {pendingLessons.length + (reschedulingLesson ? 1 : 0) === 1 ? "lesson" : "lessons"} unscheduled
                        </h4>
                        <p className="text-xs text-amber-700 mt-0.5">
                          {reschedulingLesson
                            ? "Select a new date and time in the calendar to reschedule."
                            : "Select a date and time in the calendar to schedule."}
                        </p>
                      </div>
                    </div>
                  )}

                  {scheduledLessons.map((lesson) => {
                    const isBeingRescheduled = reschedulingLesson?._id === lesson._id;
                    const isPastLessonItem = checkIsLessonPast(lesson);

                    return (
                      <div
                        key={lesson._id}
                        className={`bg-white rounded-2xl p-5 shadow-[0_0_16px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] flex flex-col transition-all ${
                          isBeingRescheduled ? "ring-2 ring-amber-500" : isPastLessonItem ? "border border-green-200" : ""
                        }`}
                      >
                        <div>
                          {/* Header: Tag on left */}
                          <div className="flex items-center justify-start mb-2">
                            {isPastLessonItem ? (
                              <span className="text-xs font-medium bg-green-100 text-green-800 border border-green-200 px-2.5 py-1 rounded-full">
                                Completed
                              </span>
                            ) : isBeingRescheduled ? (
                              <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                                Unscheduled
                              </span>
                            ) : (
                              <span className="text-xs font-medium bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                                Scheduled
                              </span>
                            )}
                          </div>

                          {/* Lesson Position & Title */}
                          <h4 className="font-semibold text-gray-900 text-base mb-1">
                            Lesson {lesson.position}: {lesson.lId?.title || "Lesson"}
                          </h4>

                          <div className="text-sm text-gray-600 mt-2">
                            <p className="text-xs text-gray-500 mb-0.5">
                              {isPastLessonItem ? "Completed on:" : "Scheduled for:"}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatScheduledDate(lesson.scheduledAt)}
                            </p>
                            <p className="text-xs mt-1 text-gray-500">
                              Timezone: {lesson.timezone || "Not set"}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          {isPastLessonItem ? (
                            <div className="mt-4 flex flex-col items-start w-full">
                              <Link
                                to={curriculumId ? `/curriculum-booking/${curriculumId}` : (lesson?.lId?._id ? `/lesson-booking/${lesson.lId._id}` : "/")}
                                className="w-full flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-[#e04324] text-white py-2.5 px-5 text-sm font-medium transition-colors shadow-sm cursor-pointer"
                              >
                                <BiSolidZap className="w-4 h-4" />
                                Book this curriculum again
                              </Link>
                            </div>
                          ) : (
                            <div className="mt-4 flex flex-col items-start gap-2">
                              {getGoogleCalendarUrl(lesson) && (
                                <a
                                  href={getGoogleCalendarUrl(lesson)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex w-fit items-center gap-2 rounded-full border border-[#051842] px-4 py-2 text-sm font-medium text-[#051842] hover:bg-[#051842] hover:text-white transition-colors"
                                >
                                  <Calendar size={16} />
                                  Add to Google Calendar
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

                              {/* Reschedule button */}
                              <button
                                type="button"
                                onClick={() => setReschedulingLesson(lesson)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#051842] hover:bg-[#1A2B49] text-white px-4 py-2 text-sm font-medium transition-colors cursor-pointer shadow-sm"
                              >
                                <RotateCcw size={15} />
                                Reschedule
                              </button>

                              {/* Cancel button */}
                              <button
                                type="button"
                                disabled={cancellingId === lesson._id || cancellingId === bookId}
                                onClick={() => handleCancelLesson(lesson)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-red-500 text-red-600 hover:bg-red-50 px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <CalendarX size={15} />
                                {cancellingId === lesson._id || cancellingId === bookId ? "Cancelling..." : "Cancel Curriculum"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. Calendar Column: When rescheduling or when pending lessons exist */}
              {reschedulingLesson ? (
                /* Reschedule Calendar */
                <div id="schedule-calendar-section" className="w-full bg-white rounded-2xl p-5 shadow-[0_0_16px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] flex flex-col">
                  <div className="mb-4 flex flex-col items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => setReschedulingLesson(null)}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                      Keep current schedule
                    </button>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Reschedule Lesson {reschedulingLesson.position}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {reschedulingLesson.lId?.title} &bull; Pick a new date and time
                      </p>
                    </div>
                  </div>

                  <MyCalendar
                    selectedDate={selectedDates[reschedulingLesson.lId?._id || reschedulingLesson.lId || reschedulingLesson._id]}
                    onSelect={(date) => handleDateSelect(reschedulingLesson.lId?._id || reschedulingLesson.lId || reschedulingLesson._id, date)}
                    selectedTime={selectedTimes[reschedulingLesson.lId?._id || reschedulingLesson.lId || reschedulingLesson._id]}
                    onSelectTime={(time) => handleTimeSelect(reschedulingLesson.lId?._id || reschedulingLesson.lId || reschedulingLesson._id, time)}
                    weeklyAvailability={effectiveWeeklyAvailability}
                    dateAvailability={effectiveDateAvailability}
                    teacherTimezone={effectiveTeacherTimezone}
                    isDisabled={false}
                    showLessonNumber={true}
                    lessonTitle={reschedulingLesson.lId?.title || "Lesson"}
                    lessonNumber={reschedulingLesson.position}
                    lessonId={reschedulingLesson.lId?._id || reschedulingLesson.lId}
                    bookingId={bookId}
                    onSchedule={handleSchedule}
                    dateUnAvailability={dateUnAvailability}
                    duration={reschedulingLesson.lId?.duration}
                  />
                </div>
              ) : pendingLessons.length > 0 && !isCurriculumAllPast ? (
                /* Pending Lessons Calendar (Right side) */
                <div id="schedule-calendar-section" className="w-full bg-white rounded-2xl p-5 shadow-[0_0_16px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      Schedule Remaining Lessons ({pendingLessons.length})
                    </h3>

                    {/* Schedule Later button on next line and left side as a normal pill button */}
                    <div className="mt-2.5">
                      <Link
                        to="/profile"
                        className="inline-flex items-center gap-2 rounded-full border border-[#051842] px-4 py-1.5 text-xs sm:text-sm font-medium text-[#051842] hover:bg-[#051842] hover:text-white transition-colors"
                      >
                        <Calendar size={15} />
                        Schedule Later
                      </Link>
                    </div>

                    {pendingLessons.length > 1 && (
                      <div className="mt-3.5">
                        <p className="text-xs font-medium text-gray-500 mb-2">Select lesson to schedule:</p>
                        <div className="flex flex-wrap gap-2">
                          {pendingLessons.map((pLesson) => {
                            const pId = pLesson.lId?._id || pLesson._id;
                            const isSelected = (currentPendingLesson?.lId?._id || currentPendingLesson?._id) === pId;
                            return (
                              <button
                                key={pId}
                                type="button"
                                onClick={() => setActivePendingLessonId(pId)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                                  isSelected
                                    ? "bg-[#051842] text-white border-[#051842] shadow-sm"
                                    : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                                }`}
                              >
                                Lesson {pLesson.position || 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {currentPendingLesson && (
                    <MyCalendar
                      key={currentPendingLesson.lId?._id || currentPendingLesson._id}
                      selectedDate={selectedDates[currentPendingLesson.lId?._id || currentPendingLesson._id]}
                      onSelect={(date) => handleDateSelect(currentPendingLesson.lId?._id || currentPendingLesson._id, date)}
                      selectedTime={selectedTimes[currentPendingLesson.lId?._id || currentPendingLesson._id]}
                      onSelectTime={(time) => handleTimeSelect(currentPendingLesson.lId?._id || currentPendingLesson._id, time)}
                      weeklyAvailability={effectiveWeeklyAvailability}
                      dateAvailability={effectiveDateAvailability}
                      teacherTimezone={effectiveTeacherTimezone}
                      isDisabled={false}
                      showLessonNumber={true}
                      lessonTitle={currentPendingLesson.lId?.title || "Lesson"}
                      lessonNumber={currentPendingLesson.position}
                      lessonId={currentPendingLesson.lId?._id || currentPendingLesson._id}
                      bookingId={bookId}
                      onSchedule={handleSchedule}
                      dateUnAvailability={dateUnAvailability}
                      duration={currentPendingLesson.lId?.duration}
                    />
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
