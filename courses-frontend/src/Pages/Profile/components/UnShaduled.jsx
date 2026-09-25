import React, { useEffect, useState } from "react";
import { BiSolidZap } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { userUnscheduledBookings } from "../../../redux/reducers/BookingReducer";
import { getUserFavorites, toggleFavorite } from "../../../redux/reducers/FavoriteReducer";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { toast } from "react-toastify";
import { useCurrency } from "../../../currency/CurrencyContext";
import { getCardImageUrl, getAvatarUrl } from "../../../utils/imageUtils";
import { preloadRoute } from "../../../utils/routePreloader";

export default function UnShaduled() {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userUnscheduleddata } = useSelector((state) => state.book);
  const { favorites } = useSelector((state) => state.favorite);
  const { formatPrice } = useCurrency();
  const cardPriceOptions = { currencyDisplay: "narrowSymbol" };
  const [openingCourseId, setOpeningCourseId] = useState(null);

  useEffect(() => {
    dispatch(userUnscheduledBookings({ page: 1, limit: 20 }));
    dispatch(getUserFavorites());
  }, [dispatch]);

  const curriculumFavorites = Array.isArray(favorites)
    ? favorites.filter((fav) => fav?.curriculum)
    : favorites?.curriculums || [];

  const handleSave = (itemId, itemType) => {
    dispatch(toggleFavorite({ id: itemId, type: itemType })).then((res) => {
      if (res?.payload?.status) {
        dispatch(getUserFavorites());
      } else {
        toast.info(res?.payload?.message || "Unable to update favorite");
      }
    });
  };

  const handleCurriculumClick = (course) => {
    if (openingCourseId) return;
    setOpeningCourseId(course._id);
    preloadRoute("afterPaymentCurri");
    navigate(`/after-payment-curri/${course._id}?manage=true`);
  };

  // Function to get booking details based on type (strictly Curriculum)
  const getBookingDetails = (course) => {
    const isCurriculum = course.type === 'curriculum' || !!course.curriculum;
    if (isCurriculum && course.curriculum) {
      const item = course.curriculum;
      const coverUrl =
        item.coverImage?.url ||
        (Array.isArray(item.images) && (item.images[0]?.url || (typeof item.images[0] === 'string' ? item.images[0] : null))) ||
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
        type: 'curriculum'
      };
    }
    return null;
  };

  // Function to get the appropriate user profile path
  const getUserProfilePath = (course) => {
    if (userInfo?._id === course?.teacher?._id) {
      return '/profile';
    } else {
      return `/user-profile/${course.curriculum?._id || course.curriculum}`;
    }
  };

  return (
    <div className="w-full mt-[32px]">
      {userUnscheduleddata?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-5 gap-6">
          {userUnscheduleddata?.map((course, index) => {
            const details = getBookingDetails(course);
            
            if (!details) return null;

            const isBookmarked = curriculumFavorites.some(
              (fav) => fav?.curriculum?._id === details.id
            );

            const unscheduledLessons = Array.isArray(course.lessonPosition)
              ? course.lessonPosition.filter(
                  (lp) =>
                    (!lp.scheduledAt || lp.status === "pending") &&
                    lp.status !== "cancelled" &&
                    lp.status !== "completed"
                )
              : [];
            const unscheduledCount = unscheduledLessons.length;
            const totalCount = Array.isArray(course.lessonPosition) ? course.lessonPosition.length : 0;

            return (
              <article key={course._id || index} className="mb-4 min-w-0 group flex flex-col">
                {/* Image Container matching Home Screen */}
                <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-gray-100">
                  <button
                    type="button"
                    onClick={() => handleCurriculumClick(course)}
                    className="w-full h-full text-left cursor-pointer"
                  >
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
                  </button>

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

                {/* Details Section matching Home Screen */}
                <div className="pt-2 flex flex-col flex-1">
                  <h3 
                    onClick={() => handleCurriculumClick(course)}
                    className="line-clamp-3 text-base font-semibold leading-[1.22] text-black cursor-pointer hover:text-primary transition-colors"
                  >
                    {details.title}
                  </h3>

                  <p className="mt-1 text-base text-[#6A6A6A]">
                    {formatPrice(course.amount || details.price, details.currency || "USD", cardPriceOptions)} &nbsp;·&nbsp; Curriculum{totalCount > 0 ? ` (${totalCount} lessons)` : ''}
                  </p>

                  {/* Unscheduled badge indicator */}
                  {unscheduledCount > 0 && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium w-fit border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>{unscheduledCount} {unscheduledCount === 1 ? 'lesson' : 'lessons'} unscheduled</span>
                    </div>
                  )}

                  <div className="mt-2">
                    <Link
                      to={getUserProfilePath(course)}
                      className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#f3f3f3] py-1 pl-1 pr-3 text-base text-black hover:bg-gray-200 transition-colors"
                    >
                      <img
                        src={
                          getAvatarUrl(course?.teacher?.image?.url) ||
                          "/default-avatar.svg"
                        }
                        loading="lazy"
                        decoding="async"
                        alt={course.teacher?.name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                      <span className="truncate">
                        {course?.teacher?.name || "Unknown"} ({course?.teacher?.averageRating === 0 ? 100 : course?.teacher?.averageRating ?? 100}%)
                      </span>
                    </Link>
                  </div>

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
                          <span>{unscheduledCount > 0 ? `Schedule Lesson (${unscheduledCount} pending)` : 'Manage Curriculum'}</span>
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
        <div className="w-full bg-[#F5F5F5] p-3 md:p-10 rounded-3xl">
          <p>No Unscheduled Bookings yet</p>
        </div>
      )}
    </div>
  );
}