import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, DollarSign, Shield, BookOpen, GraduationCap, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserById } from '../store/Reducer/AuthReducer';
import { getAllCurriculumsByTecherId, getTeacherLessonsById } from '../store/Reducer/DashboardReducer';

const UserDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userbyid } = useSelector((state) => state.auth);
  const { Teacherlessons, curriculums,  loading } = useSelector((state) => state.dashboard);
  const [page, setPage] = useState(1);
  const [curriculumpage, setCurriculumpage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    dispatch(getUserById(id))
  }, [id]);
  useEffect(() => {
    dispatch(getTeacherLessonsById({id, page, limit}))
  }, [id, page, limit]);
  useEffect(() => {
    dispatch(getAllCurriculumsByTecherId({id, page: curriculumpage, limit}))
  }, [id, curriculumpage, limit]);
  if (!userbyid) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">User Details</h1>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{userbyid.name || 'No Name'}</h2>
              <div className="flex items-center text-gray-500 mt-1">
                <Mail size={16} className="mr-2" />
                {userbyid.email}
              </div>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            userbyid.role === 'user' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {userbyid.role}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-2">
              <DollarSign size={20} className="mr-2" />
              Total Money
            </div>
            <p className="text-2xl font-bold text-gray-900">${userbyid.moneyTotal || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-2">
              <DollarSign size={20} className="mr-2" />
              Current Balance
            </div>
            <p className="text-2xl font-bold text-gray-900">${userbyid.money || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-2">
              <Shield size={20} className="mr-2" />
              Account Status
            </div>
            <p className="text-2xl font-bold text-gray-900">Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Enrolled Lessons Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <BookOpen size={20} className="mr-2 text-primary" />
               Lessons
            </h3>
          </div>
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
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-200">
                {Teacherlessons?.map((lesson, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
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
                      {lesson.duration}
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
                          {Teacherlessons?.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No lesson found
            </div>
          )}
                 {!loading && Teacherlessons.length > 0 && (
          <div className="flex flex-row items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className={`p-2 rounded-md ${
                    page === 1
                      ? "text-gray-400 bg-gray-300 cursor-not-allowed"
                      : "text-white bg-primary"
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>

                <span>{page}</span>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={Teacherlessons.length < limit} 
                  className={`p-2 rounded-md  ${
                    Teacherlessons.length < limit
                      ? "text-gray-400 bg-gray-300 cursor-not-allowed opacity-50"
                      : "text-white bg-primary"
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

        {/* Enrolled Curriculums Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <GraduationCap size={20} className="mr-2 text-primary" />
              Curriculums
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Lessons</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher Name</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-200">
                {curriculums?.map((curr, index) => (
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
                </tr>
                ))}
              </tbody>
            </table>
                {curriculums?.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No curriculum found
            </div>
          )}
                   {!loading && curriculums.length > 0 && (
          <div className="flex flex-row items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurriculumpage(curriculumpage - 1)}
                  disabled={curriculumpage === 1}
                  className={`p-2 rounded-md ${
                    curriculumpage === 1
                      ? "text-gray-400 bg-gray-300 cursor-not-allowed"
                      : "text-white bg-primary"
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>

                <span>{curriculumpage}</span>

                <button
                  onClick={() => setCurriculumpage(curriculumpage + 1)}
                  disabled={curriculums.length < limit} 
                  className={`p-2 rounded-md  ${
                    curriculums.length < limit
                      ? "text-gray-400 bg-gray-300 cursor-not-allowed opacity-50"
                      : "text-white bg-primary"
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
      </div>
    </div>
  );
};

export default UserDetail;
