import Curriculum from "../models/Curriculum.js";
import Unit from "../models/Unit.js";
import Lesson from "../models/Lesson.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import { createLessonCalender, updateLessonCalender } from "./lessonCalenderController.js";
import { getPlaceDetails } from "../utils/getPlaceDetails.js";
import { geocodeAddress } from "../utils/geocodeAddress.js";
import { requireCurrency, requirePositivePrice, roundMoney } from "../services/currencyService.js";
import { requireTeacherPayoutCurrency } from "../services/stripeService.js";

const normalizeUnitPrices = async (units, currency) => Promise.all((units || []).map(async (unit) => ({
  ...unit,
  currency,
  ...(unit.price !== undefined && unit.price !== null && unit.price !== "" ? { price: roundMoney(unit.price, currency) } : {}),
  lessons: await Promise.all((unit.lessons || []).map(async (lesson) => ({
    ...lesson,
    currency,
    ...(lesson.price !== undefined && lesson.price !== null && lesson.price !== "" ? { price: roundMoney(lesson.price, currency) } : {}),
  }))),
})));

const normalizeLessonPrices = async (lessons, currency) => Promise.all((lessons || []).map(async (lesson) => ({
  ...lesson,
  currency,
  ...(lesson.price !== undefined && lesson.price !== null && lesson.price !== "" ? { price: roundMoney(lesson.price, currency) } : {}),
})));

const handleLessonCreateOrUpdate = async ({
  lesson,
  index,
  curriculumId,
  unitId,
  unitPosition,
  unitName,
  req,
  userId,
}) => {
  req.files = req.files || [];
  let lessonCoverImage = null;
  let lessonImages = [];

  // ⭐ NEW: Find lesson cover image by lesson_${id}_cover
  // This handles new format from frontend where cover is sent separately
  const coverImageFiles = req.files.filter((f) => {
    return f.fieldname === `lesson_${lesson.id}_cover`;
  });

  if (coverImageFiles.length > 0) {
    const coverFile = coverImageFiles[0];
    // 1️⃣ Upload cover to Cloudinary
    const uploaded = await cloudinary.uploader.upload(coverFile.path, {
      folder: "lessons",
    });

    lessonCoverImage = {
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
    };

    // 2️⃣ Delete local file safely
    try {
      if (fs.existsSync(coverFile.path)) {
        fs.unlinkSync(coverFile.path);
      }
    } catch (err) {
      console.log("File already removed:", coverFile.path);
    }

    // 3️⃣ Remove from req.files
    req.files = req.files.filter((f) => f !== coverFile);
  }

  // ⭐ FALLBACK: Find lesson images by old format lesson_0, lesson_1 ... (for backward compatibility)
  // If no new format found, try old position-based format
  let uploadedFiles = req.files.filter((f) => {
    const parts = f.fieldname.split("_"); // ['lesson','2']
    return parts[0] === "lesson" && !f.fieldname.includes("_cover") && Number(parts[1]) === lesson.position;
  });

  // ⭐ NEW FORMAT: Find lesson images by lesson_${id} (without _cover suffix)
  if (uploadedFiles.length === 0 && lesson.id) {
    uploadedFiles = req.files.filter((f) => {
      return f.fieldname === `lesson_${lesson.id}`;
    });
  }

  if (uploadedFiles.length > 0) {
    for (const file of uploadedFiles) {

      // 1️⃣ Upload to Cloudinary
      const uploaded = await cloudinary.uploader.upload(file.path, {
        folder: "lessons",
      });

      lessonImages.push({
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      });

      // 2️⃣ Delete local file safely
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err) {
        console.log("File already removed:", file.path);
      }

      // 3️⃣ Prevent double-processing: remove from req.files
      req.files = req.files.filter((f) => f !== file);
    }
  }


  // ⭐ CASE 1 — UPDATE EXISTING LESSON
  if (lesson._id) {
    const existingLesson = await Lesson.findById(lesson._id);

    if (existingLesson) {
      // Update lesson basic fields
      existingLesson.title = lesson.title || existingLesson.title;
      existingLesson.description = lesson.description || existingLesson.description;
      existingLesson.duration = lesson.duration || existingLesson.duration;
      existingLesson.category = lesson.category || existingLesson.category;
      existingLesson.position = lesson.position ?? existingLesson.position;
      existingLesson.price = lesson.price ?? existingLesson.price;
      existingLesson.currency = lesson.currency || existingLesson.currency;
      existingLesson.isIndependent = lesson.isIndependent ?? existingLesson.isIndependent;
      existingLesson.isOnline = lesson.isOnline ?? existingLesson.isOnline;
      existingLesson.location = lesson.location ?? existingLesson.location;

      // Link curriculum
      if (!existingLesson.curriculums.includes(curriculumId)) {
        existingLesson.curriculums.push(curriculumId);
      }

      // Unit link
      existingLesson.unit = unitId || null;

      // Replace cover image
      if (lessonCoverImage) {
        if (existingLesson.coverImage?.public_id) {
          await cloudinary.uploader.destroy(existingLesson.coverImage.public_id);
        }
        existingLesson.coverImage = lessonCoverImage;
      }

      // Replace images
      if (lessonImages.length > 0) {
        for (const img of existingLesson.images) {
          if (img.public_id) {
            await cloudinary.uploader.destroy(img.public_id);
          }
        }
        existingLesson.images = lessonImages;
      }

      await existingLesson.save();

      

      // 1. Find curriculum
      const curriculum = await Curriculum.findById(curriculumId);

      // 2. Check if lId already exists
      const existingPos = curriculum.lessonPosition.find(
        (item) => item.lId.toString() === existingLesson._id.toString()
      );

      if (existingPos) {
        // -----------------------------
        // UPDATE EXISTING ITEM
        // -----------------------------
        await Curriculum.updateOne(
          {
            _id: curriculumId,
            "lessonPosition.lId": existingLesson._id,
          },
          {
            $set: {
              "lessonPosition.$.position": existingLesson.position,
              "lessonPosition.$.unitPosition": unitPosition,
              "lessonPosition.$.unitName": unitName,
            },
          }
        );

      } else {
        // -----------------------------
        // ADD NEW ITEM
        // -----------------------------
        await Curriculum.findByIdAndUpdate(
          curriculumId,
          {
            $push: {
              lessonPosition: {
                position: existingLesson.position,
                lId: existingLesson._id,
                unitPosition: unitPosition,
                unitName: unitName,
              },
            },
          }
        );
      }

      // ------------------------------------------
      return existingLesson;
    }
  }


  // ⭐ CASE 2 — CREATE NEW LESSON
  const newLesson = await Lesson.create({
    title: lesson.title,
    description: lesson.description,
    duration: lesson.duration,
    category: lesson.category,
    position: lesson.position,
    price: lesson.price || null,
    currency: lesson.currency || "USD",
    curriculums: [curriculumId],
    createdBy: userId,
    isIndependent: lesson.isIndependent || false,
    isOnline: lesson.isOnline || true,
    location:lesson.location||undefined,
    unit: unitId || null,
    coverImage: lessonCoverImage || undefined,
    images: lessonImages,
  });

  if (lesson.calender) {
    await createLessonCalender({
      weeklyHours: lesson.weeklyHours,
      dateSpecificHours: lesson.dateSpecificHours,
      timeZone: lesson.timeZone,
      userId,
      lessonId: newLesson._id,
    });
  }

  await Curriculum.findByIdAndUpdate(
    curriculumId,
    {
      $addToSet: {
        lessonPosition: {
          position: newLesson.position,
          lId: newLesson._id,  // FIXED
          unitPosition: unitPosition,
          unitName: unitName,
        },
      },
    }
  );

  return newLesson;
};

// async function my(){
//   await Curriculum.updateMany(
//   { lat: { $exists: true }, lng: { $exists: true } },
//   [
//     {
//       $set: {
//         geoLocation: {
//           type: "Point",
//           coordinates: ["$lng", "$lat"],
//         },
//       },
//     },
//   ]
// );
// }
// my()
// ----------------------------------------------------
export const createFullCurriculum = async (req, res) => {
  try {
    const { title, description, price, units, totalLesson, category, location, placeId, isOnline, supportsInPerson, calender, calenderId, weeklyHours, dateSpecificHours, timeZone,message, inputCurrency = "USD" } = req.body;
    const userId = req.user._id;
    const curriculumCurrency = requireCurrency(inputCurrency);
    await requireTeacherPayoutCurrency(userId, curriculumCurrency);
    let resolvedCalenderId = calenderId || null;

    let parsedUnits = [];
    if (typeof units === "string") parsedUnits = JSON.parse(units);
    else parsedUnits = units || [];
    parsedUnits = await normalizeUnitPrices(parsedUnits, curriculumCurrency);
    const canonicalPrice = requirePositivePrice(price, curriculumCurrency);

    // -----------------------------------------------
    // ⭐ Upload Curriculum Images
    // -----------------------------------------------
    let curriculumImages = [];

    const curriculumFiles = req.files.filter(
      (f) => f.fieldname === "curriculumImages"
    );

    for (const file of curriculumFiles) {
      const upload = await cloudinary.uploader.upload(file.path, {
        folder: "curriculums",
      });

      curriculumImages.push({
        url: upload.secure_url,
        public_id: upload.public_id,
      });

      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err) {
        console.log("File already removed:", file.path);
      }

    }

    // Separate cover image (first image) from other images
    const coverImage = curriculumImages[0];
    const curriculumImagesArray = curriculumImages.slice(1);

    // -----------------------------------------------
    // ⭐ Create Curriculum
    // -----------------------------------------------
    let lat = null, lng = null, address = location || "", resolvedPlaceId = placeId || null;
    if (supportsInPerson && (location || placeId)) {
      const place = placeId ? await getPlaceDetails(placeId) : { lat: null, lng: null, address: null };
      const geo = !place.lat && location ? await geocodeAddress(location) : {};
      lat = place.lat ?? geo.lat ?? null;
      lng = place.lng ?? geo.lng ?? null;
      address = place.address || location || "";
    }

    const curriculum = await Curriculum.create({
      title,
      description,
      price: canonicalPrice,
      currency: curriculumCurrency,
      totalLesson,
      category,
      message,
      location: location || "",
      address,
      placeId: resolvedPlaceId,
      lat,
      lng,
      ...(Number.isFinite(lng) && Number.isFinite(lat)
        ? { geoLocation: { type: "Point", coordinates: [lng, lat] } }
        : {}),
      isOnline,
      supportsInPerson,
      coverImage: coverImage,
      images: curriculumImagesArray,
      createdBy: userId,
      calender,
      calenderId: resolvedCalenderId,
    });

    if (!calender && !resolvedCalenderId) {
      const calenderResult = await createLessonCalender({
        weeklyHours,
        dateSpecificHours,
        timeZone,
        userId,
        type: "curriculum",
        lessonId: curriculum._id,
      });

      if (calenderResult?.calenderId) {
        resolvedCalenderId = calenderResult.calenderId;
        curriculum.calenderId = resolvedCalenderId;
        await curriculum.save();
      }
    }
    // ----------------------------------------------------
    // ⭐ LOOP UNITS (Unit images: unit_0, unit_1)
    // ----------------------------------------------------
    for (let unitIndex = 0; unitIndex < parsedUnits.length; unitIndex++) {
      const u = parsedUnits[unitIndex];

      const unitKey = `unit_${unitIndex + 1}`;
      const unitFiles = req.files.filter((f) => f.fieldname === unitKey);

      let unitImages = [];

      for (const file of unitFiles) {
        const uploaded = await cloudinary.uploader.upload(file.path, {
          folder: "units",
        });

        unitImages.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
        });
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) {
          console.log("File already removed:", file.path);
        }

      }

      // Create unit
      const newUnit = await Unit.create({
        title: u.title,
        description: u.description,
        position: u.position,
        isIndependent: u.isIndependent || false,
        price: u.price || null,
        curriculum: curriculum._id,
        images: unitImages,
      });

      // ----------------------------------------------------
      // ⭐ CREATE OR UPDATE LESSONS INSIDE UNIT
      // ----------------------------------------------------
      if (u.lessons && u.lessons.length > 0) {
        for (let lessonIndex = 0; lessonIndex < u.lessons.length; lessonIndex++) {
          const lesson = u.lessons[lessonIndex];

          await handleLessonCreateOrUpdate({
            lesson,
            index: lessonIndex,
            curriculumId: curriculum._id,
            unitId: newUnit._id,
            unitPosition: newUnit.position,
            unitName: newUnit.name,
            req,
            userId: req.user._id,
          });
        }
      }
    }

    // ----------------------------------------------------
    // ⭐ SUPPORT LESSONS WITHOUT UNITS
    // ----------------------------------------------------
    if (parsedUnits.length === 0 && req.body.lessons) {
      const independentLessons = await normalizeLessonPrices(JSON.parse(req.body.lessons), curriculumCurrency);

      for (let lessonIndex = 0; lessonIndex < independentLessons.length; lessonIndex++) {
        const lesson = independentLessons[lessonIndex];

        await handleLessonCreateOrUpdate({
          lesson,
          index: lessonIndex,
          curriculumId: curriculum._id,
          unitId: null,
          unitPosition: null,
          unitName: null,
          req,
          userId: req.user._id,
        });
      }
    }

    // ----------------------------------------------------
    // ⭐ SUCCESS RESPONSE
    // ----------------------------------------------------
    res.status(201).json({
      status: true,
      message: "Curriculum created successfully with units & lessons",
      curriculumId: curriculum._id,
    });

  } catch (error) {
    console.error("createFullCurriculum error:", error);
    res.status(error.status || 500).json({ message: error.message });
  }
};





export const getAllCurriculums = async (req, res) => {
  try {
    const curriculums = await Curriculum.find().sort({ createdAt: -1 });

    const formattedCurriculums = await Promise.all(
      curriculums.map(async (curriculum) => {
        // Find all units for this curriculum
        const units = await Unit.find({ curriculum: curriculum._id }).sort({ position: 1 });

        const formattedUnits = await Promise.all(
          units.map(async (unit) => {
            const lessons = await Lesson.find({ unit: unit._id }).sort({ position: 1 });

            return {
              title: unit.title,
              description: unit.description,
              position: unit.position,
              isIndependent: unit.isIndependent,
              unitImages: unit.images.map((img) => img.url),
              lessons: lessons.map((lesson) => ({
                title: lesson.title,
                description: lesson.description,
                duration: lesson.duration,
                category: lesson.category,
                lessonImages: lesson.images.map((img) => img.url),
              })),
            };
          })
        );

        return {
          _id: curriculum._id,
          title: curriculum.title,
          description: curriculum.description,
          price: curriculum.price,
          curriculumImages: curriculum.images.map((img) => img.url),
          units: formattedUnits,
        };
      })
    );

    res.json(formattedCurriculums);
  } catch (error) {
    console.error("Get all curriculums error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getFormattedCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id).populate("createdBy", "name email image averageRating totalRatings");

    if (!curriculum) {
      return res.status(404).json({ message: "Curriculum not found" });
    }

    // Fetch all units under this curriculum
    const units = await Unit.find({ curriculum: curriculum._id }).sort({ position: 1 });

    // Build formatted units
    const formattedUnits = await Promise.all(
      units.map(async (unit) => {
        const lessons = await Lesson.find({ unit: unit._id }).sort({ position: 1 });

        return {
          title: unit.title,
          description: unit.description,
          position: unit.position,
          isIndependent: unit.isIndependent,
          unitImages: unit.images.map((img) => img.url),
          lessons: lessons.map((lesson) => ({
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            category: lesson.category,
            lessonImages: lesson.images.map((img) => img.url),
          })),
        };
      })
    );

    // Build the final response
    const formattedResponse = {
      title: curriculum.title,
      description: curriculum.description,
      price: curriculum.price,
      curriculumImages: curriculum.images.map((img) => img.url),
      units: formattedUnits,
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error("Get curriculum error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* -------------------------------------------------------------------------- */
export const getSingleCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id)
      .populate("createdBy", "name email image averageRating totalRatings")
      .populate({
        path: "lessonPosition.lId",
        populate: {
          path: "createdBy",
          select: "name email image averageRating totalRatings"
        }
      });

    if (!curriculum)
      return res.status(404).json({ message: "Curriculum not found" });

    // Fetch all units under this curriculum
    const units = await Unit.find({ curriculum: curriculum._id })
      .sort({ position: 1 });

    // Prepare "units" for final response
    const fullUnits = [];

    for (const unit of units) {
      const lessons = await Lesson.find({ unit: unit._id })
        .sort({ position: 1 });

      fullUnits.push({
        ...unit.toObject(),
        lessons
      });
    }

    // ⭐ Add unit name to each lessonPosition
    const lessonPositionWithUnit = await Promise.all(
      curriculum.lessonPosition.map(async (pos) => {
        let unitName = null;

        if (pos.unitPosition !== null && pos.unitPosition !== undefined) {
          const foundUnit = units.find(u => u.position === pos.unitPosition);
          if (foundUnit) {
            unitName = foundUnit.title; // assuming Unit schema has "title"
          }
        }

        return {
          ...pos.toObject(),
          unitName
        };
      })
    );

    res.json({
      status: true,
      data: {
        ...curriculum.toObject(),
        lessonPosition: lessonPositionWithUnit,  // ⭐ updated with unitName
        units: fullUnits                          // ⭐ complete units list
      }
    });

  } catch (error) {
    console.error("getSingleCurriculum error:", error);
    res.status(500).json({ message: error.message });
  }
};


/* ------------------------------ GET ALL CURRICULUMS WITH UNITS + LESSONS ----------------------------- */
export const getTeacherCurriculums = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { createdBy: req.user.id };

    // Paginated curriculums
    const curriculums = await Curriculum.find(query).populate("createdBy", "name email image averageRating totalRatings")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Total items count
    const total = await Curriculum.countDocuments(query);

    // Format each curriculum


    res.json({
      status: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      curriculums: curriculums,
    });

  } catch (error) {
    console.error("Get all curriculums error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};
const safeUnlink = (path) => {
  try {
    if (fs.existsSync(path)) fs.unlinkSync(path);
  } catch (err) {
    console.log("safeUnlink error:", err?.message || err);
  }
};


const uploadFiles = async (files, folder, req) => {
  const out = [];
  for (const file of files) {
    const uploaded = await cloudinary.uploader.upload(file.path, { folder });
    out.push({ url: uploaded.secure_url, public_id: uploaded.public_id });
    safeUnlink(file.path);
    // remove processed file from req.files
    req.files = req.files.filter((f) => f !== file);
  }
  return out;
};

/**
 * Remove unit and its lessons (permanent delete)
 */
const deleteUnitAndLessons = async (unitId) => {
  // Remove unit
  const unit = await Unit.findById(unitId);
  if (!unit) return;

  // delete unit images from cloudinary
  if (Array.isArray(unit.images)) {
    for (const img of unit.images) {
      if (img.public_id) {
        try { await cloudinary.uploader.destroy(img.public_id); } catch (e) { console.log("cloud destroy err:", e.message); }
      }
    }
  }

  // find lessons that have unitId -> remove curriculum reference or delete lesson entirely
  const lessons = await Lesson.find({ unit: unitId });
  for (const ls of lessons) {
    // remove the curriculum reference(s) that point to this unit's curriculum(s)
    // here we will delete the lesson entirely (because it belongs to the unit being deleted).
    // Remove lesson cloud images
    if (Array.isArray(ls.images)) {
      for (const img of ls.images) {
        if (img.public_id) {
          try { await cloudinary.uploader.destroy(img.public_id); } catch (e) { console.log("cloud destroy err:", e.message); }
        }
      }
    }
    await Lesson.findByIdAndDelete(ls._id);
  }

  await Unit.findByIdAndDelete(unitId);
};


/* -------------------------------------------------------------------------- */
export const updateCurriculum = async (req, res) => {
  try {
    const curriculumId = req.params.id;
      const { title, description, price, units, totalLesson, category, location, placeId, isOnline, supportsInPerson, inputCurrency = "USD" } = req.body;
      const curriculumCurrency = requireCurrency(inputCurrency);
      await requireTeacherPayoutCurrency(req.user._id, curriculumCurrency);

    // parse units if string
    let parsedUnits = [];
    if (units) {
      if (typeof units === "string") parsedUnits = JSON.parse(units);
      else parsedUnits = units;
    } else {
      parsedUnits = [];
    }
    parsedUnits = await normalizeUnitPrices(parsedUnits, curriculumCurrency);

    // fetch current curriculum
    const curriculum = await Curriculum.findById(curriculumId).lean();
    if (!curriculum) return res.status(404).json({ message: "Curriculum not found" });

    // -------------------
    // Update basic fields
    // -------------------
    const updateObj = {};
    if (title) updateObj.title = title;
    if (description) updateObj.description = description;
    if (price !== undefined) updateObj.price = requirePositivePrice(price, curriculumCurrency);
    updateObj.currency = curriculumCurrency;
    if (totalLesson !== undefined) updateObj.totalLesson = totalLesson;
    if (category) updateObj.category = category;
    if (location) updateObj.location = location;
    if (placeId) updateObj.placeId = placeId;
    if (isOnline !== undefined) updateObj.isOnline = isOnline;
    if (supportsInPerson !== undefined) updateObj.supportsInPerson = supportsInPerson;

    // Resolve address/lat/lng if location or placeId provided
    if (location || placeId) {
      const place = placeId ? await getPlaceDetails(placeId) : { lat: null, lng: null, address: null };
      const geo = !place.lat && (location || curriculum.location) ? await geocodeAddress(location || curriculum.location) : {};
      const address = place.address || location || curriculum.address || curriculum.location || "";

      updateObj.address = address;
      updateObj.location = location || curriculum.location || "";
      updateObj.placeId = placeId || curriculum.placeId || null;
      updateObj.lat = place.lat ?? geo.lat ?? curriculum.lat ?? null;
      updateObj.lng = place.lng ?? geo.lng ?? curriculum.lng ?? null;

      if (Number.isFinite(updateObj.lng) && Number.isFinite(updateObj.lat)) {
        updateObj.geoLocation = {
          type: "Point",
          coordinates: [updateObj.lng, updateObj.lat],
        };
      }
    }


    // -------------------
    // Curriculum images replacement (if provided)
    // Handle cover image separately from other images
    // -------------------

    // Separate files by fieldname: 'coverImage' vs 'curriculumImages'
    let coverImageFile = null;
    let curriculumImageFiles = [];
    
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.fieldname === 'coverImage') {
          coverImageFile = file;
        } else if (file.fieldname === 'curriculumImages') {
          curriculumImageFiles.push(file);
        }
      });
    }
    
    const { existingCurriculumImages, existingCoverImageId } = req.body;
    
    let existingImagesList = [];
    if (existingCurriculumImages) {
      try {
        // Try to parse as JSON first (new format with order)
        existingImagesList = Array.isArray(existingCurriculumImages) ? existingCurriculumImages : JSON.parse(existingCurriculumImages);
      } catch (e) {
        // Fallback to treating as single value or array
        existingImagesList = Array.isArray(existingCurriculumImages) ? existingCurriculumImages : [existingCurriculumImages];
      }
    }

    // Handle cover image upload (if new cover image provided)
    if (coverImageFile) {
      const result = await cloudinary.uploader.upload(coverImageFile.path, { folder: "curriculums" });
      fs.unlinkSync(coverImageFile.path);
      
      // Delete old cover image from Cloudinary if exists
      if (curriculum.coverImage?.public_id) {
        try { await cloudinary.uploader.destroy(curriculum.coverImage.public_id); } catch (e) { console.log("cloud destroy err:", e.message); }
      }
      
      updateObj.coverImage = { url: result.secure_url, public_id: result.public_id };
    } else if (existingCoverImageId) {
      // Keep existing cover image - existingCoverImageId confirms user didn't change it
      // Nothing to do, cover remains as is
    }

    // Handle curriculum image uploads (if new curriculum images provided)
    let uploadedImagesPublicIds = [];
    if (curriculumImageFiles.length > 0) {
      const uploadedImages = [];
      for (const file of curriculumImageFiles) {
        const result = await cloudinary.uploader.upload(file.path, { folder: "curriculums" });
        uploadedImages.push({ url: result.secure_url, public_id: result.public_id });
        uploadedImagesPublicIds.push(result.public_id);
        fs.unlinkSync(file.path);
      }
      // Add new images to existing ones
      let existingImages = Array.isArray(curriculum.images) ? [...curriculum.images] : [];
      updateObj.images = [...existingImages, ...uploadedImages];
    }

    // Handle curriculum images updates (keeping existing + removing deleted)
    // Combine existing images list with newly uploaded images
    const allImagesToKeep = [...existingImagesList, ...uploadedImagesPublicIds];

    // Keep only the curriculum images that are in the combined list, preserving order
    if (allImagesToKeep.length > 0) {
      let currImages = updateObj.images || curriculum.images || [];
      // Preserve the order from the frontend by mapping allImagesToKeep
      const finalImages = allImagesToKeep
        .map((public_id) => currImages.find((img) => img.public_id === public_id))
        .filter((img) => img !== undefined); // Remove any undefined entries
      
      // Delete curriculum images that are NOT in the combined list (i.e., removed by user)
      const imagesToDelete = (currImages || []).filter(img => !allImagesToKeep.includes(img.public_id));
      for (const img of imagesToDelete) {
        if (img.public_id) {
          try { await cloudinary.uploader.destroy(img.public_id); } catch (e) { console.log("cloud destroy err:", e.message); }
        }
      }
      
      updateObj.images = finalImages;
    } else if (curriculumImageFiles.length === 0 && existingImagesList.length === 0) {
      // No files uploaded and no existing images list - keep images as is
      // (This handles the case where user only updated cover or other fields)
    }

    // apply top-level curriculum updates
    await Curriculum.findByIdAndUpdate(curriculumId, updateObj);

    // -------------------
    // Handle Units & Lessons
    // -------------------
    // Get existing units for this curriculum
    const existingUnits = await Unit.find({ curriculum: curriculumId }).lean();

    // Build map of existingUnitId => unit doc
    const existingUnitMap = {};
    for (const u of existingUnits) existingUnitMap[u._id.toString()] = u;

    // Track unit ids present in incoming payload to detect deletions
    const incomingUnitIds = [];

    // Loop incoming units (create or update)
    for (let unitIndex = 0; unitIndex < parsedUnits.length; unitIndex++) {
      const u = parsedUnits[unitIndex];

      // find unit files by position-based key _OR_ by index key; backend supports unit_<index>
      const unitKey = `unit_${unitIndex + 1}`;
      const unitFiles = (req.files || []).filter((f) => f.fieldname === unitKey);

      let unitImages = [];
      if (unitFiles.length > 0) {
        unitImages = await uploadFiles(unitFiles, "units", req);
      }

      if (u._id) {
        // UPDATE existing unit
        incomingUnitIds.push(u._id);
        const existingUnit = await Unit.findById(u._id);
        if (!existingUnit) {
          // unit specified but not found -> create new instead
          const createdUnit = await Unit.create({
            title: u.title,
            description: u.description,
            position: u.position,
            isIndependent: u.isIndependent ?? false,
            price: u.price ?? null,
            curriculum: curriculumId,
            images: unitImages,
          });
          // process its lessons
          if (Array.isArray(u.lessons)) {
            for (let lessonIndex = 0; lessonIndex < u.lessons.length; lessonIndex++) {
              const lessonPayload = u.lessons[lessonIndex];
              await handleLessonCreateOrUpdate({
                lesson: lessonPayload,
                curriculumId,
                unitId: createdUnit._id,
                unitPosition: createdUnit.position,
                req,
                userId: req.user._id,
              });
            }
          }
        } else {
          // update fields
          existingUnit.title = u.title ?? existingUnit.title;
          existingUnit.description = u.description ?? existingUnit.description;
          existingUnit.position = u.position ?? existingUnit.position;
          existingUnit.isIndependent = u.isIndependent ?? existingUnit.isIndependent;
          existingUnit.price = u.price ?? existingUnit.price;
          // if new images uploaded -> destroy old and set
          if (unitImages.length > 0) {
            if (Array.isArray(existingUnit.images)) {
              for (const img of existingUnit.images) {
                if (img.public_id) {
                  try { await cloudinary.uploader.destroy(img.public_id); } catch (e) { console.log("cloud destroy err:", e.message); }
                }
              }
            }
            existingUnit.images = unitImages;
          }
          existingUnit.curriculum = curriculumId;
          await existingUnit.save();

          // process its lessons (create/update)
          if (Array.isArray(u.lessons)) {
            // Build existing lessons map for this unit to detect removed lessons
            const existingUnitLessons = await Lesson.find({ unit: existingUnit._id }).lean();
            const existingLessonMap = {};
            for (const el of existingUnitLessons) existingLessonMap[el._id.toString()] = el;
            const incomingLessonIds = [];

            for (let lessonIndex = 0; lessonIndex < u.lessons.length; lessonIndex++) {
              const lessonPayload = u.lessons[lessonIndex];
              const processedLesson = await handleLessonCreateOrUpdate({
                lesson: lessonPayload,
                curriculumId,
                unitId: existingUnit._id,
                unitPosition: existingUnit.position,
                req,
                userId: req.user._id,
              });
              if (processedLesson && processedLesson._id) incomingLessonIds.push(processedLesson._id.toString());
            }

            // Delete lessons that are present in DB but not in incoming payload for this unit
            for (const existingLesson of existingUnitLessons) {
              if (!incomingLessonIds.includes(existingLesson._id.toString())) {
                // remove this curriculum reference from lesson; since unit is being kept, we assume lesson should be removed fully
                // we'll delete lesson permanently
                // delete lesson cloudinary images
                if (Array.isArray(existingLesson.images)) {
                  for (const img of existingLesson.images) {
                    if (img.public_id) {
                      try { await cloudinary.uploader.destroy(img.public_id); } catch (e) { console.log("cloud destroy err:", e.message); }
                    }
                  }
                }
                await Lesson.findByIdAndDelete(existingLesson._id);
                // also remove from curriculum.lessonPosition any entry with this lesson id
                await Curriculum.findByIdAndUpdate(curriculumId, {
                  $pull: { lessonPosition: { lId: existingLesson._id } },
                });
              }
            }
          }
        }
      } else {
        // CREATE new unit
        const createdUnit = await Unit.create({
          title: u.title,
          description: u.description,
          position: u.position,
          isIndependent: u.isIndependent ?? false,
          price: u.price ?? null,
          curriculum: curriculumId,
          images: unitImages,
        });

        // process lessons in created unit
        if (Array.isArray(u.lessons)) {
          for (let lessonIndex = 0; lessonIndex < u.lessons.length; lessonIndex++) {
            const lessonPayload = u.lessons[lessonIndex];
            await handleLessonCreateOrUpdate({
              lesson: lessonPayload,
              curriculumId,
              unitId: createdUnit._id,
              unitPosition: createdUnit.position,
              req,
              userId: req.user._id,
            });
          }
        }

        incomingUnitIds.push(createdUnit._id.toString());
      }
    } // end loop parsedUnits

    // -----------------------
    // Delete units removed in payload
    // -----------------------
    for (const exUnit of existingUnits) {
      if (!incomingUnitIds.includes(exUnit._id.toString())) {
        // delete unit & its lessons
        await deleteUnitAndLessons(exUnit._id);
        // remove any lessonPosition entries pointing to deleted lessons (deleteUnitAndLessons already deleted lessons)
        await Curriculum.findByIdAndUpdate(curriculumId, {
          $pull: { lessonPosition: { lId: { $in: [] } } }, // no-op here but kept for pattern
        });
      }
    }

    // -----------------------
    // Also support lessons directly under curriculum (no units)
    // If client sends req.body.lessons (array/string) when units are empty -> update/create those lessons
    // We'll also delete existing lessons that were previously without unit and now not present
    // -----------------------
    if ((!parsedUnits || parsedUnits.length === 0) && req.body.lessons) {
      const incomingLessonsRaw = typeof req.body.lessons === "string" ? JSON.parse(req.body.lessons) : req.body.lessons;
      const incomingLessons = await normalizeLessonPrices(incomingLessonsRaw, curriculumCurrency);
      // find existing lessons that have this curriculum and no unit
      const existingNoUnitLessons = await Lesson.find({ curriculums: curriculumId, unit: null }).lean();
      const existingNoUnitMap = {};
      for (const el of existingNoUnitLessons) existingNoUnitMap[el._id.toString()] = el;
      const incomingLessonIds = [];

      for (let i = 0; i < incomingLessons.length; i++) {
        const lessonPayload = incomingLessons[i];
        const processed = await handleLessonCreateOrUpdate({
          lesson: lessonPayload,
          curriculumId,
          unitId: null,
          unitPosition: null,
          req,
          userId: req.user._id,
        });
        if (processed && processed._id) incomingLessonIds.push(processed._id.toString());
      }

      // delete those old no-unit lessons not in incoming
      for (const ex of existingNoUnitLessons) {
        if (!incomingLessonIds.includes(ex._id.toString())) {
          if (Array.isArray(ex.images)) {
            for (const img of ex.images) {
              if (img.public_id) {
                try { await cloudinary.uploader.destroy(img.public_id); } catch (e) { console.log("cloud destroy err:", e.message); }
              }
            }
          }
          await Lesson.findByIdAndDelete(ex._id);
          await Curriculum.findByIdAndUpdate(curriculumId, {
            $pull: { lessonPosition: { lId: ex._id } },
          });
        }
      }
    }

    // -----------------------
    // Final: return updated curriculum populated with lessonPosition.lId
    // -----------------------
    const updatedCurriculum = await Curriculum.findById(curriculumId)
      .populate("lessonPosition.lId", "-__v -createdAt -updatedAt")
      .lean();

    return res.status(200).json({
      status: true,
      message: "Curriculum updated successfully",
      curriculum: updatedCurriculum,
    });

  } catch (err) {
    console.error("updateCurriculum error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

/*                               DELETE CURRICULUM                            */
/* -------------------------------------------------------------------------- */
export const deleteCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id);
    if (!curriculum) return res.status(404).json({ message: "Curriculum not found" });

    // Delete associated images
    for (const img of curriculum.images) {
      if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
    }

    // Delete units + lessons
    const units = await Unit.find({ curriculum: curriculum._id });
    for (const unit of units) {
      const lessons = await Lesson.find({ unit: unit._id });
      for (const lesson of lessons) {
        // Delete lesson images
        for (const img of lesson.images) {
          if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
        }
        await lesson.deleteOne();
      }

      // Delete unit images
      for (const img of unit.images) {
        if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
      }

      await unit.deleteOne();
    }

    await curriculum.deleteOne();

    res.json({ message: "Curriculum deleted successfully" });
  } catch (error) {
    console.error("Delete curriculum error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllCurriculumById = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 30,

    } = req.query;

    page = Number(page);
    limit = Number(limit);
    const { id } = req.params

    const curriculumFilter = { status: "Active", createdBy: id };

    const totalCurriculum = await Curriculum.countDocuments(curriculumFilter);

    const curriculumList = await Curriculum.find(curriculumFilter)
      .populate("createdBy", "name email image averageRating totalRatings")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // ---------------------------
    res.json({
      success: true,
      data: curriculumList,
      total: totalCurriculum,
      totalPages: Math.ceil(totalCurriculum / limit),

    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

