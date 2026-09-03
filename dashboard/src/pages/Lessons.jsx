import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Trash2,
  Clock,
  DollarSign,
  BookOpen,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { deleteLesson, getAllLessons } from "../store/Reducer/DashboardReducer";
import { toast } from "react-toastify";

const Lessons = () => {
  const { lessons, loading } = useSelector((state) => state.dashboard);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const dispatch = useDispatch();

  // Debounce function
  const debounce = (func, delay) => {
    let timerId;
    return (...args) => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      setDebouncedSearchTerm(value);
      setPage(1); // Reset to first page when searching
    }, 500), // 500ms delay
    []
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Fetch data when debounced search term, page, or limit changes
  useEffect(() => {
    dispatch(getAllLessons({ page, limit, search: debouncedSearchTerm }));
  }, [dispatch, debouncedSearchTerm, page, limit]);
  
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this lesson?")) {
      dispatch(deleteLesson(id)).then((res) => {
        if (res.payload.status) {
          toast.success(res.payload.message);
          dispatch(getAllLessons({ page, limit, search: debouncedSearchTerm }))
        } else {
          toast.error(res.payload.message);
        }
      })
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Lessons Management</h1>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full sm:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lesson Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lessons?.map((lesson, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={lesson?.coverImage?.url}
                      alt={lesson.title}
                      loading="lazy"
                      className="h-12 w-20 object-cover rounded-md"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BookOpen size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {lesson.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {lesson.createdBy?.name || lesson.createdBy?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign size={14} className="text-gray-400 mr-1" />
                      {lesson.price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      {lesson.duration}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDelete(lesson._id)}
                      className="text-white bg-red-500 p-2 rounded"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {lessons?.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No lessons found matching "{debouncedSearchTerm}"
            </div>
          )}
        </div>
        {/* Pagination Controls */}
        {!loading && lessons.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className={`p-2 rounded-md ${
                    page === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>

                <span>{page}</span>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={lessons.length < limit} 
                  className={`p-2 rounded-md text-gray-600 hover:bg-gray-100 ${
                    lessons.length < limit
                      ? "text-gray-400 cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lessons;