import { useEffect, useRef, useState } from "react";
import { ChevronDown, CircleDollarSign, ListFilter, MapPin, Search, X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import LocationAutocomplete from "./LocationAutocomplete";
import { useCurrency } from "../../../currency/CurrencyContext";

export default function SearchCategoryToolbar({
  title = "Learn anything",
  categories = [],
  selectedCategory = "",
  onSelectCategory,
  searchInput = "",
  onSearchChange,
  locationFilter = "",
  onLocationChange,
  onLocationSelect,
  minPrice = 0,
  maxPrice = 100000,
  onMinPriceChange,
  onMaxPriceChange,
  showTypeFilter = false,
  selectedType = "",
  onTypeChange,
}) {
  const { currency, symbol } = useCurrency();
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [showTypeFilterMenu, setShowTypeFilterMenu] = useState(false);
  const popupRef = useRef(null);
  const typeFilterRef = useRef(null);

  useEffect(() => {
    if (!showPriceFilter) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowPriceFilter(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showPriceFilter]);

  useEffect(() => {
    if (!showTypeFilterMenu) return;
    const closeMenu = (event) => {
      if (!typeFilterRef.current?.contains(event.target)) setShowTypeFilterMenu(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [showTypeFilterMenu]);

  const changeLocation = (value) => onLocationChange?.(value);

  return (
    <section className="mb-5 mt-5 min-w-0 w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-11.5 w-full items-center gap-2 rounded-full border border-black px-5 sm:max-w-[560px]">
          <Search size={16} aria-hidden="true" />
          <input
            value={searchInput}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-black"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              className="shrink-0 rounded-full p-1 transition-colors hover:bg-gray-100"
              aria-label="Clear search"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </label>

        <div className="relative flex h-11.5 w-full items-center gap-2 rounded-full border border-black px-5 sm:max-w-[225px]">
          <LocationAutocomplete
            value={locationFilter}
            onChange={changeLocation}
            onSelectDetails={onLocationSelect}
            placeholder="Location"
            variant="type"
            leadingIcon={<MapPin size={16} aria-hidden="true" />}
            positionRelative={false}
            className="min-w-0 flex-1 bg-transparent p-0 text-sm font-medium text-black outline-none placeholder:text-black"
          />
          {locationFilter && (
            <button
              type="button"
              onClick={() => changeLocation("")}
              className="shrink-0 rounded-full p-1 transition-colors hover:bg-gray-100"
              aria-label="Clear location"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {showTypeFilter && (
          <div ref={typeFilterRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowTypeFilterMenu((current) => !current)}
              className={`flex h-11.5 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors ${
                selectedType ? "border-primary bg-primary text-white" : "border-black bg-white text-black"
              }`}
            >
              {selectedType === "lesson"
                ? "Lesson"
                : selectedType === "curriculum"
                  ? "Curriculum"
                  : "Type"}
              <ChevronDown size={16} className={showTypeFilterMenu ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {showTypeFilterMenu && (
              <div className="absolute left-0 top-full z-50 mt-2 min-w-36 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg space-y-1">
                {[
                  { value: "", label: "All" },
                  { value: "lesson", label: "Lesson" },
                  { value: "curriculum", label: "Curriculum" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onTypeChange?.(option.value);
                      setShowTypeFilterMenu(false);
                    }}
                    className={`block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium ${
                      selectedType === option.value ? "bg-primary text-white" : "text-black hover:bg-gray-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowPriceFilter(true)}
          className="flex h-11.5 w-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Open price filters"
        >
          <ListFilter size={20} />
        </button>
      </div>

      <div className="relative min-w-0 w-full overflow-hidden">
      <Swiper
        className="category-free-slider mt-5 !overflow-visible pb-2 select-none"
        modules={[FreeMode, Mousewheel]}
       spaceBetween={12}
              slidesPerView="auto"
      >
        <SwiperSlide className="!w-auto">
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectCategory?.("")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelectCategory?.("");
            }}
            className={`flex h-9 cursor-grab select-none items-center rounded-full border px-6 text-sm font-medium transition-colors active:cursor-grabbing ${
              !selectedCategory ? "border-primary bg-primary text-white" : "border-black bg-white text-black"
            }`}
          >
            Trending
          </div>
        </SwiperSlide>
        {categories.map((category) => (
          <SwiperSlide className="!w-auto" key={category._id || category.name}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelectCategory?.(category.name)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelectCategory?.(category.name);
              }}
              className={`flex h-9 cursor-grab select-none items-center rounded-full border px-5 text-sm font-medium transition-colors active:cursor-grabbing ${
                selectedCategory === category.name
                  ? "border-primary bg-primary text-white"
                  : "border-black bg-white text-black"
              }`}
            >
              {category.name}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent" />
      </div>

      {showPriceFilter && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowPriceFilter(false);
          }}
        >
          <div ref={popupRef} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                Price range
                <span className="text-sm font-medium text-gray-500">({currency})</span>
              </h2>
              <button type="button" onClick={() => setShowPriceFilter(false)} aria-label="Close price filters">
                <X size={22} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-semibold">
                Minimum
                <span className="mt-2 flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-black">
                  <span className="shrink-0 text-gray-500" aria-hidden="true">{symbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(event) => onMinPriceChange?.(Math.max(0, Number(event.target.value)))}
                    className="min-w-0 w-full bg-transparent px-2 py-2 outline-none"
                  />
                </span>
              </label>
              <label className="text-sm font-semibold">
                Maximum
                <span className="mt-2 flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-black">
                  <span className="shrink-0 text-gray-500" aria-hidden="true">{symbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) => onMaxPriceChange?.(Math.max(0, Number(event.target.value)))}
                    className="min-w-0 w-full bg-transparent px-2 py-2 outline-none"
                  />
                </span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => setShowPriceFilter(false)}
              className="mt-6 h-10 w-full rounded-full bg-primary font-semibold text-white"
            >
              Apply filters
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
