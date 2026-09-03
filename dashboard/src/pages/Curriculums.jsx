import React, { useEffect, useState, useCallback } from 'react';
import { Search, Trash2, BookOpen, DollarSign, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { deleteCurriculum, getAllCurriculums } from '../store/Reducer/DashboardReducer';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const Curriculums = () => {
  const dispatch = useDispatch();
  const { curriculum, loading } = useSelector((state) => state.dashboard);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

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
    dispatch(getAllCurriculums({ page, limit, search: debouncedSearchTerm }));
  }, [page, limit, debouncedSearchTerm, dispatch]);

  const handleDelete = (id) => {
    dispatch(deleteCurriculum(id)).then((res) => {
        toast.success(res?.payload?.message);
        dispatch(getAllCurriculums({ page, limit, search: debouncedSearchTerm }))
    })
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Curriculums Management</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search curriculums..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Lessons</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher Name</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {curriculum?.map((curr, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{curr.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign size={14} className="text-gray-400 mr-1" />
                      {curr?.price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <BookOpen size={14} className="mr-1" />
                      {curr?.totalLesson}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <User size={14} className="mr-1" />
                      {curr?.createdBy?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDelete(curr._id)}
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
          
          {curriculum?.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No curriculums found matching "{debouncedSearchTerm}"
            </div>
          )}
        </div>
        
        {!loading && curriculum?.length > 0 && (
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
                  disabled={curriculum?.length < limit}
                  className={`p-2 rounded-md text-gray-600 hover:bg-gray-100 ${
                    curriculum?.length < limit
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

export default Curriculums;