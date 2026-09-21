import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Star, MessageSquarePlus, CheckCircle2, Lock, ChevronDown } from "lucide-react";
import api from "../../../redux/api";
import { getCurriculumRating } from "../../../redux/reducers/FavoriteReducer";

export default function ReviewsColumn({ id, title, type = "curriculum", onReviewCountChange }) {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { curriReviews } = useSelector((state) => state.favorite);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [isColumnOpen, setIsColumnOpen] = useState(true);
  const [collapsedReviewIds, setCollapsedReviewIds] = useState(new Set());

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

  // Sync with Redux curriReviews or fetch directly
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rating/${type}/${id}`);
      if (res.data?.status) {
        const list = res.data.rate || [];
        setReviews(list);
        if (onReviewCountChange) {
          onReviewCountChange(list.length);
        }
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (curriReviews && Array.isArray(curriReviews)) {
      setReviews(curriReviews);
    }
  }, [curriReviews]);

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
        toast.success(res.data.message || "Review submitted successfully!");
        setShowModal(false);
        setDescription("");
        setImage(null);
        setRating(90);
        fetchReviews();
        fetchEligibility();
        dispatch(getCurriculumRating(id));
      } else {
        toast.error(res.data?.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Review submit error:", err);
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReviewCollapse = (revId) => {
    setCollapsedReviewIds((prev) => {
      const next = new Set(prev);
      if (next.has(revId)) {
        next.delete(revId);
      } else {
        next.add(revId);
      }
      return next;
    });
  };

  return (
    <>
      {/* 6th COLUMN WRAPPER: Unit-style separate bubble layout */}
      <div className="w-full space-y-3 xl:max-h-[calc(100vh-190px)] xl:overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
        {/* Unit-style Collapsible Header Bubble */}
        <button
          type="button"
          onClick={() => setIsColumnOpen(!isColumnOpen)}
          className="w-full bg-[#E9EAEE] rounded-[18px] sm:rounded-[20px] px-4 sm:px-5 py-3 flex justify-between items-center text-left text-[#1A2B49] shadow-none hover:bg-[#dfe1e6] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg md:text-xl font-semibold text-[#1A2B49]">
              Reviews
            </span>
            <span className="text-xs font-semibold text-[#1A2B49] bg-white/70 px-2.5 py-0.5 rounded-full">
              {reviews.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {eligibility?.canReview && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-medium px-3 py-1 rounded-full transition-colors cursor-pointer shadow-sm"
              >
                <MessageSquarePlus size={12} />
                <span>Review</span>
              </span>
            )}
            <ChevronDown
              className={`transition-transform duration-200 text-gray-700 ${
                isColumnOpen ? "rotate-180" : ""
              }`}
              size={20}
            />
          </div>
        </button>

        {/* User status badges */}
        {!userInfo?._id ? (
          <Link
            to="/login"
            className="text-[11px] text-gray-600 hover:text-black underline flex items-center gap-1 px-1"
          >
            <Lock size={11} /> Log in to review after booking
          </Link>
        ) : eligibilityLoading ? (
          <span className="text-[11px] text-gray-400 animate-pulse px-1">Checking status...</span>
        ) : eligibility?.hasReviewed ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium px-1">
            <CheckCircle2 size={12} /> You reviewed this curriculum
          </span>
        ) : null}

        {/* Reviews List: Displayed when isColumnOpen is true */}
        {isColumnOpen && (
          <>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-[#E9EAEE] rounded-[20px] p-4 animate-pulse space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-300" />
                      <div className="h-3 w-20 bg-gray-300 rounded" />
                    </div>
                    <div className="h-10 bg-gray-300/50 rounded-lg w-full" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-[#E9EAEE] rounded-[20px] p-6 text-center flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-[#F2BE2F]">
                  <Star size={20} fill="#F2BE2F" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#1A2B49]">No reviews yet</p>
                <p className="text-[11px] text-gray-600 max-w-[200px] leading-relaxed">
                  Reviews from students will appear here once lessons are completed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev, index) => {
                  const revId = rev._id || rev.id || `rev-${index}`;
                  const isCollapsed = collapsedReviewIds.has(revId);
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
                      key={revId}
                      className="w-full bg-[#E9EAEE] rounded-[20px] p-3.5 sm:p-4 shadow-none flex flex-col space-y-2.5 transition-all"
                    >
                      {/* Top user row - clickable to collapse/expand review details */}
                      <div
                        onClick={() => toggleReviewCollapse(revId)}
                        className="flex items-center justify-between gap-2 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {userAvatar ? (
                            <img
                              src={userAvatar}
                              alt={userName}
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/80"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#1A2B49] text-white font-medium text-xs flex items-center justify-center uppercase shrink-0">
                              {userName.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1A2B49] truncate">{userName}</p>
                            {dateStr && <span className="text-[10px] text-gray-500 block">{dateStr}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Rating badge */}
                          {rev.rating !== undefined && (
                            <span className="inline-flex items-center gap-1 bg-[#FFFBEA] border border-[#FFF7D8] text-[#A76000] px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0">
                              <Star size={10} className="fill-[#F2BE2F] text-[#F2BE2F]" />
                              <span>{rev.rating}%</span>
                            </span>
                          )}
                          <ChevronDown
                            size={16}
                            className={`text-gray-700 transition-transform duration-200 ${
                              isCollapsed ? "" : "rotate-180"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Review Details (collapsible) */}
                      {!isCollapsed && (
                        <div className="space-y-2 pt-0.5">
                          {rev.review && (
                            <p className="text-xs text-[#1A2B49] leading-relaxed break-words [overflow-wrap:anywhere]">
                              {rev.review}
                            </p>
                          )}

                          {/* Optional Image */}
                          {rev.image?.url && (
                            <div className="mt-1">
                              <img
                                src={rev.image.url}
                                alt="Review attachment"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImageModal(rev.image.url);
                                }}
                                className="w-full max-h-36 object-cover rounded-xl cursor-pointer hover:opacity-90 transition border border-black/5"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* WRITE A REVIEW MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={submitting}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
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
                />
                <div
                  ref={sliderRef}
                  onMouseDown={() => setIsDragging(true)}
                  onTouchStart={() => setIsDragging(true)}
                  className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-gray-900 shadow-md cursor-grab active:cursor-grabbing ${submitting ? "opacity-50 pointer-events-none" : ""
                    }`}
                  style={{ left: `${rating}%`, transform: "translate(-50%, -50%)" }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                <span>1% (Poor)</span>
                <span>50% (Neutral)</span>
                <span>100% (Excellent)</span>
              </div>
            </div>

            {/* Description */}
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
              />
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

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submitting}
                className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-medium shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL IMAGE PREVIEW MODAL */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              src={previewImageModal}
              alt="Enlarged review photo"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-4 right-4 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
