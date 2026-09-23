import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { checkAvailablity, initiateBooking } from "../../../redux/reducers/BookingReducer";
import { toast } from "react-toastify";
import moment from "moment-timezone";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { useCurrency } from "../../../currency/CurrencyContext";

export function Calendar({
  selectedDate,
  onSelect,
  selectedTime,
  onSelectTime,
  id,
  weeklyAvailability = {},
  dateAvailability = [],
  dateUnAvailability = [],
  teacherTimezone = teacherTimezone,
  type,
  myid,
  teacherData,
  location,
  duration,
  price,
  priceCurrency = "USD",
  capacity: lessonCapacity = 0, // Default to 0 if not provided
  discount  // Group price for group slots
}) {
  const { currency, formatPrice } = useCurrency();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { lessonCalendarId } = useSelector((state) => state.availability);
  const { userInfo } = useSelector((state) => state.auth);
  const today = new Date();
  // Set today's date with time at start of day (00:00:00) for accurate comparison
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [internalSelectedDate, setInternalSelectedDate] = useState(null);
  const [userTimezone, setUserTimezone] = useState("UTC");
  const [availableTimes, setAvailableTimes] = useState([]);
  // Store slot metadata for each time slot
  const [slotMetadata, setSlotMetadata] = useState({});
  const [bookingTab, setBookingTab] = useState("individual"); // "individual" | "group"
  const [isBooking, setIsBooking] = useState(false);

  // Helper to check if a slot has group availability
  const checkSlotIsGroup = (slot) => {
    if (!slot) return false;
    if (slot.lessons && Array.isArray(slot.lessons)) {
      const entry = slot.lessons.find((l) => (myid ? l.lesson === myid : true));
      if (entry) return Boolean(entry.lessonGroup);
    }
    return Boolean(slot.group);
  };

  // Determine if this calendar / lesson has any group slots at all
  const hasAnyGroupSlots = useMemo(() => {
    if (type === "curri") return false;

    const weeklyHasGroup = Object.values(weeklyAvailability || {}).some((dayObj) =>
      (dayObj?.slots || []).some(checkSlotIsGroup)
    );
    if (weeklyHasGroup) return true;

    const dateHasGroup = (dateAvailability || []).some((dateObj) =>
      (dateObj?.slots || []).some(checkSlotIsGroup)
    );
    if (dateHasGroup) return true;

    return Object.values(slotMetadata || {}).some((meta) => meta?.group);
  }, [type, weeklyAvailability, dateAvailability, slotMetadata, myid]);

  const individualTimes = useMemo(() => {
    return availableTimes.filter((time) => !slotMetadata[time]?.group);
  }, [availableTimes, slotMetadata]);

  const groupTimes = useMemo(() => {
    return availableTimes.filter((time) => Boolean(slotMetadata[time]?.group));
  }, [availableTimes, slotMetadata]);

  const displayedTimes = useMemo(() => {
    if (!hasAnyGroupSlots) return availableTimes;
    return bookingTab === "group" ? groupTimes : individualTimes;
  }, [hasAnyGroupSlots, bookingTab, groupTimes, individualTimes, availableTimes]);

  const handleTabChange = (newTab) => {
    setBookingTab(newTab);
    if (selectedTime) {
      const isSelectedGroup = Boolean(slotMetadata[selectedTime]?.group);
      if ((newTab === "group" && !isSelectedGroup) || (newTab === "individual" && isSelectedGroup)) {
        onSelectTime("");
      }
    }
  };

  // When selected date slots load, if active tab has 0 slots while the other has slots, auto-switch
  useEffect(() => {
    if (hasAnyGroupSlots && internalSelectedDate) {
      if (bookingTab === "individual" && individualTimes.length === 0 && groupTimes.length > 0) {
        setBookingTab("group");
      } else if (bookingTab === "group" && groupTimes.length === 0 && individualTimes.length > 0) {
        setBookingTab("individual");
      }
    }
  }, [hasAnyGroupSlots, internalSelectedDate, individualTimes.length, groupTimes.length, bookingTab]);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get user timezone
  useEffect(() => {
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(userTz);
  }, []);

  // FIXED: Clear calendar when teacher or availability data changes
  useEffect(() => {
    setInternalSelectedDate(null);
    setAvailableTimes([]);
    setSlotMetadata({});
  }, [id, weeklyAvailability, dateAvailability, dateUnAvailability]);

  // Update available times when date changes
  useEffect(() => {
    if (internalSelectedDate) {
      updateAvailableTimes(internalSelectedDate);
    }
  }, [internalSelectedDate, weeklyAvailability, dateAvailability, dateUnAvailability, userTimezone]);

  // FIXED: Helper to create date at start of day (00:00:00)
  const createDateAtStartOfDay = (year, month, day) => {
    return new Date(year, month, day, 0, 0, 0, 0);
  };

  // FIXED: Check if date is in the past
  const isPastDate = (date) => {
    const dateToCheck = createDateAtStartOfDay(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    return dateToCheck < todayStart;
  };

  // FIXED: Get date in YYYY-MM-DD format consistently
  const getDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const simpleConvertTime = (timeStr, fromTimezone, toTimezone) => {
    const [hours, minutes] = timeStr.split(':').map(Number);

    // Create a date with the specific time
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    // Format in from timezone to get the base time
    const fromDateStr = date.toLocaleString("en-US", { timeZone: fromTimezone });
    const fromDate = new Date(fromDateStr);

    // Format in to timezone to get converted time
    const toDateStr = fromDate.toLocaleString("en-US", {
      timeZone: toTimezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    // Extract time
    const timePart = toDateStr.includes(',') ? toDateStr.split(', ')[1] : toDateStr;
    return timePart.replace(' AM', '').replace(' PM', '');
  };

  // NEW: Function to convert time using moment-timezone (FIXED for accurate conversion)
  const convertTimeWithMoment = (timeStr, fromTimezone, toTimezone) => {
    try {
      // Parse the time in the FROM timezone (teacher's timezone)
      // Use a fixed reference date to avoid date-line issues
      const referenceDate = '2024-01-15'; // Use fixed date for consistent conversion
      const momentTime = moment.tz(`${referenceDate} ${timeStr}`, 'YYYY-MM-DD HH:mm', fromTimezone);

      // Convert to the TO timezone (user's timezone)
      const convertedTime = momentTime.tz(toTimezone);

      // Return in HH:mm format
      return convertedTime.format('HH:mm');
    } catch (error) {
      console.error('Error converting time:', error, timeStr, fromTimezone, toTimezone);
      return timeStr; // Return original if conversion fails
    }
  };

  // Helper to parse duration string to minutes
  const parseDurationToMinutes = (durationStr) => {
    if (!durationStr) return 30; // Default to 30 minutes

    // If it's already a number
    if (typeof durationStr === 'number') return durationStr;

    // Try to match "X hours Y mins" or similar patterns
    const hoursMatch = durationStr.match(/(\d+)\s*(?:h|hr|hour|hours)/i);
    const minsMatch = durationStr.match(/(\d+)\s*(?:m|min|mins|minutes)/i);

    let totalMinutes = 0;

    if (hoursMatch) {
      totalMinutes += parseInt(hoursMatch[1]) * 60;
    }

    if (minsMatch) {
      totalMinutes += parseInt(minsMatch[1]);
    }

    // If no match found but it's a string number like "45"
    if (totalMinutes === 0 && !isNaN(parseInt(durationStr))) {
      // Check if it's just a number string
      const val = parseInt(durationStr);
      if (val > 0) totalMinutes = val;
    }

    return totalMinutes > 0 ? totalMinutes : 30;
  };

  const updateAvailableTimes = (date) => {
    const dayOfWeek = date.getDay().toString();
    const dateStr = getDateString(date);


    let times = [];
    let isDateSpecific = false;

    // NEW: Handle group slots that might be in dateUnAvailability
    // Some group slots appear in dateUnAvailability but should be shown if they have capacity
    const unavailableData = dateUnAvailability.find(d => d.date === dateStr);
    const unavailableSlots = unavailableData ? unavailableData.slots || [] : [];

    const revivedGroupSlots = [];
    const blockedSlots = [];

    unavailableSlots.forEach(slot => {
      // Check if this lesson has group booking by looking in the lessons array
      let isGroupForThisLesson = false;

      if (slot.lessons && Array.isArray(slot.lessons)) {
        const lessonEntry = slot.lessons.find(l => l.lesson === myid);
        if (lessonEntry) {
          isGroupForThisLesson = lessonEntry.lessonGroup || false;
        }
      }

      // If no lessons array exists, fall back to slot.group
      if (!slot.lessons || !Array.isArray(slot.lessons)) {
        isGroupForThisLesson = slot.group || false;
      }

      // Check if this is a group slot that should be revived
      // NEW: For Curriculum Booking (type === "curri"), do NOT revive group slots
      if (isGroupForThisLesson === true && type !== "curri") {
        const maxCapacity = lessonCapacity || 10;
        const currentUsage = slot.usecapacity || 0;

        // Only revive if it matches our lesson AND has space
        if (slot.lessonId === myid && currentUsage < maxCapacity) {
          revivedGroupSlots.push(slot);
          return;
        }
      }
      // Otherwise it's a blocked slot
      blockedSlots.push(slot);
    });

    // Check date-specific availability first (skip available field check as requested)
    const dateSpecific = dateAvailability.find(avail => avail.date === dateStr);
    if (dateSpecific && dateSpecific.slots && dateSpecific.slots.length > 0) {
      isDateSpecific = true;
      // Merge revived slots with date specific slots
      const allSlots = [...dateSpecific.slots, ...revivedGroupSlots];
      times = generateTimeSlots(allSlots, dateStr, true, date, blockedSlots);
    }
    // Check weekly availability (skip available field check as requested)
    else if (weeklyAvailability[dayOfWeek] && weeklyAvailability[dayOfWeek].slots && weeklyAvailability[dayOfWeek].slots.length > 0) {
      const weeklySlots = weeklyAvailability[dayOfWeek].slots || [];
      // Merge revived slots with weekly slots
      const allSlots = [...weeklySlots, ...revivedGroupSlots];
      times = generateTimeSlots(allSlots, dateStr, false, date, blockedSlots);
    }
    // If no standard availability but we have revived group slots, show them
    else if (revivedGroupSlots.length > 0) {
      times = generateTimeSlots(revivedGroupSlots, dateStr, true, date, blockedSlots);
    }

    setAvailableTimes(times);
  };

  const generateTimeSlots = (slots, dateStr, isDateSpecific, selectedDate, blockedSlots = []) => {
    const slotDuration = parseDurationToMinutes(duration);
    const allSlots = [];
    const metadataMap = {};

    // Get day name from selected date
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = selectedDate ? dayNames[selectedDate.getDay()] : '';

    // Convert blocked slots to user timezone for comparison
    const unavailableSlotsInUserTz = blockedSlots.map(slot => ({
      start: convertTimeWithMoment(slot.start, teacherTimezone, userTimezone),
      end: convertTimeWithMoment(slot.end, teacherTimezone, userTimezone),
      isBooked: slot.isBooked !== false,
      group: slot.group || false,
      lessonId: slot.lessonId || null
    }));

    // Find the group price from the first group slot (to apply to all group slots at same time)
    let groupPriceMap = {}; // Map of time -> groupPrice for group slots
    slots.forEach(slot => {
      // Check if this lesson has group booking by looking in the lessons array
      let isGroupForThisLesson = false;

      if (slot.lessons && Array.isArray(slot.lessons)) {
        const lessonEntry = slot.lessons.find(l => l.lesson === myid);
        if (lessonEntry) {
          isGroupForThisLesson = lessonEntry.lessonGroup || false;
        }
      }

      // If no lessons array exists, fall back to slot.group
      if (!slot.lessons || !Array.isArray(slot.lessons)) {
        isGroupForThisLesson = slot.group || false;
      }

      if (isGroupForThisLesson === true) {
        const effectiveGroupPrice = discount;
        if (effectiveGroupPrice > 0) {
          const userStartTime = convertTimeWithMoment(slot.start, teacherTimezone, userTimezone);
          const start = parseTime(userStartTime);
          let current = new Date(start);
          const userEndTime = convertTimeWithMoment(slot.end, teacherTimezone, userTimezone);
          const end = parseTime(userEndTime);

          while (current < end) {
            const time12h = formatTime12h(current);
            if (!groupPriceMap[time12h]) {
              groupPriceMap[time12h] = effectiveGroupPrice;
            }
            current.setMinutes(current.getMinutes() + slotDuration);
          }
        }
      }
    });

    slots.forEach(slot => {
      // NEW: Check if this lesson has group booking by looking in the lessons array
      let isGroupForThisLesson = false;

      if (slot.lessons && Array.isArray(slot.lessons)) {
        const lessonEntry = slot.lessons.find(l => l.lesson === myid);
        if (lessonEntry) {
          isGroupForThisLesson = lessonEntry.lessonGroup || false;
        }
      }

      // If no lessons array exists, fall back to slot.group
      if (!slot.lessons || !Array.isArray(slot.lessons)) {
        isGroupForThisLesson = slot.group || false;
      }

      // Filter group slots: Only show if usecapacity < capacity AND lessonId matches
      if (isGroupForThisLesson === true) {
        // NEW: For Curriculum Booking (type === "curri"), skip ALL group slots
        if (type === "curri") {
          return;
        }

        // Determine the max capacity for this slot — always use lesson-level capacity
        const maxCapacity = lessonCapacity || 10;
        const currentUsage = slot.usecapacity || 0;

        // Check if there's available capacity
        if (currentUsage >= maxCapacity) {
          return; // Skip this slot, it's at full capacity - HIDE IT
        }

        // Check if lessonId matches (if lessonId exists on slot)
        if (slot.lessonId && slot.lessonId !== myid) {
          return; // Skip this slot, it's for a different lesson
        }

      }


      // Convert to user timezone using moment-timezone
      const userStartTime = convertTimeWithMoment(slot.start, teacherTimezone, userTimezone);
      const userEndTime = convertTimeWithMoment(slot.end, teacherTimezone, userTimezone);


      const start = parseTime(userStartTime);
      const end = parseTime(userEndTime);

      if (start >= end) {
        return;
      }

      let current = new Date(start);

      while (current < end) {
        const time12h = formatTime12h(current);
        const currentTime = new Date(current);

        // Check if this time slot overlaps with any unavailable period (in user timezone)
        let isBooked = false;
        for (const unavailableSlot of unavailableSlotsInUserTz) {
          const unavailableStart = parseTime(unavailableSlot.start);
          const unavailableEnd = parseTime(unavailableSlot.end);

          // Create a slot starting at currentTime
          const slotStart = new Date(currentTime);
          const slotEnd = new Date(currentTime);
          slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

          // Check for overlap between the time slot and unavailable period
          if (slotStart < unavailableEnd && slotEnd > unavailableStart) {
            isBooked = true;
            break;
          }
        }

        // For group slots that overlap with an unavailable slot, skip if blocked
        if (isGroupForThisLesson && isBooked) {
          current.setMinutes(current.getMinutes() + slotDuration);
          continue;
        }

        allSlots.push(time12h);
        // Store metadata for this time slot (use lesson-specific group info)
        if (!metadataMap[time12h] || isGroupForThisLesson || (!isBooked && metadataMap[time12h]?.isBooked)) {
          // Prefer group slots if multiple slots exist for same time
          // Use groupPrice from groupPriceMap if available (applies to all group slots at this time)
          const groupPrice = isGroupForThisLesson ? (groupPriceMap[time12h] || slot.discount || discount || 0) : 0;
          metadataMap[time12h] = {
            group: isGroupForThisLesson,
            isBooked: isBooked,
            capacity: lessonCapacity || 0,
            usecapacity: slot.usecapacity || 0,
            groupPrice: groupPrice,
            slotId: slot._id || null,
            lessonId: slot.lessonId || null,
            day: dayName,
            specific: isDateSpecific,
            slot: slot // Store full slot for reference
          };
        }

        current.setMinutes(current.getMinutes() + slotDuration);
      }
    });

    // Update slot metadata state
    setSlotMetadata(metadataMap);

    return [...new Set(allSlots)].sort((a, b) => parseTime12h(a) - parseTime12h(b));
  };

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const parseTime12h = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime12h = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isDateAvailable = (date) => {
    // FIXED: First check if date is in the past
    if (isPastDate(date)) {
      return false;
    }

    const dayOfWeek = date.getDay().toString();
    const dateStr = getDateString(date);

    // Check if date is in dateUnAvailability (completely unavailable)
    const isUnavailableDate = dateUnAvailability.find(d =>
      d.date === dateStr && d.unavailable === true
    );

    if (isUnavailableDate) {
      return false;
    }

    // Check date-specific availability
    const dateSpecific = dateAvailability.find(avail => avail.date === dateStr);
    if (dateSpecific) {
      // If date has unavailability slots but not marked as completely unavailable
      const unavailableData = dateUnAvailability.find(d => d.date === dateStr);
      if (unavailableData && unavailableData.slots && unavailableData.slots.length > 0) {
        // Check if there are any available slots after filtering
        const filteredSlots = filterUnavailableSlots(dateSpecific.slots, unavailableData.slots);
        return filteredSlots.length > 0;
      }
      return !dateSpecific.unavailable && dateSpecific.slots && dateSpecific.slots.length > 0;
    }

    // Check weekly availability
    const weekly = weeklyAvailability[dayOfWeek];
    return weekly && !weekly.unavailable && weekly.slots && weekly.slots.length > 0;
  };

  // NEW: Helper function to filter out unavailable slots
  const filterUnavailableSlots = (availableSlots, unavailableSlots) => {
    const filtered = [];

    availableSlots.forEach(availableSlot => {
      const availableStart = parseTime(availableSlot.start);
      const availableEnd = parseTime(availableSlot.end);

      // Check if this available slot overlaps with any unavailable slot
      let isBlocked = false;

      for (const unavailableSlot of unavailableSlots) {
        const unavailableStart = parseTime(unavailableSlot.start);
        const unavailableEnd = parseTime(unavailableSlot.end);

        // Check for overlap
        if (availableStart < unavailableEnd && availableEnd > unavailableStart) {
          isBlocked = true;
          break;
        }
      }

      if (!isBlocked) {
        filtered.push(availableSlot);
      }
    });

    return filtered;
  };

  const handleSelectDate = (day) => {
    // FIXED: Create date properly at start of day
    const date = createDateAtStartOfDay(year, currentMonth.getMonth(), day);

    // Double-check date is not in past and is available
    if (isPastDate(date) || !isDateAvailable(date)) return;

    setInternalSelectedDate(date);
    setSlotMetadata({}); // Clear metadata when date changes

    // FIXED: Pass the correct date string to parent
    const dateStr = getDateString(date);
    onSelect(dateStr);
    onSelectTime("");
  };

  const handleTimeSelect = (time) => {
    if (slotMetadata[time]?.isBooked) {
      return;
    }
    onSelectTime(time);

    if (internalSelectedDate) {
      const dateStr = getDateString(internalSelectedDate);
      const time24h = convert12to24(time);
      const metadata = slotMetadata[time];

      // Calculate if slot has available capacity
      const maxCapacity = lessonCapacity || 10;
      const currentUsage = metadata?.usecapacity || 0;
      const hasCapacity = currentUsage < maxCapacity;

      // Only use groupPrice if it's a group slot AND it has available capacity
      const groupPrice = metadata?.group && hasCapacity ? (metadata.groupPrice || 0) : 0;

      const bookingData = {
        newDate: `${dateStr} ${time24h}:00`,
        timezone: userTimezone,
        groupPrice: groupPrice,
        discount: groupPrice,
        isGroup: metadata?.group || false,
        group: metadata?.group || false,
        global: false,
        slotId: metadata?.slotId || null,
        lessonId: metadata?.lessonId || null,
        day: metadata?.day || '',
        specific: metadata?.specific || false,
        calenderId: lessonCalendarId || null
      };

      // Add usecapacity only if it's a group lesson with capacity
      if (metadata?.group && hasCapacity && metadata?.usecapacity !== undefined) {
        bookingData.usecapacity = metadata.usecapacity;
      }

      localStorage.setItem('bookingDateTime', JSON.stringify(bookingData));
    }
  };

  const convert12to24 = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleConfirmSchedule = async () => {
    // Check if user is logged in first
    if (!userInfo?._id) {
      toast.info('Please log in to book.');
      navigate('/login');
      return;
    }

    // Validation first
    if (!internalSelectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    const date = localStorage.getItem('bookingDateTime');
    if (!date) {
      toast.error('No booking data found');
      return;
    }

    try {
      setIsBooking(true);
      const parsedData = JSON.parse(date);

      const response = await dispatch(checkAvailablity({
        lId: myid,
        newDate: parsedData?.newDate,
        timezone: userTimezone
      })).unwrap();

      if (response?.status) {
        toast.success(response?.message);

        // Prepare booking data
        const bookingPayload = {
          id: id,
          scheduledAt: parsedData?.newDate,
          firstname: userInfo?.name || "unknown",
          lastname: userInfo?.name || "unknown",
          country: userInfo?.country || "not added",
          type: type === "lesson" ? "lesson" : "curriculum",
          timezone: userTimezone,
          checkoutCurrency: currency,
          meta: parsedData,
        };

        // Initiate booking and redirect to checkout
        const bookingResponse = await dispatch(initiateBooking(bookingPayload)).unwrap();

        if (bookingResponse?.status && bookingResponse?.url) {
          // Save booking ID for later confirmation
          localStorage.setItem("bookingId", bookingResponse?.bookingId);
          // Redirect directly to checkout
          window.location.href = bookingResponse.url;
          return;
        } else {
          toast.error("Failed to initiate payment");
        }
      } else {
        toast.error(response?.message || 'Failed to confirm availability');
      }
    } catch (error) {
      const rawMsg =
        typeof error === "string"
          ? error
          : error?.message ||
          error?.data?.message ||
          error?.response?.data?.message ||
          "An error occurred while confirming booking";
      // Remove the word 'Stripe' as requested by user
      const cleanMsg = String(rawMsg).replace(/stripe\s*/gi, "").trim();
      toast.error(cleanMsg || "An error occurred while confirming booking");
      console.error('Booking error:', error);
    } finally {
      setIsBooking(false);
    }
  };

  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();
  const firstDayOfMonth = new Date(year, currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, currentMonth.getMonth() + 1, 0).getDate();

  const handlePrevMonth = () => {
    const prevMonth = new Date(year, currentMonth.getMonth() - 1, 1);
    // Optional: Don't allow navigation to past months if you want
    // if (prevMonth.getMonth() < today.getMonth() && prevMonth.getFullYear() <= today.getFullYear()) return;
    setCurrentMonth(prevMonth);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, currentMonth.getMonth() + 1, 1));
  };

  const generateDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  // Check if any dates in the current month have availability
  const hasAnyAvailableDatesInMonth = () => {
    for (let d = 1; d <= daysInMonth; d++) {
      const date = createDateAtStartOfDay(year, currentMonth.getMonth(), d);
      if (!isPastDate(date) && isDateAvailable(date)) {
        return true;
      }
    }
    return false;
  };



  return (
    <div className="w-full rounded-2xl px-4 sm:px-5 pt-3 pb-5 shadow-[0_4px_16px_rgba(0,0,0,0.1)] bg-white">

      <div className="flex justify-between items-center mb-3">
        <p className="font-semibold text-base sm:text-lg md:text-xl text-[#1A2B49] leading-normal">{monthName} {year}</p>
        <div className="flex items-center gap-0.5">
          <button onClick={handlePrevMonth} className="p-1 text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors" title="Previous month"><ChevronLeft size={20} /></button>
          <button onClick={handleNextMonth} className="p-1 text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors" title="Next month"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-600 mb-1">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 border border-gray-300 rounded-xl text-center mb-5 overflow-hidden bg-white">
        {generateDays().map((day, i) => {
          if (!day) return <div key={i} className="py-2 border border-gray-300"></div>;

          const date = createDateAtStartOfDay(year, currentMonth.getMonth(), day);
          const isPast = isPastDate(date);
          const isAvailable = isDateAvailable(date);
          const isSelected = internalSelectedDate && getDateString(date) === getDateString(internalSelectedDate);

          return (
            <div
              key={i}
              onClick={() => !isPast && isAvailable && handleSelectDate(day)}
              className={`py-2 text-sm border border-gray-300 ${isPast
                  ? "text-gray-400 cursor-not-allowed bg-[#f2f3f7]"
                  : !isAvailable
                    ? "text-gray-400 cursor-not-allowed bg-[#f2f3f7]"
                    : isSelected
                      ? "bg-[#1A2B49] text-white"
                      : "text-black hover:bg-[#1A2B49]/10 cursor-pointer bg-white"
                }`}
              title={isPast ? "Past date" : !isAvailable ? "Not available" : ""}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Tabs: Individual & Group */}
      {hasAnyGroupSlots && (
        <div className="flex items-center justify-center p-1 bg-[#F5F5F5] rounded-xl mb-4 gap-1">
          <button
            type="button"
            onClick={() => handleTabChange("individual")}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm rounded-lg transition-all text-center cursor-pointer ${bookingTab === "individual"
                ? "bg-white text-black shadow-sm font-semibold"
                : "text-gray-500 hover:text-black font-medium"
              }`}
          >
            Individual {internalSelectedDate ? `(${individualTimes.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("group")}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm rounded-lg transition-all text-center cursor-pointer ${bookingTab === "group"
                ? "bg-white text-black shadow-sm font-semibold"
                : "text-gray-500 hover:text-black font-medium"
              }`}
          >
            Group {internalSelectedDate ? `(${groupTimes.length})` : ""}
          </button>
        </div>
      )}

      <div className="h-[185px] overflow-y-auto hide-scrollbar flex items-center justify-center w-full">
        {displayedTimes.length > 0 ? (
          <div className="grid grid-cols-3 gap-2.5 w-full h-[185px] overflow-y-auto hide-scrollbar px-1 py-1">
            {displayedTimes.map((time) => {
              const metadata = slotMetadata[time];
              const isGroup = metadata?.group;
              const maxCapacity = lessonCapacity || 10;
              const currentUsage = metadata?.usecapacity || 0;
              const hasCapacity = currentUsage < maxCapacity;
              const groupPrice = isGroup && hasCapacity ? (metadata.groupPrice || 0) : 0;

              // Check if time is in the past on today's date
              const isToday = internalSelectedDate && getDateString(internalSelectedDate) === getDateString(today);
              let isPastTime = false;
              if (isToday) {
                const [timeStr, modifier] = time.split(' ');
                const [hours, minutes] = timeStr.split(':').map(Number);
                const slotTime = new Date();
                slotTime.setHours(modifier === 'PM' && hours !== 12 ? hours + 12 : (modifier === 'AM' && hours === 12 ? 0 : hours), minutes, 0, 0);
                const now = new Date();
                isPastTime = slotTime < now;
              }

              const isBooked = Boolean(metadata?.isBooked);
              const isDisabled = isPastTime || isBooked;

              return (
                <button
                  key={time}
                  onClick={() => !isDisabled && handleTimeSelect(time)}
                  disabled={isDisabled}
                  className={`border rounded-2xl text-sm h-20 relative overflow-hidden transition-all flex flex-col ${isDisabled
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60 hover:bg-gray-100"
                      : selectedTime === time
                        ? "bg-white text-[#1A2B49] border-[#1A2B49] ring-1 ring-inset ring-[#1A2B49] shadow-sm font-semibold"
                        : isGroup
                          ? "bg-[#FA4F2E]/10 hover:bg-[#FA4F2E]/15 text-gray-800 border-primary/30 hover:border-primary/60"
                          : "hover:bg-[#1A2B49]/10 text-gray-700 border-gray-300 bg-white"
                    }`}
                >
                  {isGroup && (
                    <span className="w-full text-[9px] font-semibold text-white bg-primary py-0.5 text-center shrink-0">
                      Group
                    </span>
                  )}
                  <div className="flex-1 w-full flex flex-col items-center justify-center px-1">
                    <span className={`text-sm leading-tight ${isBooked ? "line-through text-gray-400 font-medium" : selectedTime === time ? "font-semibold text-[#1A2B49]" : "font-medium"}`}>{time}</span>
                    {isBooked ? (
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded-full mt-1">
                        Booked
                      </span>
                    ) : isGroup && metadata?.usecapacity !== undefined ? (
                      <span className={`text-[12px] font-medium leading-tight mt-0.5 ${selectedTime === time ? "text-[#1A2B49]" : "text-gray-600"}`}>
                        {currentUsage}/{maxCapacity} Booked
                      </span>
                    ) : isGroup && hasCapacity && groupPrice > 0 ? (
                      <span className={`text-[12px] font-semibold leading-tight mt-0.5 ${selectedTime === time ? "text-[#1A2B49]" : "text-green-600"}`}>
                        ${groupPrice}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            {!internalSelectedDate
              ? hasAnyAvailableDatesInMonth()
                ? "Pick a date"
                : "Sorry, this teacher is currently fully booked."
              : hasAnyGroupSlots
                ? bookingTab === "group"
                  ? "No group slots available for this date"
                  : "No individual slots available for this date"
                : `Pick a time ${availableTimes.length > 0 ? `(${availableTimes.filter(t => !slotMetadata[t]?.isBooked).length} available)` : ""}`
            }
          </div>
        )}
      </div>

      <button
        onClick={handleConfirmSchedule}
        disabled={!internalSelectedDate || !selectedTime || isBooking}
        className={`w-full mt-6 py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 ${!internalSelectedDate || !selectedTime || isBooking
            ? "bg-gray-400 text-white cursor-not-allowed opacity-80"
            : "bg-[#FA4F2E] hover:bg-[#FA4F2E]/90 text-white cursor-pointer active:scale-[0.99]"
          }`}
      >
        {isBooking ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          (() => {
            if (selectedTime) {
              const metadata = slotMetadata[selectedTime];
              const isGroup = metadata?.group;
              const maxCapacity = lessonCapacity || 10;
              const currentUsage = metadata?.usecapacity || 0;
              const hasCapacity = currentUsage < maxCapacity;
              const groupPrice = isGroup && hasCapacity ? (metadata.groupPrice || 0) : 0;

              if (isGroup && hasCapacity && groupPrice > 0) {
                return `Book (${formatPrice(groupPrice, priceCurrency)})`;
              }
              if (!price && !groupPrice) return "Book (Free)";
              return `Book (${formatPrice(price, priceCurrency)})`;
            }

            // Inactive state (no slot selected yet) - show group price if in group tab
            if (hasAnyGroupSlots && bookingTab === "group") {
              const defaultGroupPrice = Number(
                (groupTimes.length > 0 && slotMetadata[groupTimes[0]]?.groupPrice) || discount || 0
              );
              if (defaultGroupPrice > 0) {
                return `Book (${formatPrice(defaultGroupPrice, priceCurrency)})`;
              }
            }

            if (!price) return "Book (Free)";
            return `Book (${formatPrice(price, priceCurrency)})`;
          })()
        )}
      </button>
    </div>
  );
}
