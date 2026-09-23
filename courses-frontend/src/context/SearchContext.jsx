import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

const SearchContext = createContext(null);

export const SearchProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [locationFilter, setLocationFilter] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState("");
  const [selectedSearchLocation, setSelectedSearchLocation] = useState(null);

  const [selectedType, setSelectedType] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [debouncedMin, setDebouncedMin] = useState(0);
  const [debouncedMax, setDebouncedMax] = useState(100000);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [isOnlineSelected, setIsOnlineSelected] = useState(true);
  const [isInPersonSelected, setIsInPersonSelected] = useState(true);

  // Sync from URL search params on mount or when searchParams change
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam !== null) {
      setSelectedCategory(categoryParam);
      setSearchFilter(categoryParam);
    }

    const searchParam = searchParams.get("search");
    if (searchParam !== null) {
      setSearchInput(searchParam);
      setSearchFilter(searchParam);
    }

    const locParam = searchParams.get("location");
    if (locParam !== null) {
      setLocationFilter(locParam);
    }

    const typeParam = searchParams.get("type");
    if (typeParam !== null) {
      setSelectedType(typeParam);
    }

    const minParam = searchParams.get("minPrice");
    if (minParam !== null && !isNaN(Number(minParam))) {
      setMinPrice(Math.max(0, Number(minParam)));
    }

    const maxParam = searchParams.get("maxPrice");
    if (maxParam !== null && !isNaN(Number(maxParam))) {
      setMaxPrice(Math.max(0, Number(maxParam)));
    }
  }, [searchParams]);

  // Debounce search input/filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchFilter]);

  // Debounce location input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(locationFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [locationFilter]);

  // Debounce min price
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMin(minPrice);
    }, 400);
    return () => clearTimeout(timer);
  }, [minPrice]);

  // Debounce max price
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMax(maxPrice);
    }, 400);
    return () => clearTimeout(timer);
  }, [maxPrice]);

  // If user is on another page, navigate to home page
  const handleSearchSubmit = useCallback(() => {
    if (location.pathname !== "/") {
      navigate("/");
    }
  }, [location.pathname, navigate]);

  const handleLocationChange = useCallback((value) => {
    setLocationFilter(value);
    if (value?.trim() && !isInPersonSelected) {
      setIsInPersonSelected(true);
    }
  }, [isInPersonSelected]);

  const handleLocationSelect = useCallback(({ description, lat, lng }) => {
    const parsedLat = lat !== null && lat !== undefined && lat !== "" && Number.isFinite(Number(lat)) ? Number(lat) : null;
    const parsedLng = lng !== null && lng !== undefined && lng !== "" && Number.isFinite(Number(lng)) ? Number(lng) : null;

    setLocationFilter(description || "");
    setDebouncedLocation(description || "");
    if (description?.trim() && !isInPersonSelected) {
      setIsInPersonSelected(true);
    }
    if (parsedLat !== null && parsedLng !== null) {
      setSelectedSearchLocation({ lat: parsedLat, lng: parsedLng });
    } else {
      setSelectedSearchLocation(null);
    }
  }, [isInPersonSelected]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearchFilter("");
  }, []);

  const clearLocation = useCallback(() => {
    setLocationFilter("");
    setDebouncedLocation("");
    setSelectedSearchLocation(null);
  }, []);

  const resetAllFilters = useCallback(() => {
    setSearchInput("");
    setSearchFilter("");
    setDebouncedSearch("");
    setLocationFilter("");
    setDebouncedLocation("");
    setSelectedSearchLocation(null);
    setSelectedType("");
    setMinPrice(0);
    setMaxPrice(100000);
    setDebouncedMin(0);
    setDebouncedMax(100000);
    setSelectedCategory("");
  }, []);

  return (
    <SearchContext.Provider
      value={{
        searchInput,
        setSearchInput,
        searchFilter,
        setSearchFilter,
        debouncedSearch,
        locationFilter,
        setLocationFilter,
        handleLocationChange,
        debouncedLocation,
        selectedSearchLocation,
        setSelectedSearchLocation,
        handleLocationSelect,
        selectedType,
        setSelectedType,
        minPrice,
        setMinPrice,
        maxPrice,
        setMaxPrice,
        debouncedMin,
        debouncedMax,
        selectedCategory,
        setSelectedCategory,
        isOnlineSelected,
        setIsOnlineSelected,
        isInPersonSelected,
        setIsInPersonSelected,
        handleSearchSubmit,
        clearSearch,
        clearLocation,
        resetAllFilters,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};
