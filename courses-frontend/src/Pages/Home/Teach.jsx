import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Search,
  ChevronRight,
  X,
  SlidersHorizontal,
  DollarSign,
  Plus,
  ArrowRight,
  ListFilter,
} from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import MainLayout from "../../components/MainLayout";
import { CiLocationOn } from "react-icons/ci";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getAllLessons,
  getTeacherLessons,
} from "../../redux/reducers/LessonReducer";
import { getUserFavorites } from "../../redux/reducers/FavoriteReducer";
import Request from "./Components/Request";
import CreateRequestPopup from "./Components/CreateRequestPopup";
import Info from "./Components/Info";
import LessonProposalPopup from "./Components/SendLesson";
import {
  getAllProposes,
  getProposeByUser,
  deletePropose,
} from "../../redux/reducers/ProposeReducer";
import { motion } from "framer-motion";
import LocationAutocomplete from "./Components/LocationAutocomplete";
import { getCategories } from "../../redux/reducers/CategoryReducer";
import CategoriesBar from "./Components/Categories";
import CategoryMobile from "./Components/CategoryMobile";
import SearchBar from "./Components/SearchBar";
import { useCurrency } from "../../currency/CurrencyContext";
import ProfileRequestCard from "../Profile/components/ProfileRequestCard";
import UpdateRequest from "../Profile/Request/UpdateRequest";

const Teach = () => {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.category);
  const { proposes, userProposes } = useSelector((state) => state.propose);
  const { userInfo } = useSelector((state) => state.auth);
  const { favorites } = useSelector((state) => state.favorite);

  const [activeTab, setActiveTab] = useState("All Requests");
  const [editRequestId, setEditRequestId] = useState(null);
  const [showEditRequest, setShowEditRequest] = useState(false);

  const savedProposes = useMemo(() => {
    if (!favorites) return [];
    const list = Array.isArray(favorites)
      ? favorites
      : Array.isArray(favorites?.data)
      ? favorites.data
      : Array.isArray(favorites?.favorites)
      ? favorites.favorites
      : [];
    return list
      .filter((fav) => fav.type === "propose" && fav.propose)
      .map((fav) => fav.propose);
  }, [favorites]);

  const [isOnlineSelected, setIsOnlineSelected] = useState(true);
  const [isInPersonSelected, setIsInPersonSelected] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [locationFilter, setLocationFilter] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState("");
  const [debouncedMin, setDebouncedMin] = useState(min);
  const [debouncedMax, setDebouncedMax] = useState(max);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showLessonPopup, setShowLessonPopup] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showSearchBar, setShowSearchBar] = useState(false);

  const swiperRef = useRef(null);

  useEffect(() => {
    dispatch(getTeacherLessons({ page: 1, limit: 10000 }));
  }, [dispatch]);

  const clearAll = () => {
    setMin(0);
    setMax(100);
    setSearchInput("");
    setSearchFilter("");
    setSelectedCategory("");
    setLimit(12);
    setPage(1);
  };

  const handleTrendingSelect = () => {
    setSelectedCategory("");
    setSearchFilter("");
    setSearchInput("");
    setPage(1);
  };

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchFilter);
      setPage(1); // Reset page
    }, 500);

    return () => clearTimeout(handler);
  }, [searchFilter]);

  // Debounce location
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(locationFilter);
    }, 500);
    return () => clearTimeout(handler);
  }, [locationFilter]);

  // Debounce price range
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMin(min);
    }, 400);
    return () => clearTimeout(handler);
  }, [min]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMax(max);
    }, 400);
    return () => clearTimeout(handler);
  }, [max]);

  const handleModeChange = (value) => {
    if (value === "online") {
      // Toggle online checkbox - if becoming true, uncheck in-person; if becoming false, check online
      if (!isOnlineSelected) {
        setIsOnlineSelected(true);
        setIsInPersonSelected(false);
      } else {
        setIsOnlineSelected(false);
      }
    } else if (value === "in-person") {
      // Toggle in-person checkbox - if becoming true, uncheck online; if becoming false, check in-person
      if (!isInPersonSelected) {
        setIsInPersonSelected(true);
        setIsOnlineSelected(false);
        setLocationFilter("");
      } else {
        setIsInPersonSelected(false);
        setLocationFilter("");
        setDebouncedLocation("");
      }
    }
  };

  const fetchProposes = useCallback(() => {
    let isOnlineFilter = null;
    let supportsInPersonFilter = null;
    let locationParam = "";

    // Handle different filter combinations
    if (isOnlineSelected && isInPersonSelected) {
      // Both selected - show all requests
      isOnlineFilter = null;
      supportsInPersonFilter = null;
    } else if (isOnlineSelected && !isInPersonSelected) {
      // Only online selected - show online requests (includes mixed)
      isOnlineFilter = true;
      supportsInPersonFilter = null;
    } else if (!isOnlineSelected && isInPersonSelected) {
      // Only in-person selected - show in-person requests (includes mixed)
      isOnlineFilter = null;
      supportsInPersonFilter = true;
      locationParam = debouncedLocation.trim();
    } else {
      // Neither selected - default to online
      isOnlineFilter = true;
      supportsInPersonFilter = null;
    }

    dispatch(
      getAllProposes({
        page,
        limit,
        search: debouncedSearch,
        category: selectedCategory,
        minPrice: debouncedMin,
        maxPrice: debouncedMax,
        currency,
        isOnline: isOnlineFilter,
        supportsInPerson: supportsInPersonFilter,
        location: locationParam,
      })
    );
  }, [
    dispatch,
    page,
    limit,
    debouncedSearch,
    selectedCategory,
    debouncedMin,
    debouncedMax,
    currency,
    isOnlineSelected,
    isInPersonSelected,
    debouncedLocation,
  ]);

  useEffect(() => {
    dispatch(getCategories());
    dispatch(getUserFavorites());
  }, [dispatch]);

  // Fetch lessons when filters change
  useEffect(() => {
    fetchProposes();
  }, [fetchProposes]);

  // Fetch user's own requests or favorites when tab is selected
  useEffect(() => {
    if (activeTab === "My Requests" && userInfo) {
      dispatch(getProposeByUser());
    } else if (activeTab === "Saves" && userInfo) {
      dispatch(getUserFavorites());
    }
  }, [activeTab, userInfo, dispatch]);

  const handleEditRequest = (id) => {
    setEditRequestId(id);
    setShowEditRequest(true);
  };

  const handleDeleteRequest = (id) => {
    toast.info(
      <div>
        <p className="font-medium">Are you sure you want to delete?</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              dispatch(deletePropose(id)).then((res) => {
                if (res?.payload?.status) {
                  toast.success("Request deleted successfully");
                  dispatch(getProposeByUser());
                  fetchProposes();
                } else {
                  toast.error(res?.payload?.message || "Failed to delete request");
                }
              });
              toast.dismiss();
            }}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Yes
          </button>

          <button
            onClick={() => toast.dismiss()}
            className="bg-gray-300 px-3 py-1 rounded"
          >
            No
          </button>
        </div>
      </div>,
      { autoClose: false }
    );
  };

  return (
    <MainLayout 
      width="1920px"
      categories={categories}
      selectedCategory={selectedCategory}
      onSelectCategory={(categoryName) => {
        setSelectedCategory(categoryName);
        setSearchInput("");
        setPage(1);
      }}
      onSearchToggle={() => setShowSearchBar(!showSearchBar)}
    >
      {/* Mode Tabs */}
      <div className="flex md:hidden items-center justify-center gap-4 font-medium mb-4 mt-2">
       <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isOnlineSelected}
            onChange={() => handleModeChange("online")}
            className="accent-primary w-4 h-4"
          />
          <span className="text-sm">Online</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer py-2">
          <input
            type="checkbox"
            checked={isInPersonSelected}
            onChange={() => handleModeChange("in-person")}
            className="accent-primary w-4 h-4"
          />
          <span className="text-sm">In-Person</span>
        </label>
                <button
            onClick={() => setShowFilter(true)}
            className="md:hidden flex items-center gap-1 "
          >
            <SlidersHorizontal size={16} className="rotate-90" /> Filter
          </button>
      </div>

      {/* Search Header */}
      {!showSearchBar && (
        <div className="mt-[20px]">
          <h3 className="text-2xl font-normal text-black">Requests</h3>
          
          {/* Tabs like bubble: All Requests, My Requests, and Saves */}
          <div className="w-fit rounded-full overflow-hidden border border-black bg-white p-1 font-medium text-black flex items-center mt-[20px]">
            <button
              type="button"
              onClick={() => setActiveTab("All Requests")}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm transition-colors duration-200 cursor-pointer ${
                activeTab === "All Requests"
                  ? "bg-primary text-white shadow-sm"
                  : "text-black hover:bg-gray-100"
              }`}
            >
              All Requests
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("My Requests")}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm transition-colors duration-200 cursor-pointer ${
                activeTab === "My Requests"
                  ? "bg-primary text-white shadow-sm"
                  : "text-black hover:bg-gray-100"
              }`}
            >
              My Requests
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Saves")}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm transition-colors duration-200 cursor-pointer ${
                activeTab === "Saves"
                  ? "bg-primary text-white shadow-sm"
                  : "text-black hover:bg-gray-100"
              }`}
            >
              Saves
            </button>
          </div>

          {/* Action buttons on next line */}
          <div className="flex items-center justify-start gap-3 mt-[20px]">
            <button
              onClick={() => setShowCreateRequest(true)}
              className="bg-[#E9EAEE] hover:bg-gray-200 text-black px-6 py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              <span>Place a Request</span>
            </button>
            <button
              onClick={() => setShowFilter(true)}
              className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors cursor-pointer"
              title="Filter"
            >
              <ListFilter size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Search Bar - Show/Hide */}
      {showSearchBar && (
        <SearchBar
          searchInput={searchInput}
          onSearchInputChange={(value) => {
            setSearchInput(value);
            setSearchFilter(value);
          }}
          mode={isOnlineSelected && isInPersonSelected ? "both" : isOnlineSelected ? "online" : "in-person"}
          onModeChange={(mode) => {
            if (mode === "online") {
              setIsOnlineSelected(true);
              setIsInPersonSelected(false);
            } else if (mode === "in-person") {
              setIsOnlineSelected(false);
              setIsInPersonSelected(true);
            }
          }}
          locationFilter={locationFilter}
          onLocationChange={setLocationFilter}
          onLocationSelect={({ description }) => {
            setLocationFilter(description || "");
          }}
          onClose={() => setShowSearchBar(false)}
          showMobileLocation={true}
        />
      )}

      {/* Categories Mobile */}
      <CategoryMobile
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(categoryName) => {
          setSelectedCategory(categoryName);
          setSearchInput("");
          setPage(1);
        }}
      />

      {/* Lessons Grid / User Requests / Saved Proposals */}
      {activeTab === "All Requests" ? (
        <Request
          proposes={proposes}
          openCreateLesson={(req) => {
            if (!userInfo) {
              navigate("/login");
              return;
            }
            navigate("/create-lesson", { state: { request: req } });
          }}
          onSendExistingLesson={(req) => {
            setSelectedRequest(req);
            setShowLessonPopup(true);
          }}
        />
      ) : activeTab === "My Requests" ? (
        <div className="w-full mt-[20px] pb-10 space-y-6">
          {!userInfo ? (
            <div className="w-full bg-[#F5F5F5] p-6 md:p-10 rounded-3xl text-center">
              <p className="text-gray-700 mb-3">Please log in to view your requests.</p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Log in
              </button>
            </div>
          ) : userProposes && userProposes.length > 0 ? (
            userProposes.map((req) => (
              <ProfileRequestCard
                key={req._id}
                req={req}
                onEdit={handleEditRequest}
                onDelete={handleDeleteRequest}
              />
            ))
          ) : (
            <div className="w-full bg-[#F5F5F5] p-6 md:p-10 rounded-3xl text-center">
              <p className="text-gray-600 mb-3">No requests found</p>
              <button
                type="button"
                onClick={() => setShowCreateRequest(true)}
                className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Place a request
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Saved Proposals Tab */
        !userInfo ? (
          <div className="w-full mt-[20px] pb-10">
            <div className="w-full bg-[#F5F5F5] p-6 md:p-10 rounded-3xl text-center">
              <p className="text-gray-700 mb-3">Please log in to view your saved requests.</p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Log in
              </button>
            </div>
          </div>
        ) : savedProposes && savedProposes.length > 0 ? (
          <Request
            proposes={savedProposes}
            openCreateLesson={(req) => {
              if (!userInfo) {
                navigate("/login");
                return;
              }
              navigate("/create-lesson", { state: { request: req } });
            }}
            onSendExistingLesson={(req) => {
              setSelectedRequest(req);
              setShowLessonPopup(true);
            }}
          />
        ) : (
          <div className="w-full mt-[20px] pb-10">
            <div className="w-full bg-[#F5F5F5] p-6 md:p-10 rounded-3xl text-center">
              <p className="text-gray-600">No saved proposals found</p>
            </div>
          </div>
        )
      )}

      <LessonProposalPopup
        open={showLessonPopup}
        request={selectedRequest}
        onClose={() => {
          setShowLessonPopup(false);
          setSelectedRequest(null);
        }}
      />

      <CreateRequestPopup
        open={showCreateRequest}
        onClose={() => {
          setShowCreateRequest(false);
          if (userInfo) {
            dispatch(getProposeByUser());
          }
          fetchProposes();
        }}
      />

      {showEditRequest && (
        <UpdateRequest
          id={editRequestId}
          open={showEditRequest}
          onClose={() => {
            setShowEditRequest(false);
            setEditRequestId(null);
            if (userInfo) {
              dispatch(getProposeByUser());
            }
            fetchProposes();
          }}
        />
      )}

      <Info open={showInfo} onClose={() => setShowInfo(false)} />

      {/* Filter Popup */}
      {showFilter && (
        <div className="fixed top-0 left-0 bg-black/20 inset-0 flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, y: -20, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }} className="bg-white w-[90%] md:w-[520px] rounded-xl p-6 shadow-xl relative">
            <div className="grid grid-cols-3 items-center mb-6 w-full">
              <span></span>
              <h2 className="text-lg text-center">Filter</h2>
              <button
                onClick={() => setShowFilter(false)}
                className=" text-gray-500 hover:text-gray-700 h-full flex justify-end"
              >
                <X size={20} />
              </button>
            </div>

            {/* Price Slider */}
            <p className="text-sm font-semibold mb-2">Price range</p>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-gray-600">$0</span>
              <div className="relative w-full h-6 flex items-center">
                {/* Track */}
                <div className="absolute w-full h-1 bg-gray-300 rounded-full"></div>
                
                {/* Active Range */}
                <div 
                  className="absolute h-1 bg-gray-500 rounded-full"
                  style={{
                    left: `${(min / 100) * 100}%`,
                    width: `${((max - min) / 100) * 100}%`
                  }}
                ></div>
                
                {/* Min Thumb */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={min}
                  onChange={(e) => {
                    const val = Math.min(Number(e.target.value), max - 1);
                    setMin(val);
                  }}
                  className="absolute w-full h-full opacity-0 cursor-pointer z-10 pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:appearance-none"
                />
                
                {/* Max Thumb */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={max}
                  onChange={(e) => {
                    const val = Math.max(Number(e.target.value), min + 1);
                    setMax(val);
                  }}
                  className="absolute w-full h-full opacity-0 cursor-pointer z-10 pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:appearance-none"
                />
                
                {/* Custom Thumbs */}
                <div 
                  className="absolute w-4 h-4 bg-gray-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 z-0 pointer-events-none"
                  style={{ left: `${(min / 100) * 100}%` }}
                ></div>
                <div 
                  className="absolute w-4 h-4 bg-gray-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 z-0 pointer-events-none"
                  style={{ left: `${(max / 100) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-600">$100+</span>
            </div>

            {/* Min & Max Inputs */}
            <div className="flex justify-start gap-4 mb-6">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600">Minimum</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={min}
                  onChange={(e) => {
                    const val = Math.min(Math.max(0, Number(e.target.value)), max - 1);
                    setMin(val);
                  }}
                  className="border border-[#ddd] rounded-lg px-3 py-2 w-[100px] mt-1 text-center"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-600">Maximum</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={max}
                  onChange={(e) => {
                    const val = Math.max(Math.min(100, Number(e.target.value)), min + 1);
                    setMax(val);
                  }}
                  className="border border-[#ddd] rounded-lg px-3 py-2 w-[100px] mt-1 text-center"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={clearAll}
                className="px-5 py-2 rounded-lg bg-red-600 text-white font-medium"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowFilter(false)}
                className="px-6 py-2 rounded-lg bg-blue-900 text-white font-medium"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
};

export default Teach;
