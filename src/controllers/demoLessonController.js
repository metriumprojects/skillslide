async function importLessonsFromExcel(excelData) {
  const lessons = excelData.map(row => ({
    title: row.title,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    duration: row.duration,
    isOnline: row.isOnline === 'true',
    location: row.location,
    
    // Cover image
    coverImage: {
      url: row.coverImageUrl,
      public_id: extractPublicId(row.coverImageUrl)
    },
    
    // Multiple images
    images: row.imagesUrls
      .split(';')
      .filter(url => url.trim())
      .map(url => ({
        url: url.trim(),
        public_id: extractPublicId(url.trim())
      }))
  }));
  
  return lessons;
}

function extractPublicId(url) {
  // Extract from: https://res.cloudinary.com/cloud/image/upload/v1234/folder/file_id.jpg
  const match = url.match(/\/([^\/]+)\.jpg$/);
  return match ? match[1] : 'unknown';
}


async function importLessonsFromJSON(jsonData, userId) {
  try {
    const lessons = jsonData.lessons.map(lesson => ({
      ...lesson,
      createdBy: userId,
      price: Number(lesson.price),
      usecapacity: Number(lesson.usecapacity) || 0,
      discount: Number(lesson.discount) || 0,
      isOnline: Boolean(lesson.isOnline),
      isIndependent: Boolean(lesson.isIndependent),
      isGroupAvailable: Boolean(lesson.isGroupAvailable),
      calender: Boolean(lesson.calender)
    }));
    
    return await Lesson.insertMany(lessons);
  } catch (error) {
    console.error("Import error:", error);
    throw error;
  }
}