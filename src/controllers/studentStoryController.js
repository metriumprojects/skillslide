import fs from "fs";
import StudentStory from "../models/StudentStory.js";
import cloudinary from "../config/cloudinary.js";

const ensureAdmin = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ status: false, message: "Admin access required" });
    return false;
  }
  return true;
};

const cleanupTempFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};

const cleanupTempFiles = (files) => {
  if (!files) return;
  Object.values(files)
    .flat()
    .forEach((file) => cleanupTempFile(file));
};

const uploadImage = async (file, folder) => {
  const result = await cloudinary.uploader.upload(file.path, { folder });
  cleanupTempFile(file);
  return { url: result.secure_url, public_id: result.public_id };
};

export const getActiveStudentStories = async (req, res) => {
  try {
    const stories = await StudentStory.find({ isActive: true }).sort({
      order: 1,
      createdAt: -1,
    });
    res.json({ status: true, stories });
  } catch (error) {
    console.error("Get active student stories error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

export const getAllStudentStories = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const stories = await StudentStory.find().sort({ order: 1, createdAt: -1 });
    res.json({ status: true, stories });
  } catch (error) {
    console.error("Get all student stories error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

export const createStudentStory = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) {
      cleanupTempFiles(req.files);
      return;
    }

    const { studentName, story = "", order = 0, isActive = true } = req.body;
    const imageFile = req.files?.image?.[0];
    const profileFile = req.files?.profileImage?.[0];

    if (!studentName?.trim()) {
      cleanupTempFiles(req.files);
      return res.status(400).json({ status: false, message: "Student name is required" });
    }
    if (!String(story || "").trim()) {
      cleanupTempFiles(req.files);
      return res.status(400).json({ status: false, message: "Story text is required" });
    }
    if (!imageFile || !profileFile) {
      cleanupTempFiles(req.files);
      return res.status(400).json({
        status: false,
        message: "Story image and profile image are required",
      });
    }

    const image = await uploadImage(imageFile, "student-stories");
    const profileImage = await uploadImage(profileFile, "student-stories/profiles");

    const created = await StudentStory.create({
      studentName: studentName.trim(),
      story: String(story).trim(),
      image,
      profileImage,
      order: Number(order) || 0,
      isActive: String(isActive) !== "false",
    });

    res.status(201).json({
      status: true,
      message: "Student story created successfully",
      story: created,
    });
  } catch (error) {
    cleanupTempFiles(req.files);
    console.error("Create student story error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

export const updateStudentStory = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) {
      cleanupTempFiles(req.files);
      return;
    }

    const item = await StudentStory.findById(req.params.id);
    if (!item) {
      cleanupTempFiles(req.files);
      return res.status(404).json({ status: false, message: "Student story not found" });
    }

    const { studentName, story, order, isActive } = req.body;
    const imageFile = req.files?.image?.[0];
    const profileFile = req.files?.profileImage?.[0];

    if (studentName !== undefined) item.studentName = String(studentName || "").trim();
    if (story !== undefined) item.story = String(story || "").trim();
    if (order !== undefined && order !== "") item.order = Number(order) || 0;
    if (isActive !== undefined) item.isActive = String(isActive) !== "false";

    if (imageFile) {
      if (item.image?.public_id) {
        await cloudinary.uploader.destroy(item.image.public_id);
      }
      item.image = await uploadImage(imageFile, "student-stories");
    }

    if (profileFile) {
      if (item.profileImage?.public_id) {
        await cloudinary.uploader.destroy(item.profileImage.public_id);
      }
      item.profileImage = await uploadImage(profileFile, "student-stories/profiles");
    }

    await item.save();

    res.json({
      status: true,
      message: "Student story updated successfully",
      story: item,
    });
  } catch (error) {
    cleanupTempFiles(req.files);
    console.error("Update student story error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

export const deleteStudentStory = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const item = await StudentStory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ status: false, message: "Student story not found" });
    }

    if (item.image?.public_id) {
      await cloudinary.uploader.destroy(item.image.public_id);
    }
    if (item.profileImage?.public_id) {
      await cloudinary.uploader.destroy(item.profileImage.public_id);
    }

    await item.deleteOne();

    res.json({ status: true, message: "Student story deleted successfully" });
  } catch (error) {
    console.error("Delete student story error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};
