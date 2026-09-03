import React, { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";

const StudentStoryModal = ({ isOpen, onClose, story, onSave, isLoading }) => {
  const [studentName, setStudentName] = useState("");
  const [storyText, setStoryText] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [profilePreview, setProfilePreview] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (story) {
      setStudentName(story.studentName || "");
      setStoryText(story.story || "");
      setOrder(story.order ?? 0);
      setIsActive(story.isActive !== false);
      setImagePreview(story.image?.url || "");
      setProfilePreview(story.profileImage?.url || "");
      setImage(null);
      setProfileImage(null);
    } else {
      setStudentName("");
      setStoryText("");
      setOrder(0);
      setIsActive(true);
      setImagePreview("");
      setProfilePreview("");
      setImage(null);
      setProfileImage(null);
    }
  }, [story, isOpen]);

  const handleImageChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === "image") {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setProfileImage(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentName.trim() || !storyText.trim()) return;
    if (!story && (!image || !profileImage)) return;

    const formData = new FormData();
    formData.append("studentName", studentName.trim());
    formData.append("story", storyText.trim());
    formData.append("order", String(order));
    formData.append("isActive", String(isActive));
    if (image) formData.append("image", image);
    if (profileImage) formData.append("profileImage", profileImage);
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600"
          type="button"
        >
          <X size={24} />
        </button>

        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          {story ? "Update Student Story" : "Add Student Story"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Student name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="John Mcturn"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Story
            </label>
            <textarea
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              required
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Quote / student story text"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Order
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Active on home page
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Story image
              </label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 hover:border-primary">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Story"
                    className="h-28 w-full rounded-md object-cover"
                  />
                ) : (
                  <>
                    <Upload className="mb-2 text-gray-400" size={28} />
                    <span className="text-sm text-gray-500">Upload story image</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageChange(e, "image")}
                />
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Profile image
              </label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 hover:border-primary">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile"
                    className="h-28 w-28 rounded-full object-cover"
                  />
                ) : (
                  <>
                    <Upload className="mb-2 text-gray-400" size={28} />
                    <span className="text-sm text-gray-500">Upload profile photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageChange(e, "profile")}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {isLoading ? "Saving..." : story ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentStoryModal;
