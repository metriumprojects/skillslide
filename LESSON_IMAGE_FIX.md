# Lesson Image Upload Fix

## Problem
When uploading new lesson images, the cover image was being updated instead of (or in addition to) the lesson images. This was caused by the backend treating all uploaded files the same way, assuming the first file was always a cover image.

## Root Cause
**Backend (`lessonController.js`):**
- The backend was not distinguishing between files uploaded in different FormData fields
- All files from `req.files` array were being processed together
- First file was always treated as cover image, remaining files as lesson images
- This caused lesson images to overwrite the cover image or vice versa

## Solution

### Frontend (`UpdateLesson.jsx`)
✅ Already correct - sends files in separate fields:
```javascript
// Cover image in separate field
if (coverImage) {
  lessonFormData.append("coverImage", coverImage);
} else if (existingCoverUrl && lesson?.coverImage?.public_id) {
  lessonFormData.append("existingCoverImageId", lesson.coverImage.public_id);
}

// Lesson images in separate field
newImages.forEach((imgObj) => {
  lessonFormData.append("images", imgObj.file);
});
```

### Backend (`lessonController.js`) - FIXED
Now properly separates files by `fieldname`:

```javascript
// Step 1: Separate files by fieldname
let coverImageFile = null;
let lessonImageFiles = [];

if (req.files && req.files.length > 0) {
  req.files.forEach(file => {
    if (file.fieldname === 'coverImage') {
      coverImageFile = file;  // Only ONE cover image
    } else if (file.fieldname === 'images') {
      lessonImageFiles.push(file);  // Multiple lesson images
    }
  });
}

// Step 2: Handle cover image separately
if (coverImageFile) {
  // Delete old cover, upload new cover
  lesson.coverImage = { url: result.secure_url, public_id: result.public_id };
} else if (existingCoverImageId) {
  // Keep existing cover (no change)
}

// Step 3: Handle lesson images separately
if (lessonImageFiles.length > 0) {
  // Add new lesson images (don't touch cover)
  lesson.images = [...(lesson.images || []), ...uploadedImages];
}

// Step 4: Remove deleted lesson images (based on existingImages list)
if (existingImagesList.length > 0) {
  // Remove images not in existingImagesList
  // Keep only the ones user didn't delete
}
```

## Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| **File Handling** | All files in `req.files` treated same | Files separated by `fieldname` |
| **Cover Image** | First file assumed to be cover | Only processes `coverImage` field |
| **Lesson Images** | Remaining files became lesson images | Only processes `images` field |
| **File Mix-up** | ❌ Cover could be treated as lesson image | ✅ Never mixed up |
| **Update Behavior** | All files uploaded = cover changes | Only `coverImage` upload = cover changes |

## Testing Checklist

- [ ] Upload ONLY lesson images → Cover should NOT change
- [ ] Upload ONLY cover image → Lesson images should NOT change
- [ ] Upload both → Both should update correctly
- [ ] Delete lesson images → Cover should remain intact
- [ ] Edit lesson images order → Cover should stay the same
- [ ] Keep existing cover with `existingCoverImageId` → Cover preserved

## Files Modified

1. **`src/controllers/lessonController.js`** (lines 359-440)
   - Separated file handling by fieldname
   - Cover image now only updates when `coverImage` field has new file
   - Lesson images now only update when `images` field has new files
   - Both are processed independently

2. **`courses-frontend/src/Pages/Profile/Lesson/UpdateLesson.jsx`**
   - Already correct (no changes needed)
   - Properly sends `coverImage` and `images` in separate FormData fields
