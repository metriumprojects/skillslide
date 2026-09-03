import Curriculum from "../models/Curriculum.js";
import Lesson from "../models/Lesson.js";
import Listing from "../models/Listing.js";
import { geocodeAddress } from "../utils/geocodeAddress.js";
import {
  SUPPORTED_CURRENCIES,
  convertCurrency,
  convertToUsd,
  requireCurrency,
} from "../services/currencyService.js";

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

const buildPriceFilters = async ({ minPrice, maxPrice, currency }) => {
  if (minPrice === undefined || maxPrice === undefined || minPrice === "" || maxPrice === "") {
    return { coursePrice: null, listingPrice: null };
  }

  const filterCurrency = requireCurrency(currency);
  const usdMin = await convertToUsd(minPrice, filterCurrency);
  const usdMax = await convertToUsd(maxPrice, filterCurrency);
  const listingRanges = await Promise.all(
    SUPPORTED_CURRENCIES.map(async (listingCurrency) => {
      const min = await convertCurrency(minPrice, filterCurrency, listingCurrency);
      const max = await convertCurrency(maxPrice, filterCurrency, listingCurrency);
      return {
        currency: listingCurrency,
        price: { $gte: min.amount, $lte: max.amount },
      };
    })
  );

  return {
    coursePrice: { $gte: usdMin, $lte: usdMax },
    listingPrice: {
      $or: [
        ...listingRanges,
        {
          currency: { $exists: false },
          price: { $gte: usdMin, $lte: usdMax },
        },
      ],
    },
  };
};

export const getDiscoverFeed = async (req, res) => {
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
      type,
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 20;
    const skip = (page - 1) * limit;

    const lessonMatch = { status: "Active", isIndependent: true };
    const curriculumMatch = { status: "Active" };
    const listingMatch = { status: "Active" };
    const typeFilter =
      type === "learn" ||
      type === "build" ||
      type === "lesson" ||
      type === "curriculum"
        ? type
        : "";
    if (typeFilter === "learn" || typeFilter === "lesson" || typeFilter === "curriculum") {
      listingMatch._id = { $exists: false };
    }
    if (typeFilter === "build" || typeFilter === "curriculum") {
      lessonMatch._id = { $exists: false };
    }
    if (typeFilter === "build" || typeFilter === "lesson") {
      curriculumMatch._id = { $exists: false };
    }
    const listingAndFilters = [];
    const { coursePrice, listingPrice } = await buildPriceFilters({
      minPrice,
      maxPrice,
      currency,
    });

    if (coursePrice) {
      lessonMatch.price = coursePrice;
      curriculumMatch.price = coursePrice;
    }
    if (listingPrice) {
      listingAndFilters.push(listingPrice);
    }

    if (search.trim()) {
      lessonMatch.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
      curriculumMatch.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
      listingAndFilters.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    const wantsInPerson = supportsInPerson === "true";
    if (wantsInPerson) {
      lessonMatch.isOnline = false;
      curriculumMatch.isOnline = false;
      listingMatch.supportsInPerson = true;
    } else if (isOnline !== undefined) {
      const onlineValue = isOnline === "true";
      lessonMatch.isOnline = onlineValue;
      curriculumMatch.isOnline = onlineValue;
      listingMatch.isOnline = onlineValue;
    }

    if (category?.trim()) {
      lessonMatch.category = { $regex: category, $options: "i" };
      curriculumMatch.category = { $regex: category, $options: "i" };
      listingMatch.category = { $regex: category, $options: "i" };
    }

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
        lessonMatch.$or = [
          ...(lessonMatch.$or || []),
          { location: { $regex: location, $options: "i" } },
          { address: { $regex: location, $options: "i" } },
        ];
        curriculumMatch.$or = [
          ...(curriculumMatch.$or || []),
          { location: { $regex: location, $options: "i" } },
          { address: { $regex: location, $options: "i" } },
        ];
        listingAndFilters.push({
          $or: [
            { location: { $regex: location, $options: "i" } },
            { address: { $regex: location, $options: "i" } },
          ],
        });
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
      listingMatch.geoLocation = geoFilter;
    }

    if (listingAndFilters.length) listingMatch.$and = listingAndFilters;

    const [lessonTotal, curriculumTotal, listingTotal] = await Promise.all([
      Lesson.countDocuments(lessonMatch),
      Curriculum.countDocuments(curriculumMatch),
      Listing.countDocuments(listingMatch),
    ]);

    const total = lessonTotal + curriculumTotal + listingTotal;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const feed = await Lesson.aggregate([
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
      {
        $unionWith: {
          coll: "listings",
          pipeline: [
            { $match: listingMatch },
            { $addFields: { feedType: "listing" } },
          ],
        },
      },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: skip },
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

    res.json({
      success: true,
      feed,
      independentLessons: feed.filter((item) => item.feedType === "lesson"),
      curriculumList: feed.filter((item) => item.feedType === "curriculum"),
      listings: feed.filter((item) => item.feedType === "listing"),
      independentTotal: lessonTotal,
      curriculumTotal,
      listingTotal,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      page,
      limit,
    });
  } catch (error) {
    console.error("Get discover feed error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};
