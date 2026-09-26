import React from "react";

const Spinner = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAF9F6] p-4 text-center">
      <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm font-medium text-gray-700">Loading...</p>
    </div>
  );
};

export default Spinner;
