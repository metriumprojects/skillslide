# Graph Report - SkillSide  (2026-09-29)

## Corpus Check
- Large corpus: 438 files · ~853,332 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1367 nodes · 4216 edges · 84 communities (66 shown, 18 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 162 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Server Entry & Mailer
- Currency Selector & Profile UI
- Checkout & Payment Flow
- Mobile Navigation & Teacher Card
- Loading States & Skeletons
- Frontend Redux API Layer
- Image Uploader & Availability
- Custom Date Picker Component
- Root Package Metadata
- Frontend Build Dependencies
- Legacy Availability Calendar
- Multi-Currency Calendar View
- Stripe & Testing Assertions
- Booking & Currency Service
- Express Middleware & App Setup
- Database Models & App Settings
- Capacitor Mobile Config
- Request Creation Popups
- Availability & Calendar Sync
- Lesson Calendar Slot Management
- Frontend Linter Config
- Backend Auth Dependencies
- Profile Skeletons & Fallbacks
- Build Debug Utilities
- Chat UI Skeleton Loaders
- Image Processing & Cloudinary
- Lesson Proposals Controller
- Main Layout & Footer
- Capacitor Bridge Types
- Mobile Schedule Table States
- User Controller & OAuth Profile
- Button Spinners & Branding
- Student Profile Bookings & Favorites
- Curriculum Management Controller
- Admin Dashboard User Controller
- Header & Navigation Bar
- Dashboard App & Payment Table
- Auth Flow & Login Screen
- Withdrawal & Payout Rate Limiting
- Curriculums & Lessons Management
- Rating System & Multer Uploads
- Student Stories & File Cleanup
- Search Autocomplete & Overlays
- Curriculum Editing Wizard
- Reviews & JWT Security
- Admin Category Management UI
- Android Testing Infrastructure
- Student Story Modals & UI
- Mobile CLI Dev Tools
- Dashboard UI Dependencies
- Admin Listings Dashboard
- Category Taxonomy Controller
- Footer & Lesson Catalogs
- ESLint Tooling Rules
- Role & User Modification Modals
- Expo Mobile App Config
- Lesson Analysis Scripts
- Dashboard Header & Layout
- Frontend Code Style Config
- React Error Boundaries
- Updated Availability Scheduling
- Stripe Custom Payout Onboarding
- Dashboard Metric Stats Cards
- Frontend Package Build Scripts
- Vite Bundle Splitting Config
- Dashboard Build Scripts
- Gradle Wrapper Scripts
- Stripe Connect UI Embed
- Excel Lesson Importer
- Android Native Capacitor Activity
- Chat Messages Feed
- Listing Data Schemas
- Node Engine Requirements
- Mock User Fixtures
- Chat Duplicate Sanitizer

## God Nodes (most connected - your core abstractions)
1. `MainLayout()` - 69 edges
2. `useCurrency()` - 48 edges
3. `react-icons` - 43 edges
4. `App()` - 41 edges
5. `preloadRoute()` - 34 edges
6. `requireCurrency()` - 32 edges
7. `ButtonSpinner()` - 31 edges
8. `getUserFavorites` - 30 edges
9. `getCardImageUrl()` - 26 edges
10. `mongoose` - 25 edges

## Surprising Connections (you probably didn't know these)
- `getAllData()` --references--> `Withdrawal`  [EXTRACTED]
  src/controllers/dashboardController.js → courses-frontend/src/App.jsx
- `initiateBooking()` --references--> `Curriculum`  [EXTRACTED]
  src/controllers/bookingController.js → courses-frontend/src/Pages/Profile/Profile.jsx
- `getAllCurriculums()` --references--> `Curriculum`  [EXTRACTED]
  src/controllers/dashboardController.js → courses-frontend/src/Pages/Profile/Profile.jsx
- `getAllData()` --references--> `Curriculum`  [EXTRACTED]
  src/controllers/dashboardController.js → courses-frontend/src/Pages/Profile/Profile.jsx
- `getDiscoverFeed()` --references--> `Curriculum`  [EXTRACTED]
  src/controllers/discoverController.js → courses-frontend/src/Pages/Profile/Profile.jsx

## Import Cycles
- None detected.

## Communities (84 total, 18 thin omitted)

### Community 0 - "Server Entry & Mailer"
Cohesion: 0.06
Nodes (59): ref_http, nodemailer, socket.io, app, activeBookingFilter, buildListingOrderSnapshot(), cancelBooking(), checkAvailablityBooking() (+51 more)

### Community 1 - "Currency Selector & Profile UI"
Cohesion: 0.10
Nodes (24): courses_frontend_src_assets_icons_editprofileicon, CurrencySelector(), getCurrencyIcon(), HeaderSearchBar(), Loading(), UserAvatarPlaceholder(), SearchContext, useSearch() (+16 more)

### Community 2 - "Checkout & Payment Flow"
Cohesion: 0.10
Nodes (36): AfterPayment, AfterPaymentCurri, App(), Chat, Cookiepolicy, CreateCurriculum, CreateLesson, CreateTeacherProfile (+28 more)

### Community 3 - "Mobile Navigation & Teacher Card"
Cohesion: 0.17
Nodes (23): Card(), getDistanceFromLatLonInKm(), toFiniteNumber(), CurriculumCard(), Request(), getOptimizedUrl(), RequestCard, BookMark() (+15 more)

### Community 4 - "Loading States & Skeletons"
Cohesion: 0.19
Nodes (26): ProfessionalLoader(), BookingPageSkeleton(), getDesktopImageClass(), ImageGallery(), Reviews(), ReviewsColumn(), ReviewsTabContent(), TeacherCard() (+18 more)

### Community 5 - "Frontend Redux API Layer"
Cohesion: 0.08
Nodes (30): api, categorySlice, createCategory, deleteCategory, initialState, updateCategory, chatSlice, initialState (+22 more)

### Community 6 - "Image Uploader & Availability"
Cohesion: 0.16
Nodes (26): ImageUploader(), CalendarDisplay(), DAY_NAMES, DAYS, MakeAvailability(), MONTHS, TIME_OPTIONS, TimeSelect() (+18 more)

### Community 7 - "Custom Date Picker Component"
Cohesion: 0.16
Nodes (24): CustomDatePicker(), MONTHS, app, auth, firebaseConfig, googleProvider, GoogleLoginButton(), waitForGoogle() (+16 more)

### Community 8 - "Root Package Metadata"
Cohesion: 0.06
Nodes (30): author, bugs, url, description, homepage, axios, moment-timezone, keywords (+22 more)

### Community 9 - "Frontend Build Dependencies"
Cohesion: 0.06
Nodes (30): axios, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, lucide-react, moment-timezone (+22 more)

### Community 10 - "Legacy Availability Calendar"
Cohesion: 0.12
Nodes (23): DAY_NAMES, DAYS, MONTHS, DAY_NAMES, DAYS, displayTimeTo24Hour(), Home(), MONTHS (+15 more)

### Community 11 - "Multi-Currency Calendar View"
Cohesion: 0.17
Nodes (22): useCurrency(), Calendar(), ManageCal(), CurriPayment(), CurriPaymentWithElements(), LessonPayment(), ManageLesson(), AfterPaymentCurri() (+14 more)

### Community 12 - "Stripe & Testing Assertions"
Cohesion: 0.19
Nodes (23): ref_node_assert, ref_node_test, stripe, accountSummary(), addCustomBankAccount(), createConnectAccountSession(), createConnectDashboardLink(), createConnectOnboardingLink() (+15 more)

### Community 13 - "Booking & Currency Service"
Cohesion: 0.21
Nodes (23): ref_axios, initiateBooking(), getRates(), buildPriceFilters(), geocodeCache, getCachedGeocode(), getDiscoverFeed(), convertCurrency() (+15 more)

### Community 14 - "Express Middleware & App Setup"
Cohesion: 0.11
Nodes (18): cookie-parser, express, allowedOrigins, getTeacherFavoritesByID(), getUserFavorites(), getUserFavoritesByUser(), toggleFavorite(), mongoSanitize() (+10 more)

### Community 15 - "Database Models & App Settings"
Cohesion: 0.07
Nodes (18): mongoose, appSettingSchema, availabilitySchema, dateSpecificSchema, lessonSchema, slotSchema, weeklySchema, curriculumRatingSchema (+10 more)

### Community 16 - "Capacitor Mobile Config"
Cohesion: 0.07
Nodes (27): dependencies, axios, @capacitor/android, @capacitor/core, @capacitor/ios, @codetrix-studio/capacitor-google-auth, eas-cli, firebase (+19 more)

### Community 17 - "Request Creation Popups"
Cohesion: 0.24
Nodes (17): CreateRequestPopup(), Info(), LocationAutocomplete(), SearchBar(), Teach(), getOptimizedUrl(), ProfileRequestCard, Request() (+9 more)

### Community 18 - "Availability & Calendar Sync"
Cohesion: 0.14
Nodes (21): addLessonToAvailability(), addLessonToLessonCalender(), createAvailability(), getAvailability(), parseBool(), removeLessonFromLessonCalender(), teacherAvailability(), updateAvailability() (+13 more)

### Community 19 - "Lesson Calendar Slot Management"
Cohesion: 0.20
Nodes (23): removeLessonFromAvailability(), addLessonToLessonCalender(), createLessonCalender(), parseArrayMaybe(), removeLessonFromLessonCalender(), updateLessonCalender(), updateLessonInLessonCalender(), updateLesson() (+15 more)

### Community 20 - "Frontend Linter Config"
Cohesion: 0.08
Nodes (23): axios, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, lucide-react, react (+15 more)

### Community 21 - "Backend Auth Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, axios, bcryptjs, cloudinary, compression, cookie-parser, cors, crypto (+16 more)

### Community 22 - "Profile Skeletons & Fallbacks"
Cohesion: 0.21
Nodes (16): BookingCardSkeleton(), BookingGridSkeleton(), Curriculum(), Booked(), PublicUpcoming(), UnShaduled(), Upcoming(), publicUpcomingBookings (+8 more)

### Community 23 - "Build Debug Utilities"
Cohesion: 0.09
Nodes (19): content, filePath, fs, lines, path, content, filePath, fs (+11 more)

### Community 24 - "Chat UI Skeleton Loaders"
Cohesion: 0.16
Nodes (18): ChatConversationSkeleton(), ChatSkeleton(), Chat(), extractLessonData(), formatTime(), getRoomPeer(), normalizeId(), Sidebar() (+10 more)

### Community 25 - "Image Processing & Cloudinary"
Cohesion: 0.14
Nodes (16): ref_fs, sharp, createLesson(), deleteLesson(), geocodeCache, getAllLessons(), getAllLessonsById(), getCachedGeocode() (+8 more)

### Community 26 - "Lesson Proposals Controller"
Cohesion: 0.15
Nodes (12): ref_node_fetch, createPropose(), deletePropose(), getAllProposes(), getProposeById(), getProposeByUser(), updatePropose(), updateProposeStatus() (+4 more)

### Community 27 - "Main Layout & Footer"
Cohesion: 0.19
Nodes (12): Footer(), MainLayout(), MobileMenu(), MailVerify(), VerifyEmail(), Cookiepolicy(), Legalnotice(), Privacypolicy() (+4 more)

### Community 28 - "Capacitor Bridge Types"
Cohesion: 0.13
Nodes (13): Any, Bool, Capacitor, AppDelegate, NSUserActivity, UIApplication, UIApplicationDelegate, UIKit (+5 more)

### Community 29 - "Mobile Schedule Table States"
Cohesion: 0.24
Nodes (15): MobileScheduleSkeleton(), TableEmptyState(), TableSkeletonRows(), ReviewModal(), ScheduleMobileView(), TeacherHeader(), StudentDashboard(), LessonsDashboard() (+7 more)

### Community 30 - "User Controller & OAuth Profile"
Cohesion: 0.23
Nodes (18): becomeTeacher(), buildGoogleProfileImage(), changePassword(), forgotPassword(), getUserById(), getUserProfile(), googleLogin(), isOnlineTeacher() (+10 more)

### Community 31 - "Button Spinners & Branding"
Cohesion: 0.23
Nodes (12): courses_frontend_src_assets_logo_badge, ButtonSpinner(), LogoIcon(), CreateTeacherProfile(), STEPS, toDateInput(), Forget(), NewPassword() (+4 more)

### Community 32 - "Student Profile Bookings & Favorites"
Cohesion: 0.19
Nodes (17): Booked, BookMark, Calender, Canceled, Lessons, MyProfile, PayoutHistory, Profile() (+9 more)

### Community 33 - "Curriculum Management Controller"
Cohesion: 0.29
Nodes (16): Curriculum, createFullCurriculum(), deleteCurriculum(), deleteUnitAndLessons(), getAllCurriculumById(), getAllCurriculums(), getFormattedCurriculum(), getSingleCurriculum() (+8 more)

### Community 34 - "Admin Dashboard User Controller"
Cohesion: 0.24
Nodes (15): changeUserRole(), deleteUser(), ensureAdmin(), getAllCurriculums(), getAllData(), getAllLessons(), getAllUser(), getSettings() (+7 more)

### Community 35 - "Header & Navigation Bar"
Cohesion: 0.24
Nodes (12): Header(), TeacherCreated(), PrivateRoute(), becomeTeacher, clearClientSession(), getUser, initialState, LogoutUser (+4 more)

### Community 36 - "Dashboard App & Payment Table"
Cohesion: 0.30
Nodes (11): App(), PaymentTable(), PaymentApproved(), PaymentCancel(), PaymentRequest(), PrivateRoute(), addWithdrawal, approveWithdrawal (+3 more)

### Community 37 - "Auth Flow & Login Screen"
Cohesion: 0.14
Nodes (14): Login(), api, host, socketHost, becomeTeacher, forgetPassword, GoogleloginUser, initialState (+6 more)

### Community 38 - "Withdrawal & Payout Rate Limiting"
Cohesion: 0.20
Nodes (13): Withdrawal, express-rate-limit, approveWithdrawal(), createWithdrawal(), getAllWithdrawals(), getUserWithdrawals(), apiLimiter, authLimiter (+5 more)

### Community 39 - "Curriculums & Lessons Management"
Cohesion: 0.23
Nodes (12): Curriculums(), Lessons(), UserDetail(), getUserById, dashboardSlice, deleteCurriculum, deleteLesson, getAllCurriculums (+4 more)

### Community 40 - "Rating System & Multer Uploads"
Cohesion: 0.18
Nodes (11): multer, addCurriculumRating(), addLessonRating(), addTeacherRating(), checkReviewEligibility(), curriculumRating(), lessonRating(), storage (+3 more)

### Community 41 - "Student Stories & File Cleanup"
Cohesion: 0.28
Nodes (12): cleanupTempFile(), cleanupTempFiles(), createStudentStory(), deleteStudentStory(), ensureAdmin(), getActiveStudentStories(), getAllStudentStories(), updateStudentStory() (+4 more)

### Community 42 - "Search Autocomplete & Overlays"
Cohesion: 0.22
Nodes (11): formatDuration(), getLessonPath(), getLocationLabel(), HeaderSearchOverlay(), normalizeLessons(), ResultRow(), CurrencyContext, CurrencyProvider() (+3 more)

### Community 43 - "Curriculum Editing Wizard"
Cohesion: 0.27
Nodes (12): EditCurriculum(), EditStep1Details(), EditStep2Type(), EditStep3DirectLessons(), EditStep3Units(), LessonCard(), curriculumSlice, deleteCurriculum (+4 more)

### Community 44 - "Reviews & JWT Security"
Cohesion: 0.21
Nodes (10): cloudinary, jsonwebtoken, createReview(), getAllReviews(), getApprovedReviews(), updateReviewStatus(), adminOnly(), protect() (+2 more)

### Community 45 - "Admin Category Management UI"
Cohesion: 0.28
Nodes (10): CategoryModal(), Categories(), categorySlice, dashboard_src_store_reducer_categoryreducer_clearerror, dashboard_src_store_reducer_categoryreducer_clearsuccessmessage, createCategory, deleteCategory, getCategories (+2 more)

### Community 46 - "Android Testing Infrastructure"
Cohesion: 0.24
Nodes (8): androidx.test.ext.junit.runners.AndroidJUnit4, assert, context, ExampleInstrumentedTest, ExampleUnitTest, instrumentationregistry, org.junit.runner.RunWith, org.junit.Test

### Community 47 - "Student Story Modals & UI"
Cohesion: 0.32
Nodes (9): StudentStoryModal(), StudentStories(), dashboard_src_store_reducer_studentstoryreducer_clearerror, dashboard_src_store_reducer_studentstoryreducer_clearsuccessmessage, createStudentStory, deleteStudentStory, getStudentStories, studentStorySlice (+1 more)

### Community 48 - "Mobile CLI Dev Tools"
Cohesion: 0.18
Nodes (11): devDependencies, @capacitor/cli, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/react (+3 more)

### Community 49 - "Dashboard UI Dependencies"
Cohesion: 0.18
Nodes (11): dependencies, axios, lucide-react, react, react-dom, react-redux, react-router-dom, react-toastify (+3 more)

### Community 50 - "Admin Listings Dashboard"
Cohesion: 0.31
Nodes (7): dashboard_src_index, Listings(), deleteListing, fetchListings, ListingsSlice, updateListing, store

### Community 51 - "Category Taxonomy Controller"
Cohesion: 0.31
Nodes (7): createCategory(), deleteCategory(), getCategories(), updateCategory(), categorySchema, router, slugify()

### Community 52 - "Footer & Lesson Catalogs"
Cohesion: 0.29
Nodes (3): Spinner(), react-icons, ref_react_router_dom

### Community 53 - "ESLint Tooling Rules"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/react, @types/react-dom (+2 more)

### Community 54 - "Role & User Modification Modals"
Cohesion: 0.38
Nodes (7): ChangeRoleModal(), EditUserModal(), Users(), directLogin, changeUserRole, deleteUser, updateUser

### Community 55 - "Expo Mobile App Config"
Cohesion: 0.22
Nodes (8): projectId, expo, extra, ios, name, slug, eas, bundleIdentifier

### Community 56 - "Lesson Analysis Scripts"
Cohesion: 0.25
Nodes (5): bcryptjs, crypto, ref_node_dns, connectDB(), userSchema

### Community 57 - "Dashboard Header & Layout"
Cohesion: 0.54
Nodes (5): Header(), Layout(), Sidebar(), getUser, LogoutUser

### Community 58 - "Frontend Code Style Config"
Cohesion: 0.48
Nodes (5): ref_eslint, ref_eslint_js, ref_eslint_plugin_react_hooks, ref_eslint_plugin_react_refresh, ref_globals

### Community 60 - "Updated Availability Scheduling"
Cohesion: 0.38
Nodes (6): DAY_NAMES, DAYS, MakeAvailability(), MONTHS, TimeDropdown(), TimeSelect()

### Community 61 - "Stripe Custom Payout Onboarding"
Cohesion: 0.43
Nodes (5): CustomPayoutOnboarding(), stripePromise, formatMinor(), Withdrawal(), @stripe/stripe-js

### Community 62 - "Dashboard Metric Stats Cards"
Cohesion: 0.52
Nodes (5): StatsCard(), Dashboard(), getAllData, getAllUsers, updateSettings

### Community 63 - "Frontend Package Build Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, eas-build-post-install, lint, preview

### Community 64 - "Vite Bundle Splitting Config"
Cohesion: 0.47
Nodes (3): ref_tailwindcss_vite, ref_vite, ref_vitejs_plugin_react

### Community 65 - "Dashboard Build Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 66 - "Gradle Wrapper Scripts"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

## Knowledge Gaps
- **317 isolated node(s):** `name`, `slug`, `bundleIdentifier`, `projectId`, `UIKit` (+312 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 390 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Curriculum` connect `Curriculum Management Controller` to `Student Profile Bookings & Favorites`, `Admin Dashboard User Controller`, `Mobile Navigation & Teacher Card`, `Rating System & Multer Uploads`, `Booking & Currency Service`, `Image Processing & Cloudinary`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `react-icons` connect `Footer & Lesson Catalogs` to `Student Profile Bookings & Favorites`, `Currency Selector & Profile UI`, `Mobile Navigation & Teacher Card`, `Loading States & Skeletons`, `Image Uploader & Availability`, `Custom Date Picker Component`, `Frontend Build Dependencies`, `Legacy Availability Calendar`, `Multi-Currency Calendar View`, `Curriculum Editing Wizard`, `Request Creation Popups`, `Stripe Custom Payout Onboarding`, `Profile Skeletons & Fallbacks`, `Chat UI Skeleton Loaders`, `Mobile Schedule Table States`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Capacitor Mobile Config` to `Frontend Build Dependencies`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `bundleIdentifier` to the rest of the system?**
  _317 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Server Entry & Mailer` be split into smaller, more focused modules?**
  _Cohesion score 0.055905220288781934 - nodes in this community are weakly interconnected._
- **Should `Currency Selector & Profile UI` be split into smaller, more focused modules?**
  _Cohesion score 0.10465116279069768 - nodes in this community are weakly interconnected._
- **Should `Checkout & Payment Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.10384068278805121 - nodes in this community are weakly interconnected._