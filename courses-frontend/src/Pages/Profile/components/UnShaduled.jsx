import React, { useEffect, useState } from "react";
import { BiSolidZap } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { userUnscheduledBookings } from "../../../redux/reducers/BookingReducer";
import { getUserFavorites, toggleFavorite } from "../../../redux/reducers/FavoriteReducer";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { toast } from "react-toastify";
import { useCurrency } from "../../../currency/CurrencyContext";

export default function UnShaduled() {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userUnscheduleddata } = useSelector((state) => state.book);
  const { favorites } = useSelector((state) => state.favorite);
  const { formatPrice } = useCurrency();
  const cardPriceOptions = { currencyDisplay: "narrowSymbol" };

  useEffect(() => {
    dispatch(userUnscheduledBookings({ page: 1, limit: 20 }));
    dispatch(getUserFavorites());
  }, [dispatch]);

  const curriculumFavorites = Array.isArray(favorites)
    ? favorites.filter((fav) => fav?.curriculum)
    : favorites?.curriculums || [];

  const lessonFavorites = Array.isArray(favorites)
    ? favorites.filter((fav) => fav?.lesson)
    : favorites?.lessons || [];

  const handleSave = (itemId, itemType) => {
    dispatch(toggleFavorite({ id: itemId, type: itemType })).then((res) => {
      if (res?.payload?.status) {
        dispatch(getUserFavorites());
      } else {
        toast.info(res?.payload?.message || "Unable to update favorite");
      }
    });
  };

  const handleManage = async (path, bookId, lessonId, type, isGroup = false) => {
    localStorage.setItem('bookId', bookId);
    localStorage.setItem('lId', lessonId);
    localStorage.setItem('type', type);
    const urlWithGroup = `${path}${path.includes('?') ? '&' : '?'}group=${isGroup}`;
    await navigate(urlWithGroup);
  };

  const handleCurriculumClick = (course) => {
    if (course.type === 'curriculum') {
      navigate(`/after-payment-curri/${course._id}?manage=true`);
    } else {
      handleManage(`/manage-lesson/${course.lesson?._id}`, course._id, course.lesson?._id, "lesson", course.group || false);
    }
  };

  // Function to get booking details based on type
  const getBookingDetails = (course) => {
    if (course.type === 'curriculum' && course.curriculum) {
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
    } else if (course.type === 'lesson' && course.lesson) {
      const item = course.lesson;
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
        duration: item.duration,
        price: item.price,
        currency: item.currency,
        type: 'lesson'
      };
    }
    return null;
  };

  // Function to get the appropriate user profile path
  const getUserProfilePath = (course, details) => {
    if (userInfo?._id === course?.teacher?._id) {
      return '/profile';
    } else if (details?.type === 'curriculum') {
      return `/user-profile/${course.curriculum?._id}`;
    } else {
      return `/user-profile/${course.lesson?._id}`;
    }
  };

  return (
    <div className="w-full mt-6">
      {userUnscheduleddata?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-5 gap-6">
          {userUnscheduleddata?.map((course, index) => {
            const details = getBookingDetails(course);
            
            if (!details) return null;

            const isBookmarked = details.type === 'curriculum'
              ? curriculumFavorites.some((fav) => fav?.curriculum?._id === details.id)
              : lessonFavorites.some((fav) => fav?.lesson?._id === details.id);

            const targetLink = details.type === 'curriculum'
              ? `/curriculum-booking/${details.id}`
              : `/lesson-booking/${details.id}`;

            return (
              <article key={course._id || index} className="mb-4 min-w-0 group flex flex-col">
                {/* Image Container matching Home Screen */}
                <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-gray-100">
                  <Link to={targetLink}>
                    <img
                      src={
                        details.coverImage?.url ||
                        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80"
                      }
                      alt={details.title}
                      loading="lazy"
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

                {/* Details Section matching Home Screen */}
                <div className="pt-2 flex flex-col flex-1">
                  <h3 className="line-clamp-3 text-base font-semibold leading-[1.22] text-black">
                    {details.title}
                  </h3>

                  <p className="mt-1 text-base text-[#6A6A6A]">
                    {formatPrice(course.amount || details.price, details.currency || "USD", cardPriceOptions)} &nbsp;·&nbsp; {details.type === 'curriculum' ? 'Curriculum' : `${details.duration || 60} min lesson`}
                  </p>

                  <div className="mt-2">
                    <Link
                      to={getUserProfilePath(course, details)}
                      className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#f3f3f3] py-1 pl-1 pr-3 text-base text-black hover:bg-gray-200 transition-colors"
                    >
                      <img
                        src={
                          course?.teacher?.image?.url ||
                          "https://i.ibb.co/tpV3m2GW/no-image.png"
                        }
                        loading="lazy"
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
                      onClick={() => handleCurriculumClick(course)}
                      className="w-full bg-primary hover:bg-[#e03e00] text-white text-base font-medium py-2.5 rounded-full flex justify-center items-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      {details.type === 'curriculum' ? 'Manage Curriculum' : 'Schedule Lesson'}
                      <BiSolidZap className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">No Unscheduled Bookings yet</p>
      )}
    </div>
  );
}