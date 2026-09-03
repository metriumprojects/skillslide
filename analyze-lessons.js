import('./src/config/db.js').then(() => {
  import('./src/models/Lesson.js').then(m => {
    const Lesson = m.default;
    
    Promise.all([
      Lesson.countDocuments({}),
      Lesson.countDocuments({ isIndependent: true }),
      Lesson.countDocuments({ isOnline: false }),
      Lesson.countDocuments({ $and: [{ lat: { $exists: true, $ne: null } }, { lng: { $exists: true, $ne: null } }] }),
      Lesson.find({}).select('title isIndependent isOnline lat lng location address').limit(3).lean()
    ]).then(([total, independent, notOnline, withCoords, samples]) => {
      console.log('=== LESSON COLLECTION STATISTICS ===');
      console.log('Total Lessons:', total);
      console.log('Lessons with isIndependent=true:', independent);
      console.log('Lessons with isOnline=false:', notOnline);
      console.log('Lessons with valid lat/lng:', withCoords);
      console.log('');
      console.log('=== SAMPLE LESSONS (First 3) ===');
      samples.forEach((lesson, idx) => {
        console.log(`Lesson ${idx + 1}:`);
        console.log('  Title:', lesson.title);
        console.log('  isIndependent:', lesson.isIndependent);
        console.log('  isOnline:', lesson.isOnline);
        console.log('  Latitude:', lesson.lat);
        console.log('  Longitude:', lesson.lng);
        console.log('  Location:', lesson.location);
        console.log('  Address:', lesson.address);
      });
      if (samples.length === 0) {
        console.log('No lessons found in collection');
      }
      process.exit(0);
    }).catch(e => { console.error('Query error:', e.message); process.exit(1); });
  }).catch(e => { console.error('Model import error:', e.message); process.exit(1); });
}).catch(e => { console.error('DB connection error:', e.message); process.exit(1); });