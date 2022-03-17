// COMPLETED
// /home/paddy/development/personal-bank-statement-csv-generator/lib.js
// /home/paddy/development/ember-development-sundries/lib.js
// /home/paddy/development/pdf-csv-bank-statement-converter/lib.js
// /home/paddy/development/joomla-k2-to-md/lib.js
var fs = require('fs');
var path = require('path');
var YAML = require('json2yaml');
var tomlify = require('tomlify-j0.4');

module.exports = {
  removeExt(filePath) {
    return path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
  },
  
  downcaseUnderscore(string) {
    return string.toLowerCase().replace(/ /g, '_');
  }, 

  createMDFile: function(object, fileOutPutPath, frontMatterFormat) {
    var frontMatter = object.frontMatter || {};
    var content = object.content || {};
    return new Promise((resolve, reject) => { 
      var frontMatterDelimiter;
      if (frontMatterFormat === 'toml') {
        frontMatterDelimiter = '+++';
      } else if (frontMatterFormat ==='yml' || frontMatterFormat ==='yaml') {
        frontMatterDelimiter = '---';
      }
      var final = '';
      if (frontMatterFormat === 'toml') {
        // Only for toml, because JSON doesn't have delimiters and with yml, the YAML dep adds the first delimiter for you.
        final += `${frontMatterDelimiter}\n`;
      }
      if (frontMatterFormat === 'toml') {
        final += tomlify.toToml(frontMatter, {space: 2});
      } else if (frontMatterFormat ==='yml' || frontMatterFormat ==='yaml') {
        final += YAML.stringify(frontMatter);
      } else {
        if (frontMatterFormat !=='json') {
          console.log(chalk.red(`${frontMatterFormat} is not a valid output format. Use 'toml', 'yml', 'yaml' ot 'json'. JSON has been used as the default.`));
        }
        final += JSON.stringify(frontMatter, null, 2);
      }
      if (frontMatterFormat === 'toml') {
        final += `\n${frontMatterDelimiter}\n\n`;
      } else if (frontMatterFormat ==='yml' || frontMatterFormat ==='yaml') {
        final += `${frontMatterDelimiter}\n\n`;
      } else {
        // When the frontMatter format is JSON, just add an empty line between the front matter and the content.
        final += '\n\n';
      }
      
      if (content.intro_text) {
        final += `${content.intro_text} \n`;
      }
      if (content.intro_text && content.full_text) {
        final += '<!--more-->\n';
      }
      if (content.full_text) {
        final += (content.full_text).replace(content.intro_text, '').trim();
      }
      var directoryOutPutPath = path.dirname(fileOutPutPath);
      this.mkdirP(directoryOutPutPath);
      var filepath = fileOutPutPath;
      fs.writeFile(filepath, final, function(err) {
        if(err) {
          reject(err);
        }
        resolve(`Succes! ${filepath} was saved!`);
      });
    });
  },
  getNamedArgVal(requested) {
    const [ , , ...args ] = process.argv;
    var val;
    args.forEach(arg => {
      if (arg.indexOf('=') < 0) { return; }
      var argName = arg.split('=')[0];
      if (argName === requested) {
        val = arg.split('=')[1];
      }
    });
    return val;
  },

  uniq(array) {
    return array.filter((v, i, a) => a.indexOf(v) === i);
  },

  getFiles(dir, files_) {
    files_ = files_ || [];
    let files;
    try {
      files = fs.readdirSync(dir);
      for (const i in files) {
        const name = path.join(dir, files[i]);
        if (fs.statSync(name).isDirectory()) {
          this.getFiles(name, files_);
        } else {
          files_.push(name);
        }
      }
      return files_;
    } catch (err) {
      console.log(err);
    } 
  }, 

  capitaliseFirstChar(string) {
    return `${string[0].toUpperCase()}${string.slice(1)}`;
  },

  camelize(str) {
    if (!str) { return; }
    return str.toLowerCase().replace(' ', '_').replace(/-|_+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  },

  logJSToFile(outPut, filePath) {
    if (!outPut) { return; }
    fs.writeFile(filePath, JSON.stringify(outPut, null, 2), function(err) {
      if(err) {
        console.log(err);
        return err;
      }
      return `Success! ${filePath} was saved`;
    });
  },

  kebabToPascalCase(string) {
    return string
      .toLowerCase()
      .split('-')
      .map(it => it.charAt(0).toUpperCase() + it.substr(1))
      .join('');
  },

  minifyText(text) {
    return text.replace(/\n\s*\n/g, '').replace(/\s+/g, '');
  },

  cleanEmptyFoldersRecursively(folder) {
    var fs = require('fs');
    var path = require('path');
  
    var isDir = fs.statSync(folder).isDirectory();
    if (!isDir) {
      return;
    }
    var files = fs.readdirSync(folder);
    if (files.length > 0) {
      files.forEach(file => {
        var fullPath = path.join(folder, file);
        this.cleanEmptyFoldersRecursively(fullPath);
      });
  
      // re-evaluate files; after deleting subfolder
      // we may have parent folder empty now
      files = fs.readdirSync(folder);
    }
  
    if (files.length == 0) {
      fs.rmdirSync(folder);
      return;
    }
  }
}