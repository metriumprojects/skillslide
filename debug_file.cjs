const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Find the line with "Initial welcome messages"
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Initial welcome messages')) {
    console.log(`Found at line ${i + 1}: ${lines[i]}`);
    console.log(`Next line: ${lines[i + 1]}`);
    console.log(`Line after: ${lines[i + 2]}`);
  }
}
