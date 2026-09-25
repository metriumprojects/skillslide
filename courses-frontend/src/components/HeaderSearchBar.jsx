import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { ChevronDown, ListFilter, MapPin, Search, X } from "lucide-react";
import { useSearch } from "../context/SearchContext";
import { useCurrency } from "../currency/CurrencyContext";
import LocationAutocomplete from "../Pages/Home/Components/LocationAutocomplete";

export default function HeaderSearchBar() {
  const location = useLocation();
  const { currency, symbol } = useCurrency();
  const {
    searchInput,
    setSearchInput,
    setSearchFilter,
    locationFilter,
    handleLocationChange,
    handleLocationSelect,
    clearSearch,
    clearLocation,
    selectedType,
    setSelectedType,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    handleSearchSubmit,
  } = useSearch();

  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [showTypeFilterMenu, setShowTypeFilterMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLocationFocused, setIsLocationFocused] = useState(false);
  const searchInputRef = useRef(null);
  const typeFilterRef = useRef(null);
  const typeMenuDropdownRef = useRef(null);
  const popupRef = useRef(null);
  const [typeMenuPos, setTypeMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleFocusSearch = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        searchInputRef.current?.focus();
      }, 50);
    };

    window.addEventListener("focus-header-search", handleFocusSearch);

    return () => {
      window.removeEventListener("focus-header-search", handleFocusSearch);
    };
  }, []);

  useEffect(() => {
    if (!showTypeFilterMenu) return;
    const updatePosition = () => {
      if (typeFilterRef.current) {
        const rect = typeFilterRef.current.getBoundingClientRect();
        const menuWidth = 144;
        let left = rect.left;
        if (left + menuWidth > window.innerWidth - 12) {
          left = Math.max(12, window.innerWidth - menuWidth - 12);
        }
        setTypeMenuPos({
          top: rect.bottom + 6,
          left: Math.max(8, left),
        });
      }
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showTypeFilterMenu]);

  // Close price filter on Escape
  useEffect(() => {
    if (!showPriceFilter) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowPriceFilter(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showPriceFilter]);

  // Close type menu when clicking outside
  useEffect(() => {
    if (!showTypeFilterMenu) return;
    const closeMenu = (event) => {
      if (
        !typeFilterRef.current?.contains(event.target) &&
        !typeMenuDropdownRef.current?.contains(event.target)
      ) {
        setShowTypeFilterMenu(false);
      }
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [showTypeFilterMenu]);

  const hasActivePriceFilter = minPrice > 0 || maxPrice < 100000;

  return (
    <>
      <div className="flex items-center justify-start gap-2 xl:gap-3 shrink-0">
        {/* Search Input */}
        <label
          className={`flex h-11.5 w-[280px] xl:w-[380px] 2xl:w-[460px] shrink-0 items-center gap-2 rounded-full border-black px-4 xl:px-5 transition-all ${
            isSearchFocused ? "border-[2px]" : "border-[1.5px]"
          } focus-within:border-[2px]`}
        >
          <Search
            size={16}
            strokeWidth={isSearchFocused ? 2.5 : 2}
            className="shrink-0 text-black transition-all"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            id="header-search-input"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setSearchFilter(event.target.value);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearchSubmit();
              }
            }}
            placeholder="Search"
            className={`min-w-0 flex-1 bg-transparent text-sm outline-none text-[#1A2B49] transition-all ${
              isSearchFocused
                ? "font-semibold placeholder:font-semibold placeholder:text-[#1A2B49]"
                : "font-medium placeholder:font-medium placeholder:text-[#1A2B49]"
            }`}
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="shrink-0 rounded-full p-1 transition-colors hover:bg-gray-100"
              aria-label="Clear search"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </label>

        {/* Location Input */}
        <div
          className={`relative flex h-11.5 w-[140px] xl:w-[200px] shrink-0 items-center gap-2 rounded-full border-black px-3 xl:px-4 transition-all ${
            isLocationFocused ? "border-[2px]" : "border-[1.5px]"
          } focus-within:border-[2px]`}
        >
          <LocationAutocomplete
            value={locationFilter}
            onChange={handleLocationChange}
            onSelectDetails={(details) => {
              handleLocationSelect(details);
              handleSearchSubmit();
            }}
            placeholder="Location"
            variant="type"
            leadingIcon={
              <MapPin
                size={16}
                strokeWidth={isLocationFocused ? 2.5 : 2}
                className="text-[#1A2B49] transition-all"
                aria-hidden="true"
              />
            }
            onFocus={() => setIsLocationFocused(true)}
            onBlur={() => setIsLocationFocused(false)}
            isFocused={isLocationFocused}
            positionRelative={false}
            className={`min-w-0 flex-1 bg-transparent p-0 text-sm text-[#1A2B49] outline-none placeholder:text-[#1A2B49] transition-all ${
              isLocationFocused
                ? "font-semibold placeholder:font-semibold"
                : "font-medium placeholder:font-medium"
            }`}
          />
          {locationFilter && (
            <button
              type="button"
              onClick={clearLocation}
              className="shrink-0 rounded-full p-1 transition-colors hover:bg-gray-100"
              aria-label="Clear location"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Type Filter */}
        <div ref={typeFilterRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowTypeFilterMenu((current) => !current)}
            className={`flex h-11.5 items-center gap-2 rounded-full border-[1.5px] px-5 text-sm font-medium transition-colors ${
              selectedType ? "border-primary bg-primary text-white" : "border-black bg-white text-black"
            }`}
          >
            {selectedType === "lesson"
              ? "Lessons"
              : selectedType === "curriculum"
                ? "Curriculums"
                : "Lesson type"}
            <ChevronDown size={16} className={showTypeFilterMenu ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
          {showTypeFilterMenu &&
            createPortal(
              <div
                ref={typeMenuDropdownRef}
                style={{
                  position: "fixed",
                  top: `${typeMenuPos.top}px`,
                  left: `${typeMenuPos.left}px`,
                }}
                className="z-[9999] min-w-36 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-2xl space-y-1"
              >
                {[
                  { value: "", label: "All" },
                  { value: "lesson", label: "Lessons" },
                  { value: "curriculum", label: "Curriculums" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSelectedType(option.value);
                      setShowTypeFilterMenu(false);
                      handleSearchSubmit();
                    }}
                    className={`block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium cursor-pointer transition-colors ${
                      selectedType === option.value ? "bg-primary text-white" : "text-black hover:bg-gray-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>,
              document.body
            )}
        </div>

        {/* Price Filter Trigger */}
        <button
          type="button"
          onClick={() => setShowPriceFilter(true)}
          className={`flex h-11.5 shrink-0 items-center justify-center gap-2 rounded-full border-[1.5px] px-4 xl:px-5 text-sm font-medium transition-colors ${
            hasActivePriceFilter
              ? "border-primary bg-primary text-white"
              : "border-black bg-white text-black hover:bg-gray-50"
          }`}
          aria-label="Open price filters"
          title="Price range"
        >
          <ListFilter size={18} />
          <span>Price Range</span>
        </button>
      </div>

      {/* Price Filter Modal */}
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
                    onChange={(event) => setMinPrice(Math.max(0, Number(event.target.value)))}
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
                    onChange={(event) => setMaxPrice(Math.max(0, Number(event.target.value)))}
                    className="min-w-0 w-full bg-transparent px-2 py-2 outline-none"
                  />
                </span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowPriceFilter(false);
                handleSearchSubmit();
              }}
              className="mt-6 h-10 w-full rounded-full bg-primary font-semibold text-white transition-opacity hover:opacity-90"
            >
              Apply filters
            </button>
          </div>
        </div>
      )}
    </>
  );
}
