import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import { getTeacherLessons } from "../../../redux/reducers/LessonReducer";
import { getUserFavorites } from "../../../redux/reducers/FavoriteReducer";
import Card from "../../Home/Components/Card";

export default function Lessons() {
  const dispatch = useDispatch();
  const { Teacherlessons = [] } = useSelector((state) => state.lesson);
  const { favorites } = useSelector((state) => state.favorite);
  const [limit, setLimit] = useState(8);

  useEffect(() => {
    dispatch(getTeacherLessons({ page: 1, limit }));
    dispatch(getUserFavorites());
  }, [dispatch, limit]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-start mt-[20px] mb-[20px]">
        <Link
          to="/create-lesson"
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          Create lesson
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {Teacherlessons.map((lesson) => (
          <Card
            key={lesson._id}
            course={lesson}
            favorites={favorites}
            linkTo={`/update-lesson/${lesson._id}`}
          />
        ))}
      </div>

      {Teacherlessons.length >= limit && (
        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={() => setLimit((current) => current + 8)}
            className="px-6 py-3 bg-primary text-white rounded-md"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
