import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUser } from "./reducers/AuthReducer";

const PrivateRoute = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { userInfo, loading } = useSelector((state) => state.auth);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [timedOut, setTimedOut] = useState(false);

  // If token exists but userInfo is not loaded yet, fetch user
  useEffect(() => {
    if (token && !userInfo) {
      dispatch(getUser());
    }
  }, [dispatch, token, userInfo]);

  // Safety fallback: Never stay waiting for user fetch more than 3.5 seconds
  useEffect(() => {
    if (token && !userInfo && loading) {
      const timer = setTimeout(() => setTimedOut(true), 3500);
      return () => clearTimeout(timer);
    }
  }, [token, userInfo, loading]);

  // 1. If no token exists at all (logged out), or session verification timed out:
  // Immediately redirect to /login with state
  if (!token || timedOut) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If token exists and user is loaded: render protected route immediately
  if (userInfo) {
    return <Outlet />;
  }

  // 3. If token exists and we are verifying user: show minimal, non-blocking spinner
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAF9F6] p-4 text-center">
      <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm font-medium text-gray-700">Loading your profile...</p>
    </div>
  );
};

export default PrivateRoute;
