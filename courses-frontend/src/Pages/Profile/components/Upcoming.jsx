import React, { useEffect, useState, useMemo } from "react";
import { BiSolidZap } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { userUpcomingBookings, userBookings } from "../../../redux/reducers/BookingReducer";
import { getUserFavorites, toggleFavorite } from "../../../redux/reducers/FavoriteReducer";
import { Calendar, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment-timezone";
import { toast } from "react-toastify";
import { useCurrency } from "../../../currency/CurrencyContext";
import { getCardImageUrl, getAvatarUrl } from "../../../utils/imageUtils";
import { preloadRoute } from "../../../utils/routePreloader";

export default function Upcoming() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const cardPriceOptions = { currencyDisplay: "narrowSymbol" };
  const { userInfo } = useSelector((state) => state.auth);
  const { userUpcomingdata, userBookingsdata } = useSelector((state) => state.book);
  const { favorites } = useSelector((state) => state.favorite);
  const [localTimeZone, setLocalTimeZone] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("All");
  const [openingCourseId, setOpeningCourseId] = useState(null);

  const subTabs = ["All", "Upcoming", "Past Lessons"];

  useEffect(() => {
    dispatch(getUserFavorites());
    return () => {
      setOpeningCourseId(null);
    };
  }, [dispatch]);

  const curriculumFavorites = useMemo(() => {
    if (Array.isArray(favorites)) return favorites.filter((fav) => fav?.curriculum);
    return favorites?.curriculums || [];
  }, [favorites]);

  const lessonFavorites = useMemo(() => {
    if (Array.isArray(favorites)) return favorites.filter((fav) => fav?.lesson);
    return favorites?.lessons || [];
  }, [favorites]);

  const handleSave = (itemId, itemType) => {
    dispatch(toggleFavorite({ id: itemId, type: itemType })).then((res) => {
      if (res?.payload?.status) {
        dispatch(getUserFavorites());
      } else {
        toast.info(res?.payload?.message || "Unable to update favorite");
      }
    });
  };

  useEffect(() => {
    const now = new Date();
    const pad = (n) => (n < 10 ? "0" + n : n);
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    const scheduledAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setLocalTimeZone(timezone);

    dispatch(userUpcomingBookings({ scheduledAt, timezone, force: true }));
    dispatch(userBookings({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Convert UTC time to local system time
  const convertToLocalTime = (utcTimeString) => {
    if (!utcTimeString) return "Not scheduled";
    try {
      const localTime = moment.utc(utcTimeString).local();
      return localTime.format("MMM D, YYYY h:mm A");
    } catch (error) {
      console.error("Error converting time:", error);
      return "Invalid date";
    }
  };

  // Get relative time (e.g. "in 2 days", "2 days ago")
  const getRelativeTime = (utcTimeString) => {
    if (!utcTimeString) return "";
    try {
      return moment.utc(utcTimeString).local().fromNow();
    } catch (error) {
      return "";
    }
  };

  const handleCurriculumClick = (course) => {
    if (openingCourseId) return;
    setOpeningCourseId(course._id);
    preloadRoute("afterPaymentCurri");
    localStorage.setItem("bookId", course._id);
    if (course.lesson?._id) localStorage.setItem("lId", course.lesson._id);
    const isPastCourse =
      activeSubTab === "Past Lessons" ||
      activeSubTab === "Past Lesson" ||
      course.status === "completed" ||
      (course.scheduledAt && new Date(course.scheduledAt) < new Date());
    navigate(`/after-payment-curri/${course._id}?manage=true${isPastCourse ? "&past=true" : ""}`);
  };

  // Helper to extract booking card details
  const getBookingDetails = (course) => {
    if (!course) return null;
    const isCurriculum = course.type === "curriculum" || !!course.curriculum;
    const isListing = course.type === "listing" || !!course.listing;

    if (isCurriculum && course.curriculum) {
      const item = course.curriculum;
      const coverUrl =
        item.coverImage?.url ||
        (Array.isArray(item.images) &&
          (item.images[0]?.url || (typeof item.images[0] === "string" ? item.images[0] : null))) ||
        course.coverImage?.url;
      return {
        id: item._id,
        title: item.title,
        coverImage: coverUrl ? { url: coverUrl } : null,
        images: item.images,
        averageRating: item.averageRating,
        totalRatings: item.totalRatings,
        price: item.price,
        currency: item.currency,
        type: "curriculum",
      };
    } else if (isListing && course.listing) {
      const item = course.listing;
      const coverUrl =
        item.coverImage?.url ||
        (Array.isArray(item.images) &&
          (item.images[0]?.url || (typeof item.images[0] === "string" ? item.images[0] : null))) ||
        course.coverImage?.url;
      return {
        id: item._id,
        title: item.title,
        coverImage: coverUrl ? { url: coverUrl } : null,
        images: item.images,
        averageRating: item.averageRating,
        totalRatings: item.totalRatings,
        duration: item.duration,
        price: item.price,
        currency: item.currency,
        type: "listing",
      };
    } else if (course.lesson) {
      const item = course.lesson;
      const coverUrl =
        item.coverImage?.url ||
        (Array.isArray(item.images) &&
          (item.images[0]?.url || (typeof item.images[0] === "string" ? item.images[0] : null))) ||
        course.coverImage?.url;
      return {
        id: item._id,
        title: item.title,
        coverImage: coverUrl ? { url: coverUrl } : null,
        images: item.images,
        averageRating: item.averageRating,
        totalRatings: item.totalRatings,
        duration: item.duration,
        price: item.price,
        currency: item.currency,
        type: "lesson",
      };
    }
    return null;
  };

  const getUserProfilePath = (course, details) => {
    if (userInfo?._id === course?.teacher?._id) {
      return "/profile";
    } else if (details?.type === "curriculum") {
      return `/user-profile/${course.curriculum?._id}`;
    } else {
      return `/user-profile/${course.lesson?._id || course?.teacher?._id}`;
    }
  };

  // Helper to extract the most relevant display time for a booking based on the active tab
  const getCourseDisplayTime = (course, subTab) => {
    let displayTime = course?.rescheduledAt || course?.scheduledAt;
    if (course.type === "curriculum" && Array.isArray(course.lessonPosition)) {
      const now = new Date();
      const pastLessons = course.lessonPosition
        .filter((lp) => lp.scheduledAt && new Date(lp.scheduledAt) < now)
        .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
      const upcomingLessons = course.lessonPosition
        .filter((lp) => lp.scheduledAt && new Date(lp.scheduledAt) >= now)
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

      if ((subTab === "Past Lessons" || subTab === "Past Lesson") && pastLessons.length > 0) {
        displayTime = pastLessons[0].scheduledAt;
      } else if (upcomingLessons.length > 0) {
        displayTime = upcomingLessons[0].scheduledAt;
      } else if (pastLessons.length > 0) {
        displayTime = pastLessons[0].scheduledAt;
      }
    }
    return displayTime;
  };

  // All bookings list: combines all paid user bookings from userBookings and userUpcoming
  const allBookings = useMemo(() => {
    const map = new Map();
    (userBookingsdata || []).forEach((b) => {
      if (b?._id) map.set(b._id.toString(), b);
    });
    (userUpcomingdata || []).forEach((b) => {
      if (b?._id && !map.has(b._id.toString())) {
        map.set(b._id.toString(), b);
      }
    });
    return Array.from(map.values()).filter((b) => b?.status !== "cancelled");
  }, [userBookingsdata, userUpcomingdata]);

  // Upcoming bookings list: includes userUpcomingdata and any active scheduled future bookings
  const upcomingBookings = useMemo(() => {
    const now = new Date();
    const map = new Map();

    (userUpcomingdata || []).forEach((b) => {
      if (b?._id && b?.status !== "cancelled") {
        map.set(b._id.toString(), b);
      }
    });

    allBookings.forEach((course) => {
      if (course?._id && !map.has(course._id.toString())) {
        if (course.status === "cancelled") return;
        if (course.type === "curriculum") {
          if (Array.isArray(course.lessonPosition) && course.lessonPosition.length > 0) {
            const hasFuture = course.lessonPosition.some(
              (lp) => lp.scheduledAt && new Date(lp.scheduledAt) >= now && lp.status !== "cancelled"
            );
            if (hasFuture) map.set(course._id.toString(), course);
          } else if (course.scheduledAt && new Date(course.scheduledAt) >= now) {
            map.set(course._id.toString(), course);
          }
        } else {
          const time = course.rescheduledAt || course.scheduledAt;
          if (time && new Date(time) >= now) {
            map.set(course._id.toString(), course);
          }
        }
      }
    });

    return Array.from(map.values());
  }, [userUpcomingdata, allBookings]);

  // Past lessons list: includes bookings where scheduled time has passed or status is completed
  const pastBookings = useMemo(() => {
    const now = new Date();
    return allBookings.filter((course) => {
      if (course.status === "cancelled") return false;
      if (course.status === "completed") return true;

      if (course.type === "curriculum") {
        const positions = course.lessonPosition || [];
        const scheduledPositions = positions.filter((lp) => lp.scheduledAt);
        if (scheduledPositions.length > 0) {
          return scheduledPositions.some(
            (lp) => new Date(lp.scheduledAt) < now || lp.status === "completed"
          );
        }
        if (course.scheduledAt && new Date(course.scheduledAt) < now) return true;
        return false;
      } else {
        const time = course.rescheduledAt || course.scheduledAt;
        if (time && new Date(time) < now) return true;
        return false;
      }
    });
  }, [allBookings]);

  const displayedBookings = useMemo(() => {
    if (activeSubTab === "Upcoming") return upcomingBookings;
    if (activeSubTab === "Past Lessons" || activeSubTab === "Past Lesson") return pastBookings;
    return allBookings;
  }, [activeSubTab, allBookings, upcomingBookings, pastBookings]);

  return (
    <div className="w-full">
      {/* Sub-Tabs Navigation matching My Bookmarks design */}
      <div className="flex gap-6 justify-start text-sm sm:text-base font-medium mt-[32px] mb-[32px]">
        {subTabs.map((subTab) => (
          <button
            type="button"
            key={subTab}
            onClick={() => setActiveSubTab(subTab)}
            className={`pb-3 transition-colors cursor-pointer ${
              activeSubTab === subTab
                ? "border-b-2 border-black text-black font-semibold"
                : "text-gray-500 hover:text-black"
            }`}
          >
            {subTab}
          </button>
        ))}
      </div>

      {/* Bookings Tile Grid */}
      {displayedBookings && displayedBookings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-5 gap-6">
          {displayedBookings.map((course, index) => {
            const details = getBookingDetails(course);
            if (!details) return null;

            const displayTime = getCourseDisplayTime(course, activeSubTab);
            const localTime = convertToLocalTime(displayTime);
            const relativeTime = getRelativeTime(displayTime);

            const isBookmarked =
              details.type === "curriculum"
                ? curriculumFavorites.some((fav) => fav?.curriculum?._id === details.id)
                : lessonFavorites.some((fav) => fav?.lesson?._id === details.id);

            const targetLink =
              details.type === "curriculum"
                ? `/curriculum-booking/${details.id}`
                : `/lesson-booking/${details.id}`;

            return (
              <article key={course._id || index} className="mb-4 min-w-0 group flex flex-col">
                {/* Image Container */}
                <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-gray-100">
                  <Link to={targetLink} state={{ preview: details }}>
                    <img
                      src={
                        getCardImageUrl(details.coverImage?.url) ||
                        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80"
                      }
                      alt={details.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>

                  {/* Rating Badge */}
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-base leading-none text-white backdrop-blur-sm">
                    {details?.averageRating === 0 ? 100 : details?.averageRating ?? 100}%
                  </span>

                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleSave(details.id, details.type);
                    }}
                    className="absolute right-3 top-3 rounded-full bg-black/45 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/65 cursor-pointer"
                    aria-label={isBookmarked ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isBookmarked ? "fill-red-500 text-red-500" : "text-white"
                      }`}
                    />
                  </button>
                </div>

                {/* Details Section */}
                <div className="pt-2 flex flex-col flex-1">
                  <h3 className="line-clamp-3 text-base font-semibold leading-[1.22] text-black">
                    {details.title}
                  </h3>

                  <p className="mt-1 text-base text-[#6A6A6A]">
                    {formatPrice(
                      course.amount || details.price,
                      details.currency || course.currency || "USD",
                      cardPriceOptions
                    )}{" "}
                    &nbsp;·&nbsp;{" "}
                    {details.type === "curriculum"
                      ? "Curriculum"
                      : `${details.duration || 60} min lesson`}
                  </p>

                  <div className="mt-2">
                    <Link
                      to={getUserProfilePath(course, details)}
                      className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#f3f3f3] py-1 pl-1 pr-3 text-base text-black hover:bg-gray-200 transition-colors"
                    >
                      <img
                        src={getAvatarUrl(course?.teacher?.image?.url) || "/default-avatar.svg"}
                        loading="lazy"
                        decoding="async"
                        alt={course.teacher?.name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                      <span className="truncate">
                        {course?.teacher?.name || "Unknown"} (
                        {course?.teacher?.averageRating === 0
                          ? 100
                          : course?.teacher?.averageRating ?? 100}
                        %)
                      </span>
                    </Link>
                  </div>

                  {/* Scheduled info */}
                  {displayTime && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{localTime}</span>
                      {relativeTime && <span className="text-gray-400">({relativeTime})</span>}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => handleCurriculumClick(course)}
                      disabled={openingCourseId === course._id}
                      className="w-full bg-primary hover:bg-primary/90 text-white text-base font-medium py-2.5 rounded-full flex justify-center items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-85"
                    >
                      {openingCourseId === course._id ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Opening...</span>
                        </>
                      ) : (
                        <>
                          <span>{details.type === "curriculum" ? "Manage Curriculum" : "Manage Lesson"}</span>
                          <BiSolidZap className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="w-full bg-[#F5F5F5] p-6 md:p-12 rounded-3xl text-center">
          <p className="text-gray-500 text-base font-medium">
            {activeSubTab === "Upcoming"
              ? "No Upcoming Bookings yet"
              : activeSubTab === "Past Lessons" || activeSubTab === "Past Lesson"
              ? "No Past Lessons yet"
              : "No Bookings yet"}
          </p>
        </div>
      )}
    </div>
  );
}