import Lesson from "../models/Lesson.js";
import { geocodeAddress } from "../utils/geocodeAddress.js";
import { getPlaceDetails } from "../utils/getPlaceDetails.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import Curriculum from "../models/Curriculum.js";
import { createLessonCalender, updateLessonCalender, addLessonToLessonCalender, updateLessonInLessonCalender, removeLessonFromLessonCalender } from "./lessonCalenderController.js";
import { addLessonToAvailability, updateLessonInAvailability, removeLessonFromAvailability } from "./availabilityController.js";
import { convertToUsd, requireCurrency, requirePositivePrice } from "../services/currencyService.js";
import { requireTeacherPayoutCurrency } from "../services/stripeService.js";

const parseBoolean = (value) => value === true || value === "true";
const geocodeCache = new Map();
const GEOCODE_CACHE_MS = 24 * 60 * 60 * 1000;

const getCachedGeocode = async (location) => {
  const key = String(location).trim().toLowerCase();
  const cached = geocodeCache.get(key);
  if (cached && Date.now() - cached.cachedAt < GEOCODE_CACHE_MS) return cached.value;
  const value = await geocodeAddress(location);
  geocodeCache.set(key, { value, cachedAt: Date.now() });
  return value;
};

/* ----------------------------- CREATE LESSON ----------------------------- */
export const createLesson = async (req, res) => {
  try {
    const { title, category, description, price, duration, isOnline, supportsInPerson, location, placeId, calenderId, weeklyHours, dateSpecificHours, timeZone, calender, usecapacity, discount ,message,isGroupAvailable, calendarName, inputCurrency = "USD"} = req.body;
    const userId = req.user._id;
    const isOnlineFlag = parseBoolean(isOnline);
    const supportsInPersonFlag = parseBoolean(supportsInPerson);
    const isGroupAvailableFlag = parseBoolean(isGroupAvailable);
    const usesDefaultCalendar = parseBoolean(calender);
    const usesSpecificCalendar = calender === false || calender === "false";
    let resolvedCalenderId = usesSpecificCalendar && calenderId ? calenderId : null;
    if (!title || !category || price === undefined || price === "") {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(400).json({ status: false, message: "Title, category and price are required" });
    }

    const lessonCurrency = requireCurrency(inputCurrency);
    const canonicalPrice = requirePositivePrice(price, lessonCurrency);
    await requireTeacherPayoutCurrency(userId, lessonCurrency);

    // Minimum 2 images (1 cover + at least 1 lesson image)
    if (!req.files || req.files.length < 2) {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(400).json({ status: false, message: "Minimum 2 images are required (1 cover + at least 1 lesson image)" });
    }

    if (supportsInPersonFlag && !location && !placeId) {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(400).json({ status: false, message: "Location is required for in-person lessons" });
    }

    // Upload images to Cloudinary
    const uploadedImages = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, { folder: "lessons" });
      uploadedImages.push({ url: result.secure_url, public_id: result.public_id });
      fs.unlinkSync(file.path);
    }

    // Separate cover image (first image) from lesson images (rest)
    const coverImage = uploadedImages[0];
    const lessonImages = uploadedImages.slice(1);

    let lat = null, lng = null, address = location || "", resolvedPlaceId = placeId || null;
    if (supportsInPersonFlag && (location || placeId)) {
      const place = placeId ? await getPlaceDetails(placeId) : { lat: null, lng: null, address: null };
      const geo = !place.lat && location ? await geocodeAddress(location) : {};
      lat = place.lat ?? geo.lat ?? null;
      lng = place.lng ?? geo.lng ?? null;
      address = place.address || location || "";
    }

    const lesson = await Lesson.create({
      title,
      category,
      description,
      message,
      price: canonicalPrice,
      currency: lessonCurrency,
      duration,
      usecapacity: usecapacity ?? 0,
      discount: discount ?? 0,
      isOnline: isOnlineFlag,
      isGroupAvailable: isGroupAvailableFlag,
      location: supportsInPersonFlag && location ? location : "",
      address: supportsInPersonFlag && address ? address : "",
      placeId: supportsInPersonFlag ? resolvedPlaceId : null,
      lat,
      lng,
      isIndependent: true,
      coverImage: coverImage,
      images: lessonImages,
      createdBy: userId,
      calender: usesDefaultCalendar,
      calenderId: resolvedCalenderId,
    ...( !isOnlineFlag && lng && lat
    ? {
        geoLocation: {
          type: "Point",
          coordinates: [lng, lat], // ⚠️ correct order
        },
      }
    : {}
  ),
    });

  
    // Add to availability slots
    if (usesDefaultCalendar) {
    await addLessonToAvailability(userId, lesson._id, isGroupAvailableFlag, weeklyHours, dateSpecificHours);
  }
    // Add to lessonCalender slots (only if calenderId exists)
   

    if (usesSpecificCalendar && resolvedCalenderId === null) {

      const calenderResult = await createLessonCalender({
        weeklyHours,
        dateSpecificHours,
        timeZone,
        userId,
        type:"lesson",
        lessonId: lesson._id,
        calendarName: calendarName || "Calendar",
      });

      if (calenderResult?.calenderId) {
        resolvedCalenderId = calenderResult.calenderId;
        lesson.calenderId = resolvedCalenderId;
        await lesson.save();
    
      }
    }
    if (usesSpecificCalendar) {
  await addLessonToLessonCalender(userId, lesson._id, isGroupAvailableFlag, resolvedCalenderId, weeklyHours, dateSpecificHours);
      if (resolvedCalenderId && String(lesson.calenderId || "") !== String(resolvedCalenderId)) {
        lesson.calenderId = resolvedCalenderId;
        lesson.calender = false;
        await lesson.save();
      }
    }
    res.status(201).json({ status: true, message: "Lesson created successfully", lesson });
  } catch (error) {
    console.error("Create lesson error:", error);
    res.status(error.status || 500).json({ status: false, message: error.message });
  }
};

/* ------------------------------ GET ALL LESSONS ----------------------------- */
export const getAllLessons = async (req, res) => {
  try {
    let {
      page,
      limit,
      search = "",
      minPrice,
      maxPrice,
      isOnline,
      supportsInPerson,
      location,
      category,
      currency = "USD",
      lat,
      lng,
      radiusKm = 50,
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 15;

    // ---------------------------
    // Base Filters
    // ---------------------------
    let lessonMatch = {
      status: "Active",
      isIndependent: true,
    };

    let curriculumMatch = {
      status: "Active",
    };

    // ---------------------------
    // Price
    // ---------------------------
    if (minPrice !== undefined && maxPrice !== undefined && minPrice !== "" && maxPrice !== "") {
      const usdMin = await convertToUsd(minPrice, currency);
      const usdMax = await convertToUsd(maxPrice, currency);
      lessonMatch.price = { $gte: usdMin, $lte: usdMax };
      curriculumMatch.price = { $gte: usdMin, $lte: usdMax };
    }

    // ---------------------------
    // Search
    // ---------------------------
    if (search.trim()) {
      lessonMatch.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];

      curriculumMatch.title = { $regex: search, $options: "i" };
    }

    // ---------------------------
    // Online / Offline
    // ---------------------------
    const wantsInPerson = supportsInPerson === "true";

    if (wantsInPerson) {
      lessonMatch.isOnline = false;
      curriculumMatch.isOnline = false;
    } else if (isOnline !== undefined) {
      lessonMatch.isOnline = isOnline === "true";
      curriculumMatch.isOnline = isOnline === "true";
    }

    // ---------------------------
    // Category
    // ---------------------------
    if (category?.trim()) {
      lessonMatch.category = { $regex: category, $options: "i" };
      curriculumMatch.category = { $regex: category, $options: "i" };
    }

    // ---------------------------
    // 📍 GEO LOGIC
    // ---------------------------
    let geoCoords = null;

    if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      geoCoords = {
        type: "Point",
        coordinates: [Number(lng), Number(lat)],
      };
    } else if (location?.trim()) {
      const geo = await getCachedGeocode(location);

      if (geo?.lat && geo?.lng) {
        geoCoords = {
          type: "Point",
          coordinates: [geo.lng, geo.lat],
        };
      } else {
        // fallback text search
        lessonMatch.$or = [
          { location: { $regex: location, $options: "i" } },
          { address: { $regex: location, $options: "i" } },
        ];

        curriculumMatch.location = { $regex: location, $options: "i" };
      }
    }

    if (geoCoords) {
      const radiusRadians = Math.max(1, Number(radiusKm) || 50) / 6378.1;
      const geoFilter = {
        $geoWithin: {
          $centerSphere: [geoCoords.coordinates, radiusRadians],
        },
      };
      lessonMatch.geoLocation = geoFilter;
      curriculumMatch.geoLocation = geoFilter;
    }

    // ---------------------------
    // Count
    // ---------------------------
    const [totalIndependent, totalCurriculum] = await Promise.all([
      Lesson.countDocuments(lessonMatch),
      Curriculum.countDocuments(curriculumMatch),
    ]);

    // ---------------------------
    // Fetch enough newest candidates from both collections to build a single,
    // globally chronological page after merging them.
    // ---------------------------
    const totalCourses = totalIndependent + totalCurriculum;
    const totalPages = Math.max(1, Math.ceil(totalCourses / limit));
    const pageOffset = (page - 1) * limit;

    // ===========================
    // 🔥 LESSON PIPELINE
    // ===========================
    // Lessons and curricula are queried together below with $unionWith.

    // ===========================
    // 🔥 CURRICULUM PIPELINE
    // ===========================
    const pageFeed = await Lesson.aggregate([
      { $match: lessonMatch },
      { $addFields: { feedType: "lesson" } },
      {
        $unionWith: {
          coll: "curriculums",
          pipeline: [
            { $match: curriculumMatch },
            { $addFields: { feedType: "curriculum" } },
          ],
        },
      },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: pageOffset },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
          pipeline: [
            { $project: { name: 1, email: 1, image: 1, averageRating: 1, totalRatings: 1 } },
          ],
        },
      },
      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
    ]);

    const allIndependentLessons = pageFeed
      .filter((item) => item.feedType === "lesson")
      .map(({ feedType, ...item }) => item);
    const curriculumList = pageFeed
      .filter((item) => item.feedType === "curriculum")
      .map(({ feedType, ...item }) => item);

    // ---------------------------
    // Response
    // ---------------------------
    res.json({
      success: true,
      independentLessons: allIndependentLessons,
      independentTotal: totalIndependent,
      curriculumList,
      curriculumTotal: totalCurriculum,
      independentTotalPages: Math.ceil(totalIndependent / limit),
      curriculumTotalPages: Math.ceil(totalCurriculum / limit),
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      page,
      limit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// old but good
// export const getAllLessons = async (req, res) => {
//   try {
//     let {
//       page,
//       limit,
//       search = "",
//       minPrice,
//       maxPrice,
//       isOnline,
//       supportsInPerson,
//       location,
//       category,
//     } = req.query;

//     page = Number(page) || 1;
//     limit = Number(limit) || 15;

//     // ---------------------------
//     // Lesson Filters (Independent Lessons)
//     // ---------------------------
//     const lessonFilter = {
//       status: "Active",
   
//       isIndependent: true, // only independent true
//     };

//     if(minPrice){
//          lessonFilter.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
//     }
//     if (search.trim()) {
//       lessonFilter.$or = [
//         { title: { $regex: search, $options: "i" } },
//         { category: { $regex: search, $options: "i" } },
//       ];
//     }

//     const wantsInPerson = supportsInPerson === "true";

//     if (wantsInPerson) {
//       lessonFilter.$or = [
//         { isOnline: false },
//         { location: { $exists: true, $ne: "" } },
//       ];
//     } else if (isOnline !== undefined) {
//       lessonFilter.isOnline = isOnline === "true";
//     }

//     if (location?.trim()) {
//       // Match location keyword in either location or address fields (if address exists)
//       lessonFilter.$or = [
//         { location: { $regex: location, $options: "i" } },
//         { address: { $regex: location, $options: "i" } } // if you have an address field
//       ];
//     }

//     if (category?.trim()) {
//       lessonFilter.category = { $regex: category, $options: "i" };
//     }

//     // ---------------------------
//     // Curriculum Filters
//     // ---------------------------
//     const curriculumFilter = { status: "Active" };

//     if (search.trim()) {
//       curriculumFilter.title = { $regex: search, $options: "i" };
      
//     }
   
//     if(minPrice){
//       curriculumFilter.price = { $gte: Number(minPrice), $lte: Number(maxPrice) }
//     }

  
//     if (wantsInPerson) {
//       curriculumFilter.$or = [
//         { isOnline: false },
//         { location: { $exists: true, $ne: "" } },
//       ];
//     } else if (isOnline) {
//       curriculumFilter.isOnline = isOnline === "true";
//     }

//     if (location?.trim()) {
//       curriculumFilter.location = { $regex: location, $options: "i" };
//     }

//     if (category?.trim()) {
//       curriculumFilter.category = { $regex: category, $options: "i" };
//     }

//     // ---------------------------
//     // Count both, then smart-split limit
//     // ---------------------------
//     const totalIndependent = await Lesson.countDocuments(lessonFilter);
//     const totalCurriculum = await Curriculum.countDocuments(curriculumFilter);

//     // Smart split: total items per page always = limit (15)
//     // If one type has fewer items than half, give remaining slots to the other
//     let lessonLimit, curriculumLimit;
//     if (totalIndependent === 0) {
//       lessonLimit = 0;
//       curriculumLimit = limit;
//     } else if (totalCurriculum === 0) {
//       lessonLimit = limit;
//       curriculumLimit = 0;
//     } else {
//       const half = Math.ceil(limit / 2);
//       // Calculate how many items are available on current page for each type
//       const availableLessons = Math.max(0, totalIndependent - (page - 1) * half);
//       const availableCurriculums = Math.max(0, totalCurriculum - (page - 1) * half);

//       if (availableCurriculums <= half) {
//         // Curriculum kam hai, uske actual available le lo, baaki lessons se bharo
//         curriculumLimit = Math.min(availableCurriculums, half);
//         lessonLimit = limit - curriculumLimit;
//       } else if (availableLessons <= half) {
//         // Lessons kam hai, uske actual available le lo, baaki curriculum se bharo
//         lessonLimit = Math.min(availableLessons, half);
//         curriculumLimit = limit - lessonLimit;
//       } else {
//         lessonLimit = half;
//         curriculumLimit = limit - half;
//       }
//     }

//     const allIndependentLessons = lessonLimit > 0 ? await Lesson.aggregate([
//       { $match: lessonFilter },
//       {
//         $lookup: {
//           from: "users",
//           localField: "createdBy",
//           foreignField: "_id",
//           as: "createdBy",
//           pipeline: [
//             { $project: { name: 1, email: 1, image: 1, averageRating: 1, totalRatings: 1 } },
//           ],
//         },
//       },
//       { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
//       { $skip: (page - 1) * lessonLimit },
//       { $limit: lessonLimit },
//       { $sample: { size: lessonLimit } },
//     ]) : [];

//     // ---------------------------
//     // Curriculum Pagination
//     // ---------------------------
//     const curriculumList = curriculumLimit > 0 ? await Curriculum.aggregate([
//       { $match: curriculumFilter },
//       {
//         $lookup: {
//           from: "users",
//           localField: "createdBy",
//           foreignField: "_id",
//           as: "createdBy",
//           pipeline: [
//             { $project: { name: 1, email: 1, image: 1, averageRating: 1, totalRatings: 1 } },
//           ],
//         },
//       },
//       { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
//       { $skip: (page - 1) * curriculumLimit },
//       { $limit: curriculumLimit },
//       { $sample: { size: curriculumLimit } },
//     ]) : [];

//     // ---------------------------
//     // FINAL RESPONSE
//     // ---------------------------
//     res.json({
//       success: true,

//       // Independent Lessons
//       independentLessons: allIndependentLessons,
//       independentTotal: totalIndependent,
//       independentTotalPages: lessonLimit > 0 ? Math.ceil(totalIndependent / lessonLimit) : 0,

//       // Curriculum List
//       curriculumList,
//       curriculumTotal: totalCurriculum,
//       curriculumTotalPages: curriculumLimit > 0 ? Math.ceil(totalCurriculum / curriculumLimit) : 0,

//       page,
//       limit,
//     });

//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
/* ------------------------------ GET Teacher LESSONS ----------------------------- */
export const getTeacherLessons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { createdBy: req.user.id,isIndependent:true };

    // Get paginated lessons
    const lessons = await Lesson.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit).populate("createdBy", "name email image averageRating totalRatings");

    // Count total lessons for this teacher
    const total = await Lesson.countDocuments(query);

    res.json({
      status: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      lessons
    });

  } catch (error) {
    console.log("first", error)
    res.status(error.status || 500).json({ status: false, message: error.message });
  }
};

/* ------------------------------ GET SINGLE LESSON --------------------------- */
export const getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate("createdBy", "name email image averageRating totalRatings");
    if (!lesson) return res.status(404).json({ status: false, message: "Lesson not found" });
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ----------------------------- UPDATE LESSON ----------------------------- */
export const updateLesson = async (req, res) => {
  try {
    const { title, category, description, price, duration, isOnline, supportsInPerson, location, placeId, status, calender, calenderId, weeklyHours, dateSpecificHours, timeZone, existingImages, existingCoverImageId, usecapacity, discount ,message,isGroupAvailable, updatedWeeklyAvailability, updatedDateAvailability, calendarName, inputCurrency = "USD"} = req.body;
    const lesson = await Lesson.findById(req.params.id);
    const isOnlineFlag = parseBoolean(isOnline);
    const supportsInPersonFlag = parseBoolean(supportsInPerson);
    const isGroupAvailableFlag = parseBoolean(isGroupAvailable);

    if (!lesson) {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(404).json({ status: false, message: "Lesson not found" });
    }

    // Handle files separately by field name
    let coverImageFile = null;
    let lessonImageFiles = [];
    
    if (req.files && req.files.length > 0) {
      // Separate files by fieldname: 'coverImage' vs 'images'
      req.files.forEach(file => {
        if (file.fieldname === 'coverImage') {
          coverImageFile = file;
        } else if (file.fieldname === 'images') {
          lessonImageFiles.push(file);
        }
      });
    }

    // Handle cover image upload (if new cover image provided)
    if (coverImageFile) {
      const result = await cloudinary.uploader.upload(coverImageFile.path, { folder: "lessons" });
      fs.unlinkSync(coverImageFile.path);
      
      // Delete old cover image from Cloudinary if exists
      if (lesson.coverImage?.public_id) {
        await cloudinary.uploader.destroy(lesson.coverImage.public_id);
      }
      
      lesson.coverImage = { url: result.secure_url, public_id: result.public_id };
    } else if (existingCoverImageId) {
      // Keep existing cover image - existingCoverImageId confirms user didn't change it
      // Nothing to do, cover remains as is
    }

    // Handle lesson image uploads (if new lesson images provided)
    let uploadedImagesPublicIds = [];
    if (lessonImageFiles.length > 0) {
      const uploadedImages = [];
      for (const file of lessonImageFiles) {
        const result = await cloudinary.uploader.upload(file.path, { folder: "lessons" });
        uploadedImages.push({ url: result.secure_url, public_id: result.public_id });
        uploadedImagesPublicIds.push(result.public_id);
        fs.unlinkSync(file.path);
      }
      // Add new images to existing ones
      lesson.images = [...(lesson.images || []), ...uploadedImages];
    }

    // Handle lesson images updates (keeping existing + removing deleted)
    let finalImages = lesson.images || [];
    
    // Parse existingImages if it's a string (from FormData)
    let existingImagesList = [];
    if (existingImages) {
      try {
        // Try to parse as JSON first (new format with order)
        existingImagesList = Array.isArray(existingImages) ? existingImages : JSON.parse(existingImages);
      } catch (e) {
        // Fallback to treating as single value or array of values (old format)
        existingImagesList = Array.isArray(existingImages) ? existingImages : [existingImages];
      }
    }

    // Combine existing images list with newly uploaded images
    const allImagesToKeep = [...existingImagesList, ...uploadedImagesPublicIds];

    // Keep only the lesson images that are in the combined list, preserving order
    if (allImagesToKeep.length > 0) {
      // Preserve the order from the frontend by mapping allImagesToKeep
      finalImages = allImagesToKeep
        .map((public_id) => (lesson.images || []).find((img) => img.public_id === public_id))
        .filter((img) => img !== undefined); // Remove any undefined entries
      
      // Delete lesson images that are NOT in the combined list (i.e., removed by user)
      const imagesToDelete = (lesson.images || []).filter(img => !allImagesToKeep.includes(img.public_id));
      for (const img of imagesToDelete) {
        if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
      }
    }

    // Update lesson images
    lesson.images = finalImages;

    if (title) lesson.title = title;
    if (category) lesson.category = category;
    if (description) lesson.description = description;
    if (message) lesson.message = message;
    if (price !== undefined && price !== "") {
      const lessonCurrency = requireCurrency(inputCurrency || lesson.currency);
      lesson.price = requirePositivePrice(price, lessonCurrency);
      lesson.currency = lessonCurrency;
    }
    if (duration) lesson.duration = duration;
    if (usecapacity !== undefined) lesson.usecapacity = usecapacity;
    if (discount !== undefined) lesson.discount = discount;
    if (isOnline !== undefined) lesson.isOnline = isOnlineFlag;

    if (supportsInPersonFlag) {
      if (location !== undefined || placeId !== undefined) {
        const place = placeId ? await getPlaceDetails(placeId) : { lat: null, lng: null, address: null };
        const fallbackLocation = location || lesson.location || "";
        const geo = !place.lat && fallbackLocation ? await geocodeAddress(fallbackLocation) : {};
        const resolvedAddress = place.address || lesson.address || lesson.location || fallbackLocation;

        lesson.location = fallbackLocation;
        lesson.address = resolvedAddress;
        lesson.placeId = placeId || lesson.placeId || null;
        lesson.lat = place.lat ?? geo.lat ?? lesson.lat ?? null;
        lesson.lng = place.lng ?? geo.lng ?? lesson.lng ?? null;
      }
    } else if (supportsInPerson === "false" || supportsInPerson === false) {
      lesson.location = "";
      lesson.address = "";
      lesson.placeId = null;
      lesson.lat = null;
      lesson.lng = null;
    }

    if (status) lesson.status = status;
    if (isGroupAvailable !== undefined) lesson.isGroupAvailable = isGroupAvailableFlag;

    if (calender !== undefined) lesson.calender = calender;

    // ============ Build per-slot override data from edited availability ============
    const DAY_NAMES_MAP = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let weeklyOverride = weeklyHours || null;
    let dateOverride = dateSpecificHours || null;

    // Convert frontend format {0: {slots: [{start, end, group}]}} to backend format [{day, slots: [{start, end, group}]}]
    if (updatedWeeklyAvailability) {
      const parsed = typeof updatedWeeklyAvailability === 'string' ? JSON.parse(updatedWeeklyAvailability) : updatedWeeklyAvailability;
      const overrideArr = [];
      for (let i = 0; i < 7; i++) {
        const dayData = parsed[i] || parsed[String(i)];
        if (dayData) {
          overrideArr.push({
            day: DAY_NAMES_MAP[i],
            available: !dayData.unavailable,
            slots: (dayData.slots || []).map(s => ({ start: s.start, end: s.end, group: s.group ?? false }))
          });
        }
      }
      if (overrideArr.length > 0) weeklyOverride = overrideArr;
    }

    if (updatedDateAvailability) {
      const parsed = typeof updatedDateAvailability === 'string' ? JSON.parse(updatedDateAvailability) : updatedDateAvailability;
      if (Array.isArray(parsed) && parsed.length > 0) {
        dateOverride = parsed.map(d => ({
          date: d.date,
          available: !d.unavailable,
          slots: (d.slots || []).map(s => ({ start: s.start, end: s.end, group: s.group ?? false }))
        }));
      }
    }

    // ============ Update lesson in availability and lessonCalender ============
    const incomingCalender = calender === "true" || calender === true;
    const incomingCalenderFalse = calender === "false" || calender === false;
    const useDefaultCalendar = incomingCalender || (!incomingCalenderFalse && lesson.calender);

    if (useDefaultCalendar) {
      await updateLessonInAvailability(lesson.createdBy, lesson._id, isGroupAvailableFlag, weeklyOverride, dateOverride);
    }

    // Update lessonCalender (only if calenderId exists)
    let resolvedCalenderId = calenderId || lesson.calenderId || null;

    // Calendar handling — runs when switching to or staying on a specific calendar (not default)
    if (incomingCalenderFalse || (!incomingCalender && !lesson.calender)) {
      if (weeklyHours || dateSpecificHours || timeZone) {
        // Creating/updating calendar slots via weeklyHours
        const updateResult = await updateLessonCalender({
          calenderId: resolvedCalenderId,
          lessonId: lesson._id,
          weeklyHours,
          dateSpecificHours,
          timeZone,
          calendarName,
        });

        if (!updateResult.updated && updateResult.reason === "not_found") {
          const createResult = await createLessonCalender({
            weeklyHours,
            dateSpecificHours,
            timeZone,
            userId: lesson.createdBy,
            type: "lesson",
            lessonId: lesson._id,
            calendarName: calendarName || "Calendar",
          });
          if (createResult?.calenderId) {
            resolvedCalenderId = createResult.calenderId;
          }
        } else if (updateResult?.calenderId) {
          resolvedCalenderId = updateResult.calenderId;
        }
      }

      if (resolvedCalenderId) {
        // If switching to a different calendar, remove lesson from the old one first
        const oldCalenderId = lesson.calenderId?.toString();
        if (oldCalenderId && oldCalenderId !== resolvedCalenderId.toString()) {
          await removeLessonFromLessonCalender(lesson.createdBy, lesson._id, oldCalenderId);
        }

        lesson.calenderId = resolvedCalenderId;
        lesson.calender = false;

        // Add lesson to the new calendar (addLessonToLessonCalender is idempotent — skips if already exists)
        await addLessonToLessonCalender(lesson.createdBy, lesson._id, isGroupAvailableFlag, resolvedCalenderId, weeklyOverride, dateOverride);
        // Also update group flags for existing entries
        await updateLessonInLessonCalender(lesson.createdBy, lesson._id, isGroupAvailableFlag, resolvedCalenderId, weeklyOverride, dateOverride);
      }
    }

    // If switching to default calendar, clear calenderId and remove from old lesson calendar
    if (incomingCalender) {
      // Remove lesson from old lesson-specific calendar if it had one
      if (lesson.calenderId) {
        await removeLessonFromLessonCalender(lesson.createdBy, lesson._id, lesson.calenderId.toString());
      }
      lesson.calender = true;
      lesson.calenderId = null;
    }

    await lesson.save();
    res.json({ status: true, message: "Lesson updated successfully", lesson });
  } catch (error) {
    console.error("Update lesson error:", error);
    res.status(error.status || 500).json({ status: false, message: error.message });
  }
};

/* ----------------------------- DELETE LESSON ----------------------------- */
export const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // ============ Remove lesson from availability and lessonCalender ============
    await removeLessonFromAvailability(lesson.createdBy, lesson._id);
    
    // Remove from lessonCalender (only if calenderId exists)
    if (lesson.calenderId) {
      await removeLessonFromLessonCalender(lesson.createdBy, lesson._id, lesson.calenderId);
    }

    // Delete images from Cloudinary
    for (const img of lesson.images) {
      if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
    }
    await lesson.deleteOne();
    res.json({ status: true, message: "Lesson deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};


export const getLesson = async (req, res) => {
  try {
    const lessonId = req.params.id;

    // 1️⃣ Fetch lesson with creator + curriculums
    const lesson = await Lesson.findById(lessonId)
      .populate("createdBy", "name email image averageRating totalRatings")
      .populate({
        path: "curriculums",
        select: "title description images price createdBy lessonPosition",
        populate: {
          path: "createdBy",
          select: "name email image"
        }
      });

    if (!lesson) {
      return res.status(404).json({ status: false, message: "Lesson not found" });
    }

    const curriculums = lesson.curriculums || [];

    // 2️⃣ Prepare final array
    const curriculumBlocks = [];

    for (const curr of curriculums) {
      const curriculumId = curr._id;

      // 3️⃣ Get full curriculum with sorted lessonPosition
      const fullCurr = await Curriculum.findById(curriculumId)
        .select("title description lessonPosition createdBy images price")
        .populate("createdBy", "name email image averageRating totalRatings")
        .lean();

      if (!fullCurr) continue;

      // Sort by lesson position
      const orderedPositions = [...fullCurr.lessonPosition].sort(
        (a, b) => a.position - b.position
      );

      const lessonIds = orderedPositions.map((p) => p.lId);

      // 4️⃣ Fetch lessons inside this curriculum
      const lessons = await Lesson.find({ _id: { $in: lessonIds } })
        .populate("createdBy", "name email image averageRating totalRatings")
        .lean();

      const lessonsMap = {};
      lessons.forEach((ls) => {
        lessonsMap[ls._id.toString()] = ls;
      });

      // Build ordered lesson list
      const lessonsInOrder = orderedPositions.map((pos) => ({
        position: pos.position,
        unitPosition: pos.unitPosition ?? null,
        lesson: lessonsMap[pos.lId.toString()] || null
      }));

      // 6️⃣ Push block
      curriculumBlocks.push({
        curriculumInfo: {
          _id: fullCurr._id,
          title: fullCurr.title,
          images: fullCurr.images,
          price: fullCurr.price,
          description: fullCurr.description,
          createdBy: fullCurr.createdBy
        },
        lessonsInOrder,

      });
    }

    return res.json({
      status: true,
      lesson,
      curriculums: curriculumBlocks
    });

  } catch (error) {
    console.error("getLessonById error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};


export const getAllLessonsById = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 30,

    } = req.query;

    page = Number(page);
    limit = Number(limit);
    const { id } = req.params

    // ---------------------------
    const lessonFilter = {
      isIndependent: true, // only independent true
      createdBy: id
    };

    const totalIndependent = await Lesson.countDocuments(lessonFilter);

    const allLessons = await Lesson.find(lessonFilter)
      .populate("createdBy", "name email image averageRating totalRatings")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);



    // ---------------------------
    res.json({
      success: true,
      data: allLessons,
      total: totalIndependent,
      totalPages: Math.ceil(totalIndependent / limit),
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------------------ GET Teacher LESSONS ----------------------------- */
export const getTeacherLessonsById = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { createdBy: req.params.id,isIndependent:true };

    // Get paginated lessons
    const lessons = await Lesson.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit).populate("createdBy", "name email image averageRating totalRatings");

    // Count total lessons for this teacher
    const total = await Lesson.countDocuments(query);

    res.json({
      status: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      lessons
    });

  } catch (error) {
    console.log("first", error)
    res.status(500).json({ status: false, message: error.message });
  }
};
