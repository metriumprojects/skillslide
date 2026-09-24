import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AfterPaymentCurri from "../Payment/AfterPaymentCuri";

export default function ManageLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bookId = localStorage.getItem("bookId") || id;

  useEffect(() => {
    if (bookId) {
      navigate(`/after-payment-curri/${bookId}?manage=true`, { replace: true });
    }
  }, [bookId, navigate]);

  return <AfterPaymentCurri bookIdOverride={bookId} />;
}
