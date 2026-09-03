import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Edit, ImageIcon, Plus, Quote, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  clearError,
  clearSuccessMessage,
  createStudentStory,
  deleteStudentStory,
  getStudentStories,
  updateStudentStory,
} from "../store/Reducer/StudentStoryReducer";
import StudentStoryModal from "../components/StudentStoryModal";

const StudentStories = () => {
  const dispatch = useDispatch();
  const { stories, loading, error, successMessage } = useSelector(
    (state) => state.studentStory
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  useEffect(() => {
    dispatch(getStudentStories());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
      setIsModalOpen(false);
      setSelectedStory(null);
    }
    if (error) {
      toast.error(error.message || "An error occurred");
      dispatch(clearError());
    }
  }, [successMessage, error, dispatch]);

  const handleCreate = (formData) => {
    dispatch(createStudentStory(formData));
  };

  const handleUpdate = (formData) => {
    if (!selectedStory) return;
    dispatch(updateStudentStory({ id: selectedStory._id, formData }));
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this student story?")) {
      dispatch(deleteStudentStory(id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <Quote className="text-primary" />
            Student Stories
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage student story slides shown on the home page under categories.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedStory(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={20} className="mr-2" />
          Add story
        </button>
      </div>

      {loading && stories.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <ImageIcon className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">No student stories yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {stories.map((item) => (
            <div
              key={item._id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="relative h-40 bg-gray-100">
                {item.image?.url ? (
                  <img
                    src={item.image.url}
                    alt={item.studentName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium text-white ${
                    item.isActive ? "bg-green-500" : "bg-gray-500"
                  }`}
                >
                  {item.isActive ? "Active" : "Hidden"}
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <img
                    src={item.profileImage?.url || "https://i.ibb.co/tpV3m2GW/no-image.png"}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{item.studentName}</p>
                    <p className="text-xs text-gray-500">Order: {item.order ?? 0}</p>
                  </div>
                </div>
                <p className="line-clamp-3 text-sm text-gray-600">“{item.story}”</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStory(item);
                      setIsModalOpen(true);
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <StudentStoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStory(null);
        }}
        story={selectedStory}
        onSave={selectedStory ? handleUpdate : handleCreate}
        isLoading={loading}
      />
    </div>
  );
};

export default StudentStories;
