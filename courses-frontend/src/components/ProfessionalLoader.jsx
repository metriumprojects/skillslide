import React from "react";

export default function ProfessionalLoader({ message = "Loading..." }) {
  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 max-w-md">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-black border-r-black animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-gray-600">{message}</p>
      </div>
    </div>
  );
}
