import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../redux/api";

export default function ReviewsTabContent({ id, type = "lesson", title, onReviewCountChange }) {
  const { userInfo } = useSelector((state) => state.auth);

  const [reviews, setReviews] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  // Review Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(90);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Slider state
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const containerRef = useRef(null);

  // 1. Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rating/${type}/${id}`);
      if (res.data?.status) {
        setReviews(res.data.rate || []);
        const count = res.data.totalItems || res.data.rate?.length || 0;
        setTotalItems(count);
        if (onReviewCountChange) {
          onReviewCountChange(count);
        }
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch eligibility (only if logged in)
  const fetchEligibility = async () => {
    if (!userInfo?._id) {
      setEligibility(null);
      return;
    }
    try {
      setEligibilityLoading(true);
      const queryParam = type === "lesson" ? `lessonId=${id}` : `curriculumId=${id}`;
      const res = await api.get(`/rating/eligibility?${queryParam}`);
      if (res.data?.status) {
        setEligibility(res.data);
      }
    } catch (err) {
      console.error("Error checking review eligibility:", err);
    } finally {
      setEligibilityLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReviews();
      fetchEligibility();
    }
  }, [id, type, userInfo?._id]);

  // Handle slider mouse/touch
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      let newRating = Math.round((x / rect.width) * 100);
      newRating = Math.max(1, Math.min(100, newRating));
      setRating(newRating);
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  const handleSliderClick = (e) => {
    if (submitting || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let newRating = Math.round((x / rect.width) * 100);
    newRating = Math.max(1, Math.min(100, newRating));
    setRating(newRating);
  };

  const getSatisfactionLabel = (r) => {
    if (r <= 20) return "Very unsatisfied";
    if (r <= 40) return "Unsatisfied";
    if (r <= 60) return "Neutral";
    if (r <= 80) return "Satisfied";
    return "Very satisfied";
  };

  const getProgressColor = (r) => {
    if (r <= 20) return "bg-red-500";
    if (r <= 40) return "bg-orange-500";
    if (r <= 60) return "bg-yellow-500";
    if (r <= 80) return "bg-lime-500";
    return "bg-green-500";
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!description.trim()) {
      toast.error("Please enter your review comments.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("id", id);
      formData.append("rating", rating);
      formData.append("review", description.trim());
      formData.append("type", type);
      if (eligibility?.bookingId) {
        formData.append("bookingId", eligibility.bookingId);
      }
      if (image) {
        formData.append("image", image);
      }

      const res = await api.post(`/rating/${type}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status) {
        toast.success("Thank you! Your review has been posted.");
        setShowModal(false);
        setDescription("");
        setImage(null);
        setRating(90);
        await fetchReviews();
        await fetchEligibility();
      } else {
        toast.error(res.data?.message || "Failed to submit review");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate average rating
  const avgScore = reviews.length > 0
    ? Math.round(reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) / reviews.length)
    : 100;

  return (
    <div className="w-full mt-6">
      {/* Header Summary Banner */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFFBEA] border border-[#FFF7D8] text-[#A76000] shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#F2BE2F" stroke="#F2BE2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.0312 1C13.0666 1 14.6926 5.69969 15.2795 7.50668C15.4141 7.92126 15.7943 8.20684 16.23 8.22162C18.1151 8.28556 23 8.55772 23 9.66144C23 10.7495 19.5188 13.4853 18.0955 14.5583C17.7427 14.8243 17.5982 15.2836 17.734 15.704C18.3132 17.4975 19.7048 22.1483 18.8117 22.8815C17.9323 23.6034 14.1749 20.7486 12.6485 19.5286C12.2692 19.2254 11.7305 19.2251 11.3511 19.528C9.82346 20.7477 6.06764 23.6035 5.25065 22.8815C4.41962 22.1471 5.73815 17.4816 6.28237 15.6949C6.40915 15.2786 6.26319 14.8287 5.91569 14.5668C4.4996 13.4997 1 10.7523 1 9.66144C1 8.55659 5.89498 8.285 7.77586 8.22142C8.20861 8.2068 8.58723 7.92462 8.72415 7.51385C9.32468 5.71216 10.9944 1 12.0312 1Z" />
              </svg>
            </span>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{avgScore}%</span>
                <span className="text-sm font-medium text-gray-500">satisfaction rate</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Based on {totalItems} verified {totalItems === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button depending on status */}
        <div className="flex items-center gap-3">
          {!userInfo?._id ? (
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium shadow-sm transition-colors"
            >
              Log in to leave a review
            </Link>
          ) : eligibilityLoading ? (
            <span className="text-xs text-gray-400 animate-pulse">Checking eligibility...</span>
          ) : eligibility?.hasReviewed ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#008494]/10 border border-[#008494]/25 text-[#008494] text-xs font-medium shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              You reviewed this {type}
            </span>
          ) : eligibility?.canReview ? (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary hover:opacity-90 text-white text-sm font-medium shadow-sm transition-all cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.0312 1C13.0666 1 14.6926 5.69969 15.2795 7.50668C15.4141 7.92126 15.7943 8.20684 16.23 8.22162C18.1151 8.28556 23 8.55772 23 9.66144C23 10.7495 19.5188 13.4853 18.0955 14.5583C17.7427 14.8243 17.5982 15.2836 17.734 15.704C18.3132 17.4975 19.7048 22.1483 18.8117 22.8815C17.9323 23.6034 14.1749 20.7486 12.6485 19.5286C12.2692 19.2254 11.7305 19.2251 11.3511 19.528C9.82346 20.7477 6.06764 23.6035 5.25065 22.8815C4.41962 22.1471 5.73815 17.4816 6.28237 15.6949C6.40915 15.2786 6.26319 14.8287 5.91569 14.5668C4.4996 13.4997 1 10.7523 1 9.66144C1 8.55659 5.89498 8.285 7.77586 8.22142C8.20861 8.2068 8.58723 7.92462 8.72415 7.51385C9.32468 5.71216 10.9944 1 12.0312 1Z" />
              </svg>
              <span>Write a Review</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs font-normal">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Only booked students can review
            </span>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Student Feedback ({totalItems})
        </h3>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-gray-200 rounded mb-1.5"></div>
                    <div className="w-16 h-3 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="w-full h-12 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-gray-200/90 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4 text-[#F2BE2F]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.0312 1C13.0666 1 14.6926 5.69969 15.2795 7.50668C15.4141 7.92126 15.7943 8.20684 16.23 8.22162C18.1151 8.28556 23 8.55772 23 9.66144C23 10.7495 19.5188 13.4853 18.0955 14.5583C17.7427 14.8243 17.5982 15.2836 17.734 15.704C18.3132 17.4975 19.7048 22.1483 18.8117 22.8815C17.9323 23.6034 14.1749 20.7486 12.6485 19.5286C12.2692 19.2254 11.7305 19.2251 11.3511 19.528C9.82346 20.7477 6.06764 23.6035 5.25065 22.8815C4.41962 22.1471 5.73815 17.4816 6.28237 15.6949C6.40915 15.2786 6.26319 14.8287 5.91569 14.5668C4.4996 13.4997 1 10.7523 1 9.66144C1 8.55659 5.89498 8.285 7.77586 8.22142C8.20861 8.2068 8.58723 7.92462 8.72415 7.51385C9.32468 5.71216 10.9944 1 12.0312 1Z" />
              </svg>
            </div>
            <h4 className="text-base font-medium text-gray-900">No reviews yet</h4>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
              Be the first student to complete this {type} and leave your feedback!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => {
              const userName = rev.user?.name || "Student";
              const userAvatar = rev.user?.image?.url;
              const dateStr = rev.createdAt
                ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
                : "";

              return (
                <div
                  key={rev._id}
                  className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Top row: Avatar + (Name, Rating, Date) */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {userAvatar ? (
                          <img
                            src={userAvatar}
                            alt={userName}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-neutral-900 text-white font-semibold text-sm sm:text-base flex items-center justify-center uppercase shrink-0">
                            {userName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex flex-col justify-center space-y-0.5">
                          <p className="text-sm font-semibold text-[#1A2B49] leading-tight truncate">{userName}</p>
                          {rev.rating !== undefined && (
                            <span className="inline-flex items-center gap-1 text-[#1A2B49] text-[11px] font-semibold shrink-0 leading-tight">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#1A2B49] shrink-0">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                              <span>{rev.rating}%</span>
                            </span>
                          )}
                          {dateStr && <span className="text-[11px] font-semibold text-[#1A2B49] block leading-tight">{dateStr}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Attached photo thumbnail above text if available */}
                    {rev.image?.url && (
                      <div className="-mx-5 mb-3 overflow-hidden">
                        <img
                          src={rev.image.url}
                          alt="Student review attachment"
                          onClick={() => setPreviewImageModal(rev.image.url)}
                          className="w-full max-h-56 object-cover cursor-pointer hover:opacity-90 transition"
                        />
                      </div>
                    )}

                    {/* Review text */}
                    {rev.review && (
                      <p className="text-sm text-gray-700 leading-relaxed break-words">
                        {rev.review}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={submitting}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Leave a Review
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Share your feedback for <span className="font-medium text-gray-700">{title}</span>
            </p>

            {/* Satisfaction Slider */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-gray-700">Satisfaction Level</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900">{rating}%</span>
                  <span className="text-xs text-gray-500">({getSatisfactionLabel(rating)})</span>
                </div>
              </div>

              <div
                ref={containerRef}
                onClick={handleSliderClick}
                className="relative h-3.5 bg-gray-100 rounded-full cursor-pointer overflow-visible"
              >
                <div
                  className={`h-full rounded-full ${getProgressColor(rating)} transition-all duration-100`}
                  style={{ width: `${rating}%` }}
                ></div>
                <div
                  ref={sliderRef}
                  onMouseDown={() => setIsDragging(true)}
                  onTouchStart={() => setIsDragging(true)}
                  className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-gray-900 shadow-md cursor-grab active:cursor-grabbing ${submitting ? "opacity-50 pointer-events-none" : ""
                    }`}
                  style={{ left: `${rating}%`, transform: "translate(-50%, -50%)" }}
                ></div>
              </div>

              <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                <span>1% (Poor)</span>
                <span>50% (Neutral)</span>
                <span>100% (Excellent)</span>
              </div>
            </div>

            {/* Description Textarea */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Your Review
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                placeholder="How was your learning experience? What did you like best?"
                className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition resize-none placeholder:text-gray-400"
              ></textarea>
            </div>

            {/* Image Attachment */}
            <div className="mb-6">
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 hover:border-gray-400 rounded-xl text-xs font-medium text-gray-700 cursor-pointer transition">
                <span>📎</span>
                <span>{image ? image.name : "Attach photo (optional)"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setImage(e.target.files[0]);
                  }}
                  className="hidden"
                  disabled={submitting}
                />
              </label>

              {image && (
                <div className="relative inline-block mt-3">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Review attachment preview"
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submitting}
              className="w-full py-3 rounded-full bg-primary hover:opacity-90 text-white text-sm font-medium shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Review</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImageModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              src={previewImageModal}
              alt="Review attachment enlarged"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
