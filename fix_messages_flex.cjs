const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/controllers/bookingController.js');

// Read file as buffer to preserve exact encoding
let content = fs.readFileSync(filePath, 'utf-8');

// Use a regex pattern that's more flexible
const pattern = /\/\/ 💌 Initial welcome messages\s+await Message\.create\(\[\s+\{\s+roomId: chatRoom\._id,\s+userId: teacher\._id,\s+message: `[^`]*`,\s+\},\s+\]\);/s;

const newCode = `// 💌 Initial welcome messages
      // Check if welcome message already exists to avoid duplicates
      const existingWelcomeMsg = await Message.findOne({
        roomId: chatRoom._id,
        userId: teacher._id,
      }).sort({ createdAt: -1 });

      if (!existingWelcomeMsg) {
        await Message.create({
          roomId: chatRoom._id,
          userId: teacher._id,
          message: \`🎉 Hi \${
            student.name || booking.firstname
          }, thank you for booking a lesson with me!
I'm really looking forward to working with you.
If you'd like, feel free to share your experience level, goals, or anything specific you'd like to focus on, so I can tailor the session to you.\`,
        });
      }`;

// Replace using regex
const updated = content.replace(pattern, newCode);

if (updated !== content) {
  fs.writeFileSync(filePath, updated, 'utf-8');
  console.log('File updated successfully!');
} else {
  console.log('Pattern not matched. Trying alternative approach...');
  
  // Alternative: Find by line and replace
  const lines = content.split('\n');
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// 💌 Initial welcome messages')) {
      console.log(`Found at line ${i + 1}`);
      // Find the end of the create call (the ]);)
      let j = i + 1;
      while (j < lines.length && !lines[j].includes(']);')) {
        j++;
      }
      if (j < lines.length) {
        console.log(`Message.create ends at line ${j + 1}`);
        // Replace lines i to j (inclusive)
        const replacement = newCode.split('\n');
        lines.splice(i, j - i + 1, ...replacement);
        fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
        console.log('File updated using line-based replacement!');
        found = true;
      }
    }
  }
  if (!found) {
    console.log('Could not find the code to replace');
  }
}
