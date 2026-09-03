import CurriculumRating from "../models/CurriculumRating.js";
import Curriculum from "../models/Curriculum.js";
import Lesson from "../models/Lesson.js";
import LessonRating from "../models/LessonRating.js";
import TeacherRating from "../models/TeacherRating.js";
import User from "../models/User.js";
import cloudinary from "cloudinary";
import fs from "fs"
import Booking from "../models/Booking.js";
import mongoose from "mongoose";
export const addCurriculumRating = async (req, res) => {
  try {
    const { id, rating, review } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 100)
      return res.status(400).json({ message: "Invalid rating. Rating must be between 1 and 100." });

    let rate = await CurriculumRating.findOne({ user: userId, curriculum: id });

    if (rate) {
      rate.rating = rating;
      rate.review = review;
      await rate.save();
    } else {
      let uploadedImage = null;

      // Upload image if provided
      if (req.file) {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "_reviews",
        });
        uploadedImage = { url: result.secure_url, public_id: result.public_id };
        fs.unlinkSync(req.file.path);
      }

      rate = await CurriculumRating.create({ user: userId, curriculum: id, rating, review, image: uploadedImage });
    }

    // Update average rating (1-100 scale)
    const stats = await CurriculumRating.aggregate([
      { $match: { curriculum: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const avg = stats[0]?.avg || 0;
    const count = stats[0]?.count || 0;

    await Curriculum.findByIdAndUpdate(id, {
      averageRating: avg,
      totalRatings: count,
    });

    res.status(200).json({ status: true, message: "Curriculum rated successfully", rate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addLessonRating = async (req, res) => {
  try {
    const { id, bookingId, rating, review, type } = req.body;   // type = "lesson" or "curriculum"
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 100)
      return res.status(400).json({ message: "Invalid rating. Rating must be between 1 and 100." });

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    console.log('=== Rating Debug Info ===');
    console.log('Type:', type);
    console.log('Lesson/Curriculum ID:', id);
    console.log('Booking ID:', bookingId);
    console.log('User ID:', userId);

    // Check already reviewed
    let rate = await LessonRating.findOne({ user: userId, lesson: id });
    if (rate) {
      return res.status(400).json({ message: "Already submitted your review for this lesson" });
    }

    // Upload image if provided
    let uploadedImage = null;
    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "_reviews",
      });
      uploadedImage = { url: result.secure_url, public_id: result.public_id };
      fs.unlinkSync(req.file.path);
    }

    // Save review
    rate = await LessonRating.create({
      user: userId,
      lesson: id,
      rating,
      review,
      image: uploadedImage,
    });


// ...existing code...
const stats = await LessonRating.aggregate([
  { $match: { lesson: new mongoose.Types.ObjectId(id) } },
  { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
]);

    const avg = stats[0]?.avg || 0;
    const count = stats[0]?.count || 0;

    // Update lesson rating
    let lesson = await Lesson.findByIdAndUpdate(
      id,
      { averageRating: avg, totalRatings: count },
      { new: true }
    ).populate("createdBy", "_id");

    // Update teacher rating
    await User.findByIdAndUpdate(lesson.createdBy._id, {
      averageRating: avg,
      totalRatings: count,
    });

    // ------------------------------
    // ⭐ UPDATE BOOKING REVIEW STATUS
    // ------------------------------

    if (type === "lesson") {
      // Single lesson booking - use bookingId directly
      const updateResult = await Booking.updateOne(
        { _id: bookingId },
        { $set: { review: true } }
      );
      console.log('Lesson booking update result:', updateResult);
    } else if (type === "curriculum") {
      // Curriculum booking - update specific lesson position
      // bookingId is the booking _id, id is the lesson lId in lessonPosition
      const updateResult = await Booking.updateOne(
        { _id: bookingId, "lessonPosition.lId": id },
        {
          $set: {
            "lessonPosition.$[elem].review": true
          }
        },
        {
          arrayFilters: [{ "elem.lId": id }]
        }
      );
      console.log('Curriculum booking update result:', updateResult);
    }

    res.status(200).json({
      status: true,
      message: "Lesson rated successfully",
      rate
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addTeacherRating = async (req, res) => {
  try {
    const { teacherId, rating, review } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 100)
      return res.status(400).json({ message: "Invalid rating. Rating must be between 1 and 100." });

    let rate = await TeacherRating.findOne({ user: userId, teacher: teacherId });

    if (rate) {
      rate.rating = rating;
      rate.review = review;
      await rate.save();
    } else {
      rate = await TeacherRating.create({ user: userId, teacher: teacherId, rating, review });
    }

    // Update average teacher rating
    const stats = await TeacherRating.aggregate([
      { $match: { teacher: rate.teacher } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const avg = stats[0]?.avg || 0;
    const count = stats[0]?.count || 0;

    await User.findByIdAndUpdate(teacherId, {
      averageRating: avg,
      totalRatings: count,
    });

    res.status(200).json({ status: true, message: "Teacher rated successfully", rate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const curriculumRating = async (req, res) => {
  try {
    const id = req.params.id;

    const page = parseInt(req.query.page) || 1;       // default page
    const limit = parseInt(req.query.limit) || 10;    // default limit
    const skip = (page - 1) * limit;

    const totalItems = await CurriculumRating.countDocuments({ curriculum: id });

    let rate = await CurriculumRating.find({ curriculum: id }).populate("user", "name image")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      message: "Curriculum rated successfully",
      rate,
      totalItems
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const lessonRating = async (req, res) => {
  try {
    const id = req.params.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await LessonRating.countDocuments({ lesson: id });

    let rate = await LessonRating.find({ lesson: id }).populate("user", "name image")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      message: "Lesson rated successfully",
      rate,
      totalItems
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
