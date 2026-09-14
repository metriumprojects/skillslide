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

  return null;
};

export default Spinner;
