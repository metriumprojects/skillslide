import moment from "moment-timezone";
import LockTime from "../models/lockTimeModel.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

const calculateEndTime = (startDateUTC, durationMinutes) => {
  return moment(startDateUTC).add(durationMinutes, "minutes").toDate();
};

const formatTime = (date, timezone) => {
  return moment(date).tz(timezone).format("HH:mm");
};

const parseDurationToMinutes = (duration) => {
  if (!duration) return 60;

  if (duration.includes("h")) {
    return parseInt(duration) * 60;
  }

  if (duration.includes("m")) {
    return parseInt(duration);
  }

  return 60;
};

const isSlotOverlapping = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};


export const checkAndSaveSlot = async ({
  teacher,
  scheduledAtUTC,
  timezone,
  duration,
  lessonId = null,
  group = false,
  usecapacity = 1,
  capacity = 0,
}) => {
  const durationMinutes = parseDurationToMinutes(duration);

  const startUTC = scheduledAtUTC;
  const endUTC = calculateEndTime(startUTC, durationMinutes);

  const bookingDate = moment(startUTC).tz(timezone).format("YYYY-MM-DD");
  const dayName = moment(startUTC).tz(timezone).format("ddd"); // Mon, Tue

  const startTime = formatTime(startUTC, timezone);
  const endTime = formatTime(endUTC, timezone);

  let lockTime = await LockTime.findOne({ user: teacher });

  if (!lockTime) {
    lockTime = await LockTime.create({
      user: teacher,
      timeZone: timezone,
      weeklyHours: [],
      dateSpecificHours: [],
    });
  }

  // 🔍 Date-specific availability check
  let dateEntry = lockTime.dateSpecificHours.find(d => d.date === bookingDate);

  if (!dateEntry) {
    dateEntry = {
      date: bookingDate,
      available: true,
      slots: [],
    };
    lockTime.dateSpecificHours.push(dateEntry);
  }

  if (!dateEntry.available) {
    throw new Error("Teacher not available on selected date");
  }

  // 🔍 Find existing slot with same time (used for grouping)
  const existingSlot = dateEntry.slots.find(
    (s) => s.start === startTime && s.end === endTime
  );
  const normalizedLessonId = lessonId ? String(lessonId) : null;

  // 🔍 Slot overlap check (skip the exact same slot when grouping)
  for (const slot of dateEntry.slots) {
    const sameLesson =
      !normalizedLessonId || !slot.lessonId || String(slot.lessonId) === normalizedLessonId;
    const canShareGroupSlot =
      (group || slot.group) && existingSlot && slot === existingSlot && sameLesson;

    // allow reusing the exact same slot window when grouping
    if (canShareGroupSlot) continue;

    const slotStart = moment(`${bookingDate} ${slot.start}`, "YYYY-MM-DD HH:mm")
      .tz(timezone)
      .toDate();

    const slotEnd = moment(`${bookingDate} ${slot.end}`, "YYYY-MM-DD HH:mm")
      .tz(timezone)
      .toDate();

    if (isSlotOverlapping(startUTC, endUTC, slotStart, slotEnd)) {
      throw new Error("Selected time slot already booked");
    }
  }

  if ((group || existingSlot?.group) && existingSlot) {
    const maxCapacity = Number(capacity || 0);
    if (maxCapacity > 0 && (existingSlot.usecapacity || 0) >= maxCapacity) {
      throw new Error("Selected time slot is fully booked");
    }

    existingSlot.group = true;
    existingSlot.usecapacity = (existingSlot.usecapacity || 0) + 1;
    if (lessonId) existingSlot.lessonId = lessonId;
  } else {
    // ✅ Slot save (new slot)
    dateEntry.slots.push({
      start: startTime,
      end: endTime,
      group,
      usecapacity: group ? 1 : usecapacity || 1,
      lessonId: lessonId || undefined,
    });
  }

  await lockTime.save();

  return { startTime, endTime };
};

export const releaseSlot = async ({
  teacher,
  scheduledAtUTC,
  timezone,
  duration,
  group = false,
  usecapacity = 1,
}) => {
  if (!teacher || !scheduledAtUTC || !timezone) return null;

  const durationMinutes = parseDurationToMinutes(duration);
  const startUTC = scheduledAtUTC;
  const endUTC = calculateEndTime(startUTC, durationMinutes);
  const bookingDate = moment(startUTC).tz(timezone).format("YYYY-MM-DD");
  const startTime = formatTime(startUTC, timezone);
  const endTime = formatTime(endUTC, timezone);

  const lockTime = await LockTime.findOne({ user: teacher });
  if (!lockTime) return null;

  const dateEntry = lockTime.dateSpecificHours.find((d) => d.date === bookingDate);
  if (!dateEntry) return null;

  const slotIndex = dateEntry.slots.findIndex(
    (slot) => slot.start === startTime && slot.end === endTime
  );

  if (slotIndex === -1) return null;

  const slot = dateEntry.slots[slotIndex];
  if (group && slot.usecapacity > (usecapacity || 1)) {
    slot.usecapacity -= usecapacity || 1;
  } else {
    dateEntry.slots.splice(slotIndex, 1);
  }

  if (dateEntry.slots.length === 0) {
    lockTime.dateSpecificHours = lockTime.dateSpecificHours.filter(
      (dateSlot) => dateSlot.date !== bookingDate
    );
  }

  await lockTime.save();
  return { startTime, endTime };
};

const cleanPastDateSpecificHours = async (lockTime) => {
  if (!lockTime?.dateSpecificHours?.length) return;

  const today = moment().tz(lockTime.timeZone || "UTC").format("YYYY-MM-DD");

  // sirf aaj aur future ki dates rakho
  lockTime.dateSpecificHours = lockTime.dateSpecificHours.filter(
    d => d.date >= today
  );

  await lockTime.save();
};

const activeBookingFilter = {
  status: { $ne: "cancelled" },
  $or: [
    { paymentStatus: "paid" },
    { payment_status: "paid" },
    { status: "paid" },
    { status: "scheduled" },
  ],
};

export const getTimeLockByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    let lockTime = await LockTime.findOne({ user: userId })
      .populate("user", "name email");

    const teacher = await User.findById(userId).select("timeZone");
    const teacherTimezone = lockTime?.timeZone || teacher?.timeZone || "UTC";

    // Query active bookings for this teacher
    const teacherBookings = await Booking.find({
      teacher: userId,
      ...activeBookingFilter,
    }).populate("lesson", "duration isGroupAvailable");

    // Extract booked slots per date
    const bookedDateMap = {};

    const addSlotToMap = (scheduledAt, durationStr, isGroup, lessonId) => {
      if (!scheduledAt) return;
      const startMoment = moment(scheduledAt).tz(teacherTimezone);
      const dateStr = startMoment.format("YYYY-MM-DD");
      const startTime = startMoment.format("HH:mm");
      const durationMinutes = parseDurationToMinutes(durationStr || "60m");
      const endTime = moment(scheduledAt).add(durationMinutes, "minutes").tz(teacherTimezone).format("HH:mm");

      if (!bookedDateMap[dateStr]) {
        bookedDateMap[dateStr] = [];
      }
      bookedDateMap[dateStr].push({
        start: startTime,
        end: endTime,
        group: Boolean(isGroup),
        isBooked: true,
        lessonId: lessonId || undefined,
      });
    };

    for (const b of teacherBookings) {
      if (b.scheduledAt) {
        const isGroup = b.group || b.lesson?.isGroupAvailable || false;
        addSlotToMap(b.scheduledAt, b.lesson?.duration || "60m", isGroup, b.lesson?._id || b.lesson);
      }

      if (Array.isArray(b.lessonPosition)) {
        for (const pos of b.lessonPosition) {
          if (!pos.scheduledAt || pos.status === "cancelled") continue;
          addSlotToMap(pos.scheduledAt, pos.duration || b.lesson?.duration || "60m", pos.group, pos.lId);
        }
      }
    }

    // Build dateSpecificHours
    let dateSpecificHours = [];
    if (lockTime?.dateSpecificHours?.length) {
      dateSpecificHours = lockTime.dateSpecificHours.map((d) => ({
        date: d.date,
        available: d.available,
        slots: d.slots ? d.slots.map((s) => (s.toObject ? s.toObject() : { ...s })) : [],
      }));
    }

    // Merge booked slots into dateSpecificHours
    for (const [dateStr, bookedSlots] of Object.entries(bookedDateMap)) {
      let existingDate = dateSpecificHours.find((d) => d.date === dateStr);
      if (!existingDate) {
        existingDate = {
          date: dateStr,
          available: true,
          slots: [],
        };
        dateSpecificHours.push(existingDate);
      }

      for (const bSlot of bookedSlots) {
        const slotExists = existingDate.slots.some(
          (s) => s.start === bSlot.start && s.end === bSlot.end
        );
        if (!slotExists) {
          existingDate.slots.push(bSlot);
        } else {
          const existing = existingDate.slots.find(
            (s) => s.start === bSlot.start && s.end === bSlot.end
          );
          if (existing) {
            existing.isBooked = true;
          }
        }
      }
    }

    const responseData = {
      user: lockTime?.user || userId,
      timeZone: teacherTimezone,
      weeklyHours: lockTime?.weeklyHours || [],
      dateSpecificHours: dateSpecificHours,
    };

    return res.status(200).json({
      status: true,
      data: responseData,
    });

  } catch (error) {
    console.error("getTimeLockByUser error:", error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
