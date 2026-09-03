import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader, Search, X } from "lucide-react";
import { motion as Motion } from "framer-motion";
import api from "../redux/api";
import { useCurrency } from "../currency/CurrencyContext";

const fallbackImage = "https://i.ibb.co/tpV3m2GW/no-image.png";

const getLessonPath = (item) => {
  if (item?.type === "curriculum") return `/curriculum-lesson/${item._id}`;
  return `/lesson-booking/${item._id}`;
};

const normalizeLessons = (data) => {
  const lessons = data?.independentLessons || [];
  const curriculum = data?.curriculumList || [];

  return [
    ...lessons.map((lesson) => ({ ...lesson, resultType: "Lesson", path: getLessonPath(lesson) })),
    ...curriculum.map((course) => ({
      ...course,
      resultType: "Curriculum",
      type: "curriculum",
      path: getLessonPath({ ...course, type: "curriculum" }),
    })),
  ].slice(0, 5);
};

const formatDuration = (item) => {
  if (item?.resultType === "Curriculum") {
    return item?.totalLesson ? `${item.totalLesson} lessons` : "Curriculum";
  }
  return item?.duration ? String(item.duration).replace(/\bm\b/g, "min") : item?.resultType;
};

const getLocationLabel = (item) => {
  if (item?.isOnline && item?.supportsInPerson) {
    return item?.location ? `Online / In-person - ${item.location}` : "Online / In-person";
  }
  if (item?.isOnline) return "Online";
  return item?.location || item?.address || "In-person";
};

const ResultRow = ({ item, onSelect }) => {
  const { formatPrice } = useCurrency();
  const priceLabel = formatPrice(item?.price ?? 0, item?.currency || "USD", {
    currencyDisplay: "narrowSymbol",
  });

  return (
    <Link
      to={item.path}
      onClick={onSelect}
      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50"
    >
      <img
        src={item?.coverImage?.url || item?.images?.[0]?.url || fallbackImage}
        alt={item?.title || item.resultType}
        className="h-16 w-16 shrink-0 rounded-lg object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-black">{item?.title || "Untitled"}</p>
        <p className="truncate text-xs text-gray-500">
          {item.resultType}
          {item?.category ? ` - ${item.category}` : ""}
          {item?.createdBy?.name ? ` - ${item.createdBy.name}` : ""}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
          <span className="font-semibold text-black">{priceLabel}</span>
          <span>{formatDuration(item)}</span>
          <span className="max-w-full truncate">{getLocationLabel(item)}</span>
        </div>
      </div>
    </Link>
  );
};

export default function HeaderSearchOverlay({ open, onClose }) {
  const { currency } = useCurrency();
  const [query, setQuery] = useState("");
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOnlineSelected, setIsOnlineSelected] = useState(true);
  const [isInPersonSelected, setIsInPersonSelected] = useState(true);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const inputRef = useRef(null);

  const trimmedQuery = query.trim();
  const hasResults = lessons.length > 0;

  const searchParams = useMemo(() => {
    const params = new URLSearchParams({
      page: "1",
      limit: "5",
      search: trimmedQuery,
      currency,
    });
    const min = Number(minPrice);
    const max = Number(maxPrice);

    if (isOnlineSelected && !isInPersonSelected) {
      params.append("isOnline", "true");
    }
    if (isInPersonSelected && !isOnlineSelected) {
      params.append("supportsInPerson", "true");
    }
    if (Number.isFinite(min) && Number.isFinite(max) && minPrice !== "" && maxPrice !== "") {
      params.append("minPrice", String(min));
      params.append("maxPrice", String(max));
    }

    return params.toString();
  }, [currency, isInPersonSelected, isOnlineSelected, maxPrice, minPrice, trimmedQuery]);

  useEffect(() => {
    if (!open) return;

    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setLessons([]);
      setError("");
      setIsOnlineSelected(true);
      setIsInPersonSelected(true);
      setMinPrice("");
      setMaxPrice("");
      return;
    }

    if (!trimmedQuery) {
      setLessons([]);
      setError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const lessonResponse = await api.get(`/lessons/get-lesson?${searchParams}`, {
          signal: controller.signal,
        });

        setLessons(normalizeLessons(lessonResponse.data));
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        setError("Unable to load suggestions.");
        setLessons([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, searchParams, trimmedQuery]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/20 px-3 pt-20 md:pt-24"
      onClick={onClose}
    >
      <Motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search lessons and curricula"
            className="w-full bg-transparent text-base font-semibold text-black outline-none placeholder:text-gray-400"
          />
          {loading && <Loader className="h-5 w-5 shrink-0 animate-spin text-gray-400" />}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 md:grid-cols-[auto_auto_1fr_1fr] md:items-center">
          <label className="flex items-center gap-2 text-sm font-semibold text-black">
            <input
              type="checkbox"
              checked={isOnlineSelected}
              onChange={() => setIsOnlineSelected((current) => !current)}
              className="h-4 w-4 accent-black"
            />
            Online
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-black">
            <input
              type="checkbox"
              checked={isInPersonSelected}
              onChange={() => setIsInPersonSelected((current) => !current)}
              className="h-4 w-4 accent-black"
            />
            In-person
          </label>
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Min price"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-black"
          />
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Max price"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>

        <div className="mt-4 max-h-[65vh] overflow-y-auto">
          {!trimmedQuery && (
            <p className="px-2 py-6 text-center text-sm text-gray-500">
              Start typing a topic to see lesson and curriculum suggestions.
            </p>
          )}

          {error && <p className="px-2 py-6 text-center text-sm text-red-500">{error}</p>}

          {trimmedQuery && !loading && !error && !hasResults && (
            <p className="px-2 py-6 text-center text-sm text-gray-500">No suggestions found.</p>
          )}

          {lessons.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                Lessons
              </p>
              <div className="space-y-1">
                {lessons.map((item) => (
                  <ResultRow key={`${item.resultType}-${item._id}`} item={item} onSelect={onClose} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Motion.div>
    </div>
  );
}
