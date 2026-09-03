const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/controllers/bookingController.js');

// Read file
let content = fs.readFileSync(filePath, 'utf-8');

// Find and replace the old Message.create with the new one
const oldCode = `      // 💌 Initial welcome messages
      await Message.create([
        {
          roomId: chatRoom._id,
          userId: teacher._id,
          message: \`🎉 Hi \${
            student.name || booking.firstname
          }, thank you for booking a lesson with me!
I'm really looking forward to working with you.
If you'd like, feel free to share your experience level, goals, or anything specific you'd like to focus on, so I can tailor the session to you.\`,
        },
      
      ]);`;

const newCode = `      // 💌 Initial welcome messages
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

// Replace
if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('File updated successfully!');
} else {
  console.log('Old code pattern not found. File was not updated.');
}
