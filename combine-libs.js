const fs = require('fs');
const path  = require('path');
const test = [
'/home/paddy/development/ember-development-sundries/lib.js',
'/home/paddy/development/hugo-sites-manager/_gulp/lib.js',
'/home/paddy/development/joomla-k2-to-md/lib.js',
'/home/paddy/development/pdf-csv-bank-statement-converter/lib.js',
'/home/paddy/development/personal-bank-statement-csv-generator/lib.js',
'/home/paddy/development/responsive-image-directory/lib.js',
'/home/paddy/development/wordpress-to-markdown/lib.js'];

let final = '';

const code = test.map(item => {
  return fs.readFileSync(item, 'utf8').replace('module.exports = ', '');
});

fs.writeFileSync('./test.js', code.join(',\n'))

// console.log(test);
return;
function getFiles(dir, files_) {
  files_ = files_ || [];
  let files;
  try {
    files = fs.readdirSync(dir);
    for (const i in files) {
      const name = path.join(dir, files[i]);
      if (fs.statSync(name).isDirectory() && name.indexOf('node_modules') < 0) {
        getFiles(name, files_);
      } else {
        files_.push(name);
      }
    }
    return files_;
  } catch (err) {
    console.log(err);
  } 
};

const libs = getFiles('/home/paddy/hyraxbio').filter(file => {
  return file.endsWith('lib.js');
})

console.log(libs)