import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    dispatch(getUserFavorites());
  }, [dispatch]);

  const handleSave = (itemId, itemType) => {
    dispatch(toggleFavorite({ id: itemId, type: itemType })).then((res) => {
      if (res.payload.status) {
        toast.success(res.payload.message || "Removed from favorites");
        dispatch(getUserFavorites());
      } else {
        toast.info(res.payload.message);
      }
    });
  };

  // Safe array check and conversion
  const favoritesArray = React.useMemo(() => {
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

  // Separate favorites by type for different sections
  const curriculumFavorites = favoritesArray.filter(fav => fav.type === "curriculum" && fav.curriculum);
  const lessonFavorites = favoritesArray.filter(fav => fav.type === "lesson" && fav.lesson);
  const proposeFavorites = favoritesArray.filter(fav => fav.type === "propose" && fav.propose);

  const hasFavorites =
    curriculumFavorites.length > 0 ||
    lessonFavorites.length > 0 ||
    proposeFavorites.length > 0;

  return (
    <div className="w-full">
      <div className="">
        {!hasFavorites ? (
          <div className="text-center mb-5 mt-7.5">
            <p className="text-gray-500 text-lg">No favorites yet</p>
          </div>
        ) : (
          <div className="">
            {/* Propose Favorites Section */}
            {proposeFavorites.length > 0 && (
              <div>
                <h2 className="text-[28px] font-medium text-gray-900 mb-5 mt-7.5">Proposals</h2>
                <div className="space-y-6">
                  {proposeFavorites.map((favorite) => (
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
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum Favorites Section */}
            {curriculumFavorites.length > 0 && (
              <div>
                <h2 className="text-[28px] font-medium text-gray-900 mb-5 mt-7.5">Curriculums</h2>
                <div className="max-w-[2800px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {curriculumFavorites.map((favorite) => (
                    <CurriculumCard key={favorite._id} course={favorite.curriculum} />
                  ))}
                </div>
              </div>
            )}

            {/* Lesson Favorites Section */}
            {lessonFavorites.length > 0 && (
              <div>
                <h2 className="text-[28px] font-medium text-gray-900 mb-5 mt-7.5">Lessons</h2>
                <div className="max-w-[2800px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {lessonFavorites.map((favorite) => (
                    <Card key={favorite._id} course={favorite.lesson} favorites={favorites} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
