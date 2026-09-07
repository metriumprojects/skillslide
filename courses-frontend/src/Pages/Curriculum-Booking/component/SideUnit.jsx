import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

export default function Curriculum({ Data, onExpand }) {
  const [openUnits, setOpenUnits] = useState([0]); // Only Unit 1 (index 0) is open by default

  const organizeUnitsData = (curriculumData) => {
    if (!curriculumData?.lessonPosition) return [];

    // Group lessons by unit
    const unitsMap = {};
    
    curriculumData.lessonPosition.forEach((lessonPos) => {
      const unitId = lessonPos.unitName || `unit-${lessonPos.unitPosition}`;
      
      if (!unitsMap[unitId]) {
        unitsMap[unitId] = {
          id: unitId,
          title: `${unitId}`,
          description: "Unit description", // You can map actual description if available
          lessons: []
        };
      }
      
      // Add lesson to the unit
      if (lessonPos.lId) {
        unitsMap[unitId].lessons.push({
          id: lessonPos.lId._id,
          position: lessonPos.position,
          title: lessonPos.lId.title,
          label: lessonPos.lId.isIndependent ? "Also available as standalone" : "Part of a curriculum",
          independent: lessonPos.lId.isIndependent,
          image: lessonPos.lId.coverImage?.url || "https://i.ibb.co/tpV3m2GW/no-image.png",
          instructor: lessonPos.lId.createdBy?.name || "Unknown",
          instructorImg: lessonPos.lId.createdBy?.image?.url || "https://i.ibb.co/tpV3m2GW/no-image.png",
          rating: "9/10", // Keeping static as per your design
          reviews: "(32)", // Keeping static as per your design
          description: lessonPos.lId.description,
          duration: lessonPos.lId.duration,
          price: lessonPos.lId.price,
        });
      }
    });

    // Sort lessons by position within each unit and convert to array
    const organizedUnits = Object.values(unitsMap).map(unit => ({
      ...unit,
      lessons: unit.lessons.sort((a, b) => a.position - b.position)
    }));

    return organizedUnits;
  };

  const units = organizeUnitsData(Data);

  return (
    <div className="w-full space-y-4">
      {units?.map((u, index) => (
        <div key={index} className="space-y-3">
          {/* Unit Header Bubble */}
          {u.title && (
            <button
              onClick={() => {
                if (openUnits.includes(index)) {
                  setOpenUnits(openUnits.filter(i => i !== index));
                } else {
                  setOpenUnits([...openUnits, index]);
                }
              }}
              className="w-full bg-[#E9EAEE] rounded-[18px] sm:rounded-[20px] px-4 sm:px-5 py-3 flex justify-between items-center text-left font-normal text-black shadow-none hover:bg-[#dfe1e6] transition-colors cursor-pointer"
            >
              <span className="text-sm sm:text-[15px] font-normal">
                Unit {index + 1} {u.title && !u.title.startsWith("unit-") ? <span className="text-black">: {u.title}</span> : ""}
              </span>
              <div className="flex items-center gap-2">
                <ChevronDown
                  className={`transition-transform duration-200 text-gray-700 ${
                    openUnits.includes(index) ? "rotate-180" : ""
                  }`}
                  size={18}
                />
              </div>
            </button>
          )}

          {/* Lessons: Each as an individual #E9EAEE bubble */}
          {openUnits.includes(index) && (
            <div className="space-y-3 pl-0">
              {u?.lessons?.map((lesson, i) => (
                <div
                  key={i}
                  className="w-full bg-[#E9EAEE] rounded-[24px] p-2 sm:p-2.5 flex items-center gap-3 sm:gap-3.5 shadow-none transition-all"
                >
                  <img
                    src={lesson.image}
                    className="w-20 h-20 sm:w-24 sm:h-24 aspect-square rounded-[18px] object-cover shrink-0"
                    alt={lesson?.title || "Lesson thumbnail"}
                  />

                  <div className="flex flex-col justify-between py-1 pr-1.5 flex-1 min-w-0">
                    <div>
                      <h3 className="text-black text-sm sm:text-[15px] font-semibold leading-snug break-words">
                        Lesson {i + 1}: {lesson?.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mt-1">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      {lesson.independent ? (
                        <Link 
                          to={`/curriculum-lesson/${lesson.id}`}
                          className="inline-flex w-fit bg-primary text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full hover:bg-primary/90 transition-colors"
                        >
                          {lesson.label}
                        </Link>
                      ) : (
                        <span className="inline-flex w-fit bg-primary text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                          {lesson.label}
                        </span>
                      )}
                      {lesson.duration && (
                        <span className="text-xs text-gray-500 font-normal">
                          · {lesson.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
