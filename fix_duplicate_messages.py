import re

# Read the file
with open(r'c:\Users\jiten\Desktop\jitendra\Courses-Website\src\controllers\bookingController.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find the old Message.create code
old_pattern = r'// 💌 Initial welcome messages\s+await Message\.create\(\[\s+\{\s+roomId: chatRoom\._id,\s+userId: teacher\._id,\s+message: `[^`]+`,\s+\},\s+\]\);'

new_code = '''// 💌 Initial welcome messages
      // Check if welcome message already exists to avoid duplicates
      const existingWelcomeMsg = await Message.findOne({
        roomId: chatRoom._id,
        userId: teacher._id,
      }).sort({ createdAt: -1 });

      if (!existingWelcomeMsg) {
        await Message.create({
          roomId: chatRoom._id,
          userId: teacher._id,
          message: `🎉 Hi ${
            student.name || booking.firstname
          }, thank you for booking a lesson with me!
I'm really looking forward to working with you.
If you'd like, feel free to share your experience level, goals, or anything specific you'd like to focus on, so I can tailor the session to you.`,
        });
      }'''

# Replace using regex
content = re.sub(old_pattern, new_code, content, flags=re.DOTALL)

# Write the file back
with open(r'c:\Users\jiten\Desktop\jitendra\Courses-Website\src\controllers\bookingController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated successfully!")
