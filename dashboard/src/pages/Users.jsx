import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Edit,
  Trash2,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import EditUserModal from "../components/EditUserModal";
import ChangeRoleModal from "../components/ChangeRoleModal";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteUser,
  getAllUsers,
  updateUser,
  changeUserRole,
} from "../store/Reducer/DashboardReducer";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { directLogin } from "../store/Reducer/AuthReducer";
import { useNavigate } from "react-router-dom";

const Users = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { users, loading } = useSelector((state) => state.dashboard);

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
      setCurrentPage(1); // Reset to first page when searching
    }, 500), // 500ms delay
    []
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    // Dispatch with pagination parameters and debounced search term
    dispatch(
      getAllUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
      })
    );
  }, [dispatch, currentPage, itemsPerPage, debouncedSearchTerm]);

  // Calculate total pages
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSave = (updatedUser) => {
    if (updatedUser._id) {
      dispatch(
        updateUser({
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          password: updatedUser.password,
        })
      ).then((res) => {
        if (res?.payload?.status) {
          toast.success(res?.payload?.message);
          dispatch(
            getAllUsers({
              page: currentPage,
              limit: itemsPerPage,
              search: debouncedSearchTerm,
            })
          );
        } else {
          toast.error(res?.payload.message);
        }
      });
    }
  };

  const handleDelete = (userId) => {
    dispatch(deleteUser(userId)).then((res) => {
      if (res?.payload?.data.status) {
        toast.success(res?.payload?.data?.message);
        dispatch(
          getAllUsers({
            page: currentPage,
            limit: itemsPerPage,
            search: debouncedSearchTerm,
          })
        );
      } else {
        toast.error(res?.payload?.data.message);
      }
    });
  };

  const handleBlock = (userId) => {
    // Handle block logic
  };

const handleVisit = (id) => {
  dispatch(directLogin(id)).then((res) => {
    if (res?.payload?.status) {
      toast.success(res?.payload?.message);
      navigate("https://skillask.com/");
    } else {
      toast.error(res?.payload?.message);
    }
  });
};

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages are less than max
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        startPage = 1;
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
        endPage = totalPages;
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis if needed
      if (startPage > 1) {
        pageNumbers.unshift("...");
        pageNumbers.unshift(1);
      }
      if (endPage < totalPages) {
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search users..."
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
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Money
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Money
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                    <p className="mt-2 text-gray-500">Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {debouncedSearchTerm 
                      ? `No users found matching "${debouncedSearchTerm}"`
                      : "No users found"}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/user-detail/${user._id}`} className="text-sm font-medium text-gray-900">
                        {user.name || "Not Added"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {user.email || "Not Added"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "user"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.moneyTotal}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.money}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-white bg-primary p-2 rounded"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsRoleModalOpen(true);
                          }}
                          className="text-white bg-purple-500 p-2 rounded"
                          title="Change Role"
                        >
                          <User size={18} />
                        </button>
                        <button
                          onClick={() => handleVisit(user._id)}
                          className="text-white bg-orange-500 p-2 rounded"
                          title="Visit Profile"
                        >
                          <ExternalLink size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-white bg-red-500 p-2 rounded"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && users.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-semibold">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {Math.min(currentPage * itemsPerPage, users.length)}
                </span>{" "}
                of <span className="font-semibold">{users.length}</span> users
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>

                <span>{currentPage}</span>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={users.length < itemsPerPage}
                  className={`p-2 rounded-md text-gray-600 hover:bg-gray-100 ${
                    users.length < itemsPerPage
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

      <EditUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSave={handleSave}
        onDelete={handleDelete}
        onBlock={handleBlock}
        onVisit={handleVisit}
      />

      <ChangeRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        user={selectedUser}
        onSave={(id, role) => {
          dispatch(changeUserRole({ id, role })).then((res) => {
            if (res.payload?.status) {
              toast.success(res.payload.message);
              dispatch(
                getAllUsers({
                  page: currentPage,
                  limit: itemsPerPage,
                  search: debouncedSearchTerm,
                })
              );
            } else {
              toast.error(res.payload?.message || "Failed to update role");
            }
          });
        }}
      />
    </div>
  );
};

export default Users;