import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import moment from "moment-timezone";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export function MyCalendar({
  selectedDate,
  onSelect,
  selectedTime,
  onSelectTime,
  weeklyAvailability = {},
  dateAvailability = [],
  dateUnAvailability = [],
  teacherTimezone = "UTC",
  isDisabled = false,
  isLoading = false,
  lessonTitle = "",
  lessonNumber = 1,
  showLessonNumber = false,
  flat = false,
  lessonId = "",
  bookingId = "",
  onSchedule = null, // New prop for scheduling callback
  duration,
}) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [internalSelectedDate, setInternalSelectedDate] = useState(null);
  const [userTimezone, setUserTimezone] = useState("UTC");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [internalScheduling, setInternalScheduling] = useState(false);
  const isScheduling = isLoading || internalScheduling;
  const [bookingInfo, setBookingInfo] = useState({
    newDate: "",
    timezone: ""
  });

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get user timezone
  useEffect(() => {
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(userTz);
  }, []);

  // Update available times when date changes
  useEffect(() => {
    if (internalSelectedDate) {
      updateAvailableTimes(internalSelectedDate);
    }
  }, [
    internalSelectedDate,
    weeklyAvailability,
    dateAvailability,
    dateUnAvailability,
    userTimezone,
  ]);

  const createDateAtStartOfDay = (year, month, day) => {
    return new Date(year, month, day, 0, 0, 0, 0);
  };

  const isPastDate = (date) => {
    const dateToCheck = createDateAtStartOfDay(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    return dateToCheck < todayStart;
  };

  const getDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Function to convert time using moment-timezone
  const convertTimeWithMoment = (timeStr, fromTimezone, toTimezone) => {
    const fromTz = fromTimezone || "UTC";
    const toTz = toTimezone || "UTC";
    // Create a moment object with the time in the fromTimezone
    const momentTime = moment.tz(`${moment().format('YYYY-MM-DD')} ${timeStr}`, 'YYYY-MM-DD HH:mm', fromTz);
    
    // Convert to target timezone
    const convertedTime = momentTime.tz(toTz);
    
    // Return in HH:mm format
    return convertedTime.format('HH:mm');
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

    // Check date-specific availability first
    const dateSpecific = dateAvailability.find(
      (avail) => avail.date === dateStr
    );
    if (dateSpecific && !dateSpecific.unavailable && dateSpecific.slots) {
      times = generateTimeSlots(dateSpecific.slots, dateStr);
    }
    // Check weekly availability
    else if (
      weeklyAvailability[dayOfWeek] &&
      !weeklyAvailability[dayOfWeek].unavailable
    ) {
      const weeklySlots = weeklyAvailability[dayOfWeek].slots || [];
      times = generateTimeSlots(weeklySlots, dateStr);
    }

    setAvailableTimes(times);
  };

  const generateTimeSlots = (slots, dateStr) => {
    const slotDuration = parseDurationToMinutes(duration);
    const allSlots = [];
    
    // Get unavailability slots for this specific date
    const dateUnavailableData = dateUnAvailability.find(d => d.date === dateStr);
    const unavailableSlots = dateUnavailableData ? dateUnavailableData.slots || [] : [];
    
    // Convert unavailability slots to user timezone for comparison
    const unavailableSlotsInUserTz = unavailableSlots.map(slot => ({
      start: convertTimeWithMoment(slot.start, teacherTimezone, userTimezone),
      end: convertTimeWithMoment(slot.end, teacherTimezone, userTimezone)
    }));

    slots.forEach((slot) => {
      // Convert to user timezone using moment-timezone
      const userStartTime = convertTimeWithMoment(
        slot.start,
        teacherTimezone,
        userTimezone
      );
      const userEndTime = convertTimeWithMoment(
        slot.end,
        teacherTimezone,
        userTimezone
      );

      const start = parseTime(userStartTime);
      const end = parseTime(userEndTime);

      if (start >= end) return;

      let current = new Date(start);
      while (current < end) {
        const time12h = formatTime12h(current);
        const currentTime = new Date(current); // Clone the current time
        
        // Check if this time slot is within any unavailable period
        let isAvailable = true;
        
        for (const unavailableSlot of unavailableSlotsInUserTz) {
          const unavailableStart = parseTime(unavailableSlot.start);
          const unavailableEnd = parseTime(unavailableSlot.end);
          
          // Check if current time falls within the unavailable period
          // We're checking if the time slot (slotDuration-minute slot starting at currentTime) overlaps with unavailable period
          const slotStart = new Date(currentTime);
          const slotEnd = new Date(currentTime);
          slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration); // slotDuration-minute slot
          
          // Check for overlap
          if (slotStart < unavailableEnd && slotEnd > unavailableStart) {
            isAvailable = false;
            break;
          }
        }
        
        if (isAvailable) {
          allSlots.push(time12h);
        }
        
        current.setMinutes(current.getMinutes() + slotDuration);
      }
    });

    return [...new Set(allSlots)].sort(
      (a, b) => parseTime12h(a) - parseTime12h(b)
    );
  };

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const parseTime12h = (timeStr) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime12h = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isDateAvailable = (date) => {
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
    const dateSpecific = dateAvailability.find(
      (avail) => avail.date === dateStr
    );
    if (dateSpecific) {
      // If date has unavailability slots but not marked as completely unavailable
      const unavailableData = dateUnAvailability.find(d => d.date === dateStr);
      if (unavailableData && unavailableData.slots && unavailableData.slots.length > 0) {
        // Check if there are any available slots after filtering
        const filteredSlots = filterUnavailableSlots(dateSpecific.slots, unavailableData.slots);
        return filteredSlots.length > 0;
      }
      return (
        !dateSpecific.unavailable &&
        dateSpecific.slots &&
        dateSpecific.slots.length > 0
      );
    }

    // Check weekly availability
    const weekly = weeklyAvailability[dayOfWeek];
    return (
      weekly && !weekly.unavailable && weekly.slots && weekly.slots.length > 0
    );
  };

  // Helper function to filter out unavailable slots
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
    const date = createDateAtStartOfDay(year, currentMonth.getMonth(), day);
    
    if (isPastDate(date) || !isDateAvailable(date) || isDisabled) return;

    setInternalSelectedDate(date);
    const dateStr = getDateString(date);
    onSelect(dateStr);
    onSelectTime("");
    // Clear booking info when date changes
    setBookingInfo({
      newDate: "",
      timezone: ""
    });
  };

  const handleTimeSelect = (time) => {
    if (isDisabled) return;
    
    onSelectTime(time);
    
    // Update booking info when time is selected
    if (internalSelectedDate) {
      const dateStr = getDateString(internalSelectedDate);
      const time24h = convert12to24(time);

      const bookingData = {
        newDate: `${dateStr} ${time24h}:00`,
        timezone: userTimezone,
      };

      setBookingInfo(bookingData);
    }
  };

  const convert12to24 = (time12h) => {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const handleScheduleClick = async () => {
    if (isScheduling) return;

    if (!internalSelectedDate || !selectedTime) {
      toast.error("Please select both date and time");
      return;
    }

    if (!bookingInfo.newDate) {
      toast.error("Please select a time slot");
      return;
    }

    if (onSchedule && lessonId && bookingId) {
      try {
        setInternalScheduling(true);
        await onSchedule(lessonId, bookingInfo);
      } catch (err) {
        console.error("Schedule error:", err);
      } finally {
        setInternalScheduling(false);
      }
    } else {
      toast.error("Unable to schedule lesson");
    }
  };

  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();
  const firstDayOfMonth = new Date(year, currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, currentMonth.getMonth() + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (isDisabled || isScheduling) return;
    const prevMonth = new Date(year, currentMonth.getMonth() - 1, 1);
    setCurrentMonth(prevMonth);
  };
  
  const handleNextMonth = () => {
    if (isDisabled || isScheduling) return;
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
    <div className={`w-full ${flat ? '' : 'bg-white rounded-2xl p-5 shadow-[0_0_16px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)]'} ${isDisabled ? 'opacity-60' : ''}`}>
      {/* Lesson title and status tag */}
      <div className="mb-4">
        <div className="flex items-center justify-start mb-2">
          {isDisabled ? (
            <span className="text-xs font-medium bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
              Scheduled
            </span>
          ) : (
            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
              Pending
            </span>
          )}
        </div>
        {showLessonNumber && lessonNumber && (
          <p className="text-sm font-medium text-gray-500 mb-1">Lesson {lessonNumber}</p>
        )}
        {lessonTitle && <h4 className="font-semibold text-gray-800 mb-2 break-words">{lessonTitle}</h4>}
      </div>

      <div className="flex justify-between items-center mb-3">
        <p className="font-semibold text-xl">
          {monthName} {year}
        </p>
        <div>
          <button
            onClick={handlePrevMonth}
            disabled={isDisabled}
            className={`px-2 py-1 rounded transition-colors ${
              isDisabled ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 cursor-pointer"
            }`}
          >
            <ChevronLeft />
          </button>
          <button
            onClick={handleNextMonth}
            disabled={isDisabled}
            className={`px-2 py-1 rounded transition-colors ${
              isDisabled ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 cursor-pointer"
            }`}
          >
            <ChevronRight />
          </button>
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
              onClick={() => !isPast && isAvailable && !isDisabled && !isScheduling && handleSelectDate(day)}
              className={`py-2 text-sm border border-gray-300 ${
                isDisabled || isPast
                  ? "text-gray-400 cursor-not-allowed bg-[#f2f3f7]"
                  : !isAvailable
                  ? "text-gray-400 cursor-not-allowed bg-[#f2f3f7]"
                  : isSelected
                  ? "bg-primary text-white"
                  : "text-black hover:bg-blue-100 cursor-pointer bg-white"
              }`}
              title={
                isDisabled 
                  ? "Already scheduled" 
                  : isPast 
                    ? "Past date" 
                    : !isAvailable 
                      ? "Not available" 
                      : ""
              }
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="h-40 overflow-y-auto hide-scrollbar flex items-center justify-center w-full">
        {availableTimes.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 w-full h-40 overflow-y-auto hide-scrollbar">
            {availableTimes.map((time) => {
              // Check if time is in the past on today's date
              const isToday = internalSelectedDate && getDateString(internalSelectedDate) === getDateString(today);
              let isPastTime = false;
              if (isToday) {
                const [timeStr, modifier] = time.split(" ");
                const [hours, minutes] = timeStr.split(":").map(Number);
                const slotTime = new Date();
                slotTime.setHours(
                  modifier === "PM" && hours !== 12
                    ? hours + 12
                    : modifier === "AM" && hours === 12
                    ? 0
                    : hours,
                  minutes,
                  0,
                  0
                );
                const now = new Date();
                isPastTime = slotTime < now;
              }

              const isSlotDisabled = isDisabled || isPastTime || isScheduling;

              return (
                <button
                  key={time}
                  onClick={() => !isSlotDisabled && handleTimeSelect(time)}
                  disabled={isSlotDisabled}
                  className={`border rounded-2xl py-2 text-sm h-14 relative overflow-hidden flex items-center justify-center transition-colors ${
                    isSlotDisabled
                      ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-50"
                      : selectedTime === time
                      ? "bg-primary text-white border-primary"
                      : "hover:bg-blue-100 text-gray-700 border-gray-300 bg-white cursor-pointer"
                  }`}
                >
                  <span>{time}</span>
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
              : `Pick a time ${availableTimes.length > 0 ? `(${availableTimes.length} available)` : ""}`
            }
          </div>
        )}
      </div>

      {/* Schedule Button */}
      {!isDisabled && (
        <button
          onClick={handleScheduleClick}
          disabled={!internalSelectedDate || !selectedTime || isDisabled || isScheduling}
          className={`w-full mt-6 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            !internalSelectedDate || !selectedTime || isDisabled || isScheduling
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-primary hover:bg-[#008494] text-white cursor-pointer"
          }`}
        >
          {isScheduling ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Scheduling...</span>
            </>
          ) : (
            <span>Schedule This Lesson</span>
          )}
        </button>
      )}
    </div>
  );
}