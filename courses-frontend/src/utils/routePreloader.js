// Route preloading utility to prefetch route chunks on user intent (hover/touch)
// before the click occurs. This eliminates lazy-loading lag and achieves 0ms perceived navigation.

const preloaded = new Set();

const routeLoaders = {
  home: () => import("../Pages/Home/Home"),
  lesson: () => import("../Pages/Curriculum-Booking/LessonBooking"),
  curriculumLesson: () => import("../Pages/Curriculum-Booking/CurriculumLesson"),
  curriculumBooking: () => import("../Pages/Curriculum-Booking/CurriculumBooking"),
  lessonPayment: () => import("../Pages/Curriculum-Booking/LessonPayment"),
  curriPayment: () => import("../Pages/Curriculum-Booking/CurriPayment"),
  profile: () => import("../Pages/Profile/Profile"),
  publicProfile: () => import("../Pages/Profile/PublicProfile"),
  editProfile: () => import("../Pages/Profile/EditProfile"),
  chat: () => import("../Pages/Chat/Chat"),
  teach: () => import("../Pages/Home/Teach"),
  withdrawal: () => import("../Pages/withdraw/Withdrawal"),
  afterPaymentCurri: () => import("../Pages/Payment/AfterPaymentCuri"),
};

/**
 * Preload a specific route type into browser cache
 * @param {'home'|'lesson'|'curriculumLesson'|'curriculumBooking'|'lessonPayment'|'curriPayment'|'profile'|'publicProfile'|'editProfile'|'chat'|'teach'|'withdrawal'|'afterPaymentCurri'} type
 */
export const preloadRoute = (type) => {
  if (!type || preloaded.has(type) || !routeLoaders[type]) return;
  preloaded.add(type);
  try {
    routeLoaders[type]();
  } catch (err) {
    console.debug("Preload error for route:", type, err);
  }
};

/**
 * Helper to preload route based on URL path
 * @param {string} path
 */
export const preloadRouteByPath = (path) => {
  if (!path || typeof path !== "string") return;
  if (path.includes("/lesson-booking")) return preloadRoute("lesson");
  if (path.includes("/curriculum-lesson")) return preloadRoute("curriculumLesson");
  if (path.includes("/curriculum-booking")) return preloadRoute("curriculumBooking");
  if (path.includes("/lesson-payment")) return preloadRoute("lessonPayment");
  if (path.includes("/curriculum-payment")) return preloadRoute("curriPayment");
  if (path.includes("/user-profile")) return preloadRoute("publicProfile");
  if (path.includes("/profile")) return preloadRoute("profile");
  if (path.includes("/chat")) return preloadRoute("chat");
  if (path.includes("/teach")) return preloadRoute("teach");
  if (path.includes("/withdrawal")) return preloadRoute("withdrawal");
  if (path === "/" || path === "") return preloadRoute("home");
};
