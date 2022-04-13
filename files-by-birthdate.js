const fs = require('fs');
const lib = require('./index');

const path = '/home/paddy/hyraxbio/exatype-sars-cov-2-ui/app';

const files = lib.getFiles(path, true).map(file => {
  return {
    path: file,
    birthtime: fs.statSync(file).birthtime
  };
}).sort((a,b) => {
  return a.birthtime - b.birthtime;
});
console.log(files);
console.log(files.map(file => file.path).filter(file => file.indexOf('register') > -1));