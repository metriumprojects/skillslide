import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import { getTeacherCurriculums } from "../../../redux/reducers/CurriculumReducer";
import { getUserFavorites } from "../../../redux/reducers/FavoriteReducer";
import CurriculumCard from "../../Home/Components/CurriculumCard";

export default function Curriculum() {
  const dispatch = useDispatch();
  const { teacherCurriculums = [] } = useSelector((state) => state.curriculum);

  useEffect(() => {
    dispatch(getTeacherCurriculums());
    dispatch(getUserFavorites());
  }, [dispatch]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-start mt-[20px] mb-[20px]">
        <Link
          to="/create-curriculum"
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          Create a curriculum
        </Link>
      </div>

      <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-7 gap-5">
        {teacherCurriculums.map((curriculum) => (
          <CurriculumCard
            key={curriculum._id}
            course={curriculum}
            linkTo={`/edit-curriculum/${curriculum._id}`}
          />
        ))}
      </div>
    </div>
  );
}
