const fs = require('fs');
const path = require('path');
const filesChanged = [];

// Function to recursively walk through a directory and perform the replacements
function replaceInFiles(dir, replacements) {
  // console.log(dir);
  if (path.basename(dir).startsWith('.')) { return; }
  // Get a list of all files and directories in the current directory
  const files = fs.readdirSync(dir);
  // Loop through each file/directory and process it accordingly
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const fileStat = fs.statSync(filePath);
    if (fileStat.isDirectory()) {
      // Recursively process any subdirectories
      replaceInFiles(filePath, replacements);
    } else if (fileStat.isFile()) { 
      // Read the file contents and perform replacements as needed
      let contents = fs.readFileSync(filePath, 'utf8');
      replacements.forEach((replacement) => {
        const updatedContents = contents.replace(new RegExp(replacement.find, 'g'), replacement.replace);
        if (updatedContents !== contents) {
          filesChanged.push(filePath);
          contents = updatedContents;
        }
      });
      // Write the updated contents back to the file
      fs.writeFileSync(filePath, contents);
      
    }
  });
}

module.exports = function(directories, replacements) {
  // Loop through each directory and perform the replacements
  directories.forEach((directory) => {
    replaceInFiles(directory, replacements);
  });
  return filesChanged;
};
