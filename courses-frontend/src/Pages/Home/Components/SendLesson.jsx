import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getTeacherLessons } from "../../../redux/reducers/LessonReducer";
import {
  sendChatMessage,
  startChat,
} from "../../../redux/reducers/ChatReducer";
import { motion } from "framer-motion";

export default function SendLesson({ open, onClose, request }) {
  const dispatch = useDispatch();
  const { Teacherlessons, loading } = useSelector((state) => state.lesson);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(getTeacherLessons({ page: 1, limit: 50 }));
    }
  }, [dispatch, open]);

  useEffect(() => {
    if (!open) {
      setSelectedLesson(null);
      setNote("");
    }
  }, [open]);

  const lessons = useMemo(() => Teacherlessons || [], [Teacherlessons]);

  if (!open) return null;

  const handleSend = async () => {
    if (!request?.user?._id) {
      toast.error("Request details are missing.");
      return;
    }

    if (!selectedLesson) {
      toast.info("Please select a lesson to send.");
      return;
    }

    try {
      setSubmitting(true);
      const { room } = await dispatch(
        startChat({
          targetUserId: request.user._id,
          lessonId: selectedLesson,
        })
      ).unwrap();

      await dispatch(
        sendChatMessage({
          roomId: room._id,
          lessonId: selectedLesson,
          message: note.trim() || undefined,
        })
      ).unwrap();

      toast.success("Lesson shared via chat.");
      setSelectedLesson(null);
      setNote("");
      onClose?.();
    } catch (error) {
      const errMessage =
        typeof error === "string"
          ? error
          : error?.message || "Failed to send lesson.";
      toast.error(errMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <motion.div    initial={{ opacity: 0, y: -20, scale: 1 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.95 }}
        transition={{ duration: 0.35, ease: "easeOut" }} className="bg-white w-full max-w-4xl rounded-md shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-black hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-2">
          Send an existing lesson proposal
        </h2>
        {request ? (
          <p className="text-sm text-gray-600 mb-4">
            Sending to{" "}
            <span className="font-semibold">{request?.user?.name}</span> about{" "}
            <span className="font-semibold">{request?.title}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-600 mb-4">
            Select a request to continue.
          </p>
        )}

        <div className="space-y-3 mb-5 max-h-64 overflow-y-auto hide-scrollbar border border-gray-100 rounded-lg p-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading lessons...</p>
          ) : lessons.length === 0 ? (
            <p className="text-sm text-gray-500">
              No lessons found. Please create a lesson first.
            </p>
          ) : (
            lessons.map((lesson) => (
              <label
                key={lesson._id}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="selectedLesson"
                  className="w-4 h-4"
                  value={lesson._id}
                  checked={selectedLesson === lesson._id}
                  onChange={() => setSelectedLesson(lesson._id)}
                  disabled={submitting}
                />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">
                    {lesson.title}
                  </span>
                  <span className="text-sm text-gray-500">
                    ${lesson.price} • {lesson.duration}
                  </span>
                </div>
              </label>
            ))
          )}
        </div>

        <textarea
          placeholder="Add a message (optional)"
          className="w-full border border-gray-300 rounded-lg p-3 h-28 outline-none"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={submitting}
        ></textarea>

        <div className="flex justify-start mt-4">
          <button
            className="bg-primary text-white px-6 py-2 rounded disabled:opacity-60"
            onClick={handleSend}
            disabled={submitting || !request}
          >
            {submitting ? "Sending..." : "Send"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
