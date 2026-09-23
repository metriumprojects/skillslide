import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

export default function SearchCategoryToolbar({
  categories = [],
  selectedCategory = "",
  onSelectCategory,
}) {
  return (
    <section className="mb-6 mt-4 min-w-0 w-full">
      <div className="relative min-w-0 w-full overflow-hidden">
        <Swiper
          className="category-free-slider !overflow-visible pb-2 select-none"
          modules={[FreeMode, Mousewheel]}
          spaceBetween={12}
          slidesPerView="auto"
        >
          <SwiperSlide className="!w-auto">
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelectCategory?.("")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelectCategory?.("");
              }}
              className={`flex h-9 cursor-grab select-none items-center rounded-full border-[1.5px] px-6 text-sm font-medium transition-colors active:cursor-grabbing ${
                !selectedCategory ? "border-primary bg-primary text-white" : "border-black bg-white text-black"
              }`}
            >
              Trending
            </div>
          </SwiperSlide>
          {categories.map((category) => (
            <SwiperSlide className="!w-auto" key={category._id || category.name}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectCategory?.(category.name)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") onSelectCategory?.(category.name);
                }}
                className={`flex h-9 cursor-grab select-none items-center rounded-full border-[1.5px] px-5 text-sm font-medium transition-colors active:cursor-grabbing ${
                  selectedCategory === category.name
                    ? "border-primary bg-primary text-white"
                    : "border-black bg-white text-black"
                }`}
              >
                {category.name}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent" />
      </div>
    </section>
  );
}
