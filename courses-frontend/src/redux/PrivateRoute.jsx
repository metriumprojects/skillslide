import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import { getUser } from "./reducers/AuthReducer";
import Spinner from "../components/Spinner";

const PrivateRoute = () => {
  const dispatch = useDispatch();
  const { userInfo, loading } = useSelector((state) => state.auth);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!userInfo && token) {
      dispatch(getUser());
    }
  }, [dispatch, userInfo, token]);

  // If no token exists at all, redirect to login
  if (!token) {
    return <Spinner path="login" />;
  }

  // If token exists and we are verifying user, show smooth loader instead of black screen
  if (!userInfo && loading) {
    return <Spinner path="login" />;
  }

  // If user profile is loaded, render protected route
  if (userInfo) {
    return <Outlet />;
  }

  // If verification failed and user remains null, redirect to login
  return <Spinner path="login" />;
};


export default PrivateRoute;
