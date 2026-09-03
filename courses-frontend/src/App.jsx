import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer, cssTransition } from "react-toastify";
import PrivateRoute from "./redux/PrivateRoute";

const NoToastAnimation = cssTransition({
  enter: "toast-no-animation",
  exit: "toast-no-animation",
  collapse: false,
});

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Lazy load all components
const Home = lazy(() => import("./Pages/Home/Home"));
const Login = lazy(() => import("./Pages/Auth/Login"));
const Register = lazy(() => import("./Pages/Auth/Register"));
const CurriculumBooking = lazy(() => import("./Pages/Curriculum-Booking/CurriculumBooking"));
const LessonBooking = lazy(() => import("./Pages/Curriculum-Booking/LessonBooking"));
const CurriculumLesson = lazy(() => import("./Pages/Curriculum-Booking/CurriculumLesson"));
const Profile = lazy(() => import("./Pages/Profile/Profile"));
const Forget = lazy(() => import("./Pages/Auth/Forget"));
const NewPassword = lazy(() => import("./Pages/Auth/NewPassword"));
const PublicProfile = lazy(() => import("./Pages/Profile/PublicProfile"));
const EditProfile = lazy(() => import("./Pages/Profile/EditProfile"));
const CreateTeacherProfile = lazy(() => import("./Pages/Auth/CreateTeacherProfile"));
const TeacherCreated = lazy(() => import("./Pages/Auth/TeacherCreated"));
const LessonPayment = lazy(() => import("./Pages/Curriculum-Booking/LessonPayment"));
const CreateLesson = lazy(() => import("./Pages/Profile/Lesson/CreateLesson"));
const CreateCurriculum = lazy(() => import("./Pages/Profile/Curriculum/CreateCurriculum"));
const UpdateLesson = lazy(() => import("./Pages/Profile/Lesson/UpdateLesson"));
const SendMessage = lazy(() => import("./Pages/Auth/SendMessage"));
const Chat = lazy(() => import("./Pages/Chat/Chat"));
const Teach = lazy(() => import("./Pages/Home/Teach"));
const EditCurriculum = lazy(() => import("./Pages/Profile/Curriculum/EditCurriculum"));
const AfterPayment = lazy(() => import("./Pages/Payment/AfterPayment"));
const CurriPayment = lazy(() => import("./Pages/Curriculum-Booking/CurriPayment"));
const ManageLesson = lazy(() => import("./Pages/Curriculum-Booking/ManageLesson"));
const Withdrawal = lazy(() => import("./Pages/withdraw/Withdrawal"));
const VerifyEmail = lazy(() => import("./Pages/Auth/VerifyEmail"));
const MailVerify = lazy(() => import("./Pages/Auth/MailVerify"));
const AfterPaymentCurri = lazy(() => import("./Pages/Payment/AfterPaymentCuri"));
const PaymentCancel = lazy(() => import("./Pages/Payment/PaymentCancel"));
const Privacypolicy = lazy(() => import("./Pages/Footer/Privacypolicy"));
const Termsofservice = lazy(() => import("./Pages/Footer/Termsofservice"));
const Cookiepolicy = lazy(() => import("./Pages/Footer/Cookiepolicy"));
const Legalnotice = lazy(() => import("./Pages/Footer/Legalnotice"));

const App = () => {
  return (
    <>
      <Router>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teach" element={<Teach />} />
            <Route path="/curriculum-booking/:id" element={<CurriculumBooking />} />
            <Route path="/lesson-booking/:id" element={<LessonBooking />} />
            <Route path="/curriculum-lesson/:id" element={<CurriculumLesson />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/mail-verify/:token" element={<MailVerify />} />
            <Route path="/forget" element={<Forget />} />
            <Route path="/send-message" element={<SendMessage />} />
            <Route path="/new-password/:token" element={<NewPassword />} />

            {/* Footer pages - Public, no login required */}
            <Route path="/privacy-policy" element={<Privacypolicy />} />
            <Route path="/terms-of-service" element={<Termsofservice />} />
            <Route path="/cookie-policy" element={<Cookiepolicy />} />
            <Route path="/legal-notice" element={<Legalnotice />} />
              <Route path="/user-profile/:id" element={<PublicProfile />} />

            <Route path="/" element={<PrivateRoute />}>
              {/* profile */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/create-teacher-profile" element={<CreateTeacherProfile />} />
              <Route path="/teacher-created" element={<TeacherCreated />} />
              <Route path="/update-lesson/:id" element={<UpdateLesson />} />

              {/* lesson */}
              <Route path="/create-lesson" element={<CreateLesson />} />
              <Route path="/lesson-payment/:id" element={<LessonPayment />} />
              <Route path="/curriculum-payment/:id" element={<CurriPayment />} />

              {/* Curriculums */}
              <Route path="/create-curriculum" element={<CreateCurriculum />} />
              <Route path="/edit-curriculum/:id" element={<EditCurriculum />} />
              <Route path="/manage-lesson/:id" element={<ManageLesson />} />

              {/* chat */}
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:id" element={<Chat />} />

              {/* Payment */}
              <Route path="/after-payment" element={<AfterPayment />} />
              <Route path="/after-payment-curri/:bookId" element={<AfterPaymentCurri />} />
              <Route path="/payment-cancel/:bookId" element={<PaymentCancel />} />
              <Route path="/withdraw-request" element={<Withdrawal />} />
              
            </Route>
          </Routes>
        </Suspense>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
        transition={NoToastAnimation}
      />
    </>
  );
};

export default App;
