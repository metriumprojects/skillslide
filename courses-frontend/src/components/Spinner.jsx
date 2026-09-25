import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const Spinner = ({ path = "login" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate(location.pathname, { replace: true });
    } else {
      navigate(`/${path}`, {
        state: location.pathname,
        replace: true,
      });
    }
  }, [navigate, location, path, userInfo]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAF9F6] p-4 text-center">
      <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm font-medium text-gray-700">Verifying session...</p>
      <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
    </div>
  );
};

export default Spinner;

