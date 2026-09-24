import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserFavorites, toggleFavorite } from "../../../redux/reducers/FavoriteReducer";
import Card from "../../Home/Components/Card";
import CurriculumCard from "../../Home/Components/CurriculumCard";
import { toast } from "react-toastify";
import RequestCard from "../../Home/Components/RequestCard";

export default function BookMark({ onSendExistingLesson = () => {} }) {
  const dispatch = useDispatch();
  const { favorites } = useSelector((state) => state.favorite);
  const [openPropose, setOpenPropose] = useState(null);
  const [activeTab, setActiveTab] = useState("Curriculums");

  useEffect(() => {
    dispatch(getUserFavorites());
  }, [dispatch]);

  const handleSave = (itemId, itemType) => {
    dispatch(toggleFavorite({ id: itemId, type: itemType })).then((res) => {
      if (res.payload?.status) {
        toast.success(res.payload.message || "Removed from favorites");
        dispatch(getUserFavorites());
      } else {
        toast.info(res.payload?.message);
      }
    });
  };

  // Safe array check and conversion
  const favoritesArray = useMemo(() => {
    if (!favorites) return [];
    if (Array.isArray(favorites)) return favorites;
    
    // If favorites is an object, try to extract an array from it
    if (typeof favorites === 'object') {
      if (favorites.data && Array.isArray(favorites.data)) return favorites.data;
      if (favorites.favorites && Array.isArray(favorites.favorites)) return favorites.favorites;
      if (favorites.items && Array.isArray(favorites.items)) return favorites.items;
      
      // If it's an object with numeric keys, convert to array
      if (Object.keys(favorites).every(key => !isNaN(key))) {
        return Object.values(favorites);
      }
    }
    return [];
  }, [favorites]);

  // Separate favorites by type
  const curriculumFavorites = favoritesArray.filter(fav => fav.type === "curriculum" && fav.curriculum);
  const lessonFavorites = favoritesArray.filter(fav => fav.type === "lesson" && fav.lesson);
  const proposeFavorites = favoritesArray.filter(fav => fav.type === "propose" && fav.propose);

  const hasFavorites =
    curriculumFavorites.length > 0 ||
    lessonFavorites.length > 0 ||
    proposeFavorites.length > 0;

  const tabs = [
    "Curriculums",
    "Lessons",
    ...(proposeFavorites.length > 0 ? ["Proposals"] : []),
  ];

  return (
    <div className="w-full">
      {!hasFavorites ? (
        <div className="text-center py-16 mt-[32px]">
          <p className="text-gray-500 text-lg">No favorites yet</p>
        </div>
      ) : (
        <div className="w-full">
          {/* Tabs Navigation matching All My Bookings design */}
          <div className="flex gap-6 justify-start text-sm sm:text-base font-medium mt-[32px] mb-[32px]">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "border-b-2 border-black text-black font-semibold"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Curriculum Tab Content */}
          {activeTab === "Curriculums" && (
            <div>
              {curriculumFavorites.length > 0 ? (
                <div className="max-w-[2800px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {curriculumFavorites.map((favorite) => (
                    <CurriculumCard key={favorite._id} course={favorite.curriculum} />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <p>No bookmarked curriculums yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Lesson Tab Content */}
          {activeTab === "Lessons" && (
            <div>
              {lessonFavorites.length > 0 ? (
                <div className="max-w-[2800px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {lessonFavorites.map((favorite) => (
                    <Card key={favorite._id} course={favorite.lesson} favorites={favorites} />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <p>No bookmarked lessons yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Proposals Tab Content */}
          {activeTab === "Proposals" && (
            <div className="space-y-6">
              {proposeFavorites.length > 0 ? (
                proposeFavorites.map((favorite) => (
                  <RequestCard
                    key={favorite._id}
                    req={favorite.propose}
                    isFavorite={true}
                    onSave={() => handleSave(favorite.propose?._id, "propose")}
                    onCreateLesson={null}
                    onSendExistingLesson={onSendExistingLesson}
                    openPropose={openPropose}
                    setOpenPropose={setOpenPropose}
                    userInfo={null}
                    isLoading={false}
                  />
                ))
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <p>No bookmarked proposals yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
