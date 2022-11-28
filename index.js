
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

module.exports = {
  alphabetiseObjectKeys(object) {
    const sortedObject = {};
    Object.keys(object)
      .sort()
      .forEach(function(key) {
        sortedObject[key] = object[key];
      });
    return sortedObject;
  }, 

  alphabetiseJsonApiAttrs(data) {
    const object = typeof data === 'string' ? JSON.parse(data) : data;
    object.data.attributes = this.alphabetiseObjectKeys(object.data.attributes);
    if (object.included) {
      object.included = (object.included || []).map(include => {
        include.attributes = this.alphabetiseObjectKeys(include.attributes);
        return include;
      });
    }
    return typeof data === 'string' ? JSON.stringify(object, null, 2) : data;
  },

  basenameNoExt(filePath) {
    return path.basename(filePath, path.extname(filePath));
  },

  camelize(str) {
    if (!str) {
      return;
    }
    return str.toLowerCase().replace(' ', '_').replace(/-|_+(.)?/g, function (match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  },
  capitaliseFirstChar(string) {
    return `${string[0].toUpperCase()}${string.slice(1)}`;
  },
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
  cleanEmptyFoldersRecursively(folder) {
    const isDir = fs.statSync(folder).isDirectory();

    if (!isDir) {
      return;
    }

    let files = fs.readdirSync(folder);

    if (files.length > 0) {
      files.forEach(file => {
        const fullPath = path.join(folder, file);
        this.cleanEmptyFoldersRecursively(fullPath);
      }); // re-evaluate files; after deleting subfolder
      // we may have parent folder empty now

      files = fs.readdirSync(folder);
    }

    if (files.length === 0) {
      fs.rmdirSync(folder);
    }
  },

  combinePaths(array) {
    return array.filter(item => {
      return item;
    }).map(item => {
      item = this.removeLeadingSlash(item);
      item = this.removeTrailingSlash(item);
      return item;
    }).join('/');
  },
  conditionalSlash(string, position) {
    return (position === 'end' && string.endsWith('/')) || (position === 'start' && string.startsWith('/')) ? '' : '/';
  },

  copyDirectory(source, dest, options = {}) {
    const rootSource = source ? path.resolve(process.cwd(), source) : process.cwd();
    const rootDest = dest ? path.resolve(process.cwd(), dest) : process.cwd();
    try {
      const copydir = require('copy-dir');
      copydir.sync(rootSource, rootDest, options);
      return {
        from: rootSource,
        to: rootDest
      };
    } catch (err) {
      console.log(err);
    }
  },

  createMDFile(object, fileOutPutPath, frontMatterFormat) {
    const frontMatter = object.frontMatter || {};
    const content = object.content || {};
    return new Promise((resolve, reject) => {
      let frontMatterDelimiter;

      if (frontMatterFormat === 'toml') {
        frontMatterDelimiter = '+++';
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
        frontMatterDelimiter = '---';
      }

      let final = '';

      if (frontMatterFormat === 'toml') {
        // Only for toml, because JSON doesn't have delimiters and with yml, the YAML dep adds the first delimiter for you.
        final += `${frontMatterDelimiter}\n`;
      }

      if (frontMatterFormat === 'toml') {
        try {
          const tomlify = require('tomlify-j0.4');
          final += tomlify.toToml(frontMatter, {
            space: 2
          });
        } catch (err) {
          console.log(err);
        }
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
        try {
          const YAML = require('json2yaml');
          final += YAML.stringify(frontMatter);
        } catch (err) {
          console.log(err);
        }
        
      } else {
        if (frontMatterFormat !== 'json') {
          console.log(chalk.red(`${frontMatterFormat} is not a valid output format. Use 'toml', 'yml', 'yaml' ot 'json'. JSON has been used as the default.`));
        }

        final += JSON.stringify(frontMatter, null, 2);
      }

      if (frontMatterFormat === 'toml') {
        final += `\n${frontMatterDelimiter}\n\n`;
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
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
        final += content.full_text.replace(content.intro_text, '').trim();
      }

      const directoryOutPutPath = path.dirname(fileOutPutPath);
      this.mkdirP(directoryOutPutPath);
      const filepath = fileOutPutPath;
      fs.writeFile(filepath, final, function (err) {
        if (err) {
          reject(err);
        }

        resolve(`Succes! ${filepath} was saved!`);
      });
    });
  },

  createSha256(string) {
    try {
      const CryptoJS = require('crypto-js');
      const hash = CryptoJS.SHA256(string);
      return hash.toString(CryptoJS.enc.Hex);
    } catch (err) {
      console.log(err);
    }
  },

  deleteFolderRecursively(directoryPath) {
    if (fs.existsSync(directoryPath)) {
      fs.readdirSync(directoryPath).forEach((file, index) => {
        const curPath = path.join(directoryPath, file);

        if (fs.lstatSync(curPath).isDirectory()) {
          // recurse
          this.deleteFolderRecursively(curPath);
        } else {
          // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(directoryPath);
    }
  },
  downcaseUnderscore(string) {
    return string.toLowerCase().replace(/ /g, '_');
  },
  escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  },

  fileIsNewer(opts) {
    if (!fs.existsSync(opts.destPath)) {
      return true;
    }

    if (!fs.existsSync(opts.srcPath)) {
      return;
    }

    const srcMtime = opts.srcMtime || fs.statSync(opts.srcPath).mtime;
    return srcMtime > fs.statSync(opts.destPath).mtime;
  },

  filesByBirthDate(path, direction) {
    return this.getFiles(path, true).map(file => {
      return {
        path: file,
        birthtime: fs.statSync(file).birthtime,
        statSync: fs.statSync(file)
      };
    }).sort((a,b) => {
      if (direction === 'desc') {
        return b.birthtime - a.birthtime;
      } else {
        return a.birthtime - b.birthtime;

      }
    });
  },
  

  flattenDirectory(dir, opts = {}) {
    if (opts.copyDir) {
      const copyResult = this.copyDirectory(dir, opts.copyDir.outputPath, opts.copyDir.copySyncOpts);
      dir = copyResult.to;
    }

    const rootdir = dir ? path.resolve(process.cwd(), dir) : process.cwd();
    this.getFiles(rootdir).forEach(orig => {
      const rootDirParts = rootdir.split(path.sep);
      const baseDir = orig.split(path.sep).slice(0, rootDirParts.length + (opts.depth || 0)).join(path.sep);
      const destFileName = orig.slice(baseDir.length).split(path.sep).filter(Boolean).join('-').split(' ').join('-');
      const dest = path.resolve(baseDir, destFileName);
      fs.renameSync(orig, dest);
    });
    this.cleanEmptyFoldersRecursively(rootdir);
    return `Flattened ${rootdir}`;
  },

  getAbsolutePath(inputPath) {
    return inputPath ? path.resolve(process.cwd(), inputPath) : process.cwd();
  },

  getDirs(dir, recursive = true, acc = []) {
    try {
      const files = fs.readdirSync(dir);

      for (const i in files) {
        const name = [dir, files[i]].join('/');

        if (fs.statSync(name).isDirectory()) {
          acc.push(name);

          if (recursive) {
            this.getDirs(name, recursive, acc);
          }
        }
      }

      return acc;
    } catch (e) {
      return acc;
    }
  },

  getFiles(dir, recursive = true, acc = []) {
    try {
      const files = fs.readdirSync(dir);

      for (const i in files) {
        const name = [dir, files[i]].join('/');

        if (fs.statSync(name).isDirectory()) {
          if (recursive) {
            this.getFiles(name, recursive, acc);
          }
        } else {
          acc.push(name);
        }
      }

      return acc;
    } catch (e) {
      return acc;
    }
  },

  getNamedArgVals() {
    const [,, ...args] = process.argv;
    return args.filter(arg => arg.indexOf('=') > -1).map(arg => {
      return {
        argName: arg.split(/=(.*)/s)[0],
        camelisedArgName: this.camelize(arg.split(/=(.*)/s)[0]),
        value: arg.split(/=(.*)/s)[1]
      }
    });
  },

  getNamedArgVal(requested) {
    const [,, ...args] = process.argv;
    let val;
    args.forEach(arg => {
      if (arg.indexOf('=') < 0) {
        return;
      }

      const argName = arg.split(/=(.*)/s)[0];

      if (argName === requested) {
        val = arg.split(/=(.*)/s)[1];
      }
    });
    return val;
  },

  argExists(arg) {
    const [,, ...args] = process.argv;
    return args.indexOf(arg) > -1;
  },

  isPojo(item) { // Docs - returns true if the entity passed is a plain old JavaScript object.
    return typeof item === 'object' &&
    !Array.isArray(item) &&
    item !== null;
  },

  kebabToPascalCase(string) {
    
    return string.toLowerCase().split('-').map(it => it.charAt(0).toUpperCase() + it.substr(1)).join('');
  },
  logJSToFile(outPut, filePath) {
    
    if (!outPut) {
      return;
    }

    fs.writeFile(filePath, JSON.stringify(outPut, null, 2), function (err) {
      if (err) {
        console.log(err);
        return err;
      }

      return `Success! ${filePath} was saved`;
    });
  },

  minifyText(text) {
    return text.replace(/\n\s*\n/g, '').replace(/\s+/g, '');
  },

  mkdirP(dirPath) {
    try {
      const mkdirp = require('mkdirp');
      mkdirp.sync(dirPath);
    } catch (err) {
      console.log(err);
    }
  },

  parsedFilePath: function (filePath, opts = {
    downcase: true
  }) {
    filePath = filePath.trim();

    if (opts.downcase) {
      filePath = filePath.toLowerCase();
    }

    (opts.customReplacements || []).forEach(replacement => {
      replacement.find.forEach(find => {
        const findRegex = new RegExp(find, replacement.flags);
        filePath = filePath.replace(findRegex, replacement.replace);
      });
    });

    if (opts.strict) {
      filePath = filePath.replace(/[^a-zA-Z0-9\-_./]/g, '-');
    }

    return filePath.replace(/ /g, '-').replace(/-+/g, '-');
  },

  parseFilePaths(sourceDir, opts = {}) {
    const absSourceDirPath = this.getAbsolutePath(sourceDir);
    let objectPaths;

    if (opts.excludeFiles) {
      objectPaths = this.getDirs(absSourceDirPath);
    } else if (opts.excludeDirs) {
      objectPaths = this.getFiles(absSourceDirPath);
    } else {
      objectPaths = this.getFiles(absSourceDirPath).concat(this.getDirs(absSourceDirPath));
    }

    objectPaths.forEach(filePath => {
      if (opts.preserveDirname) {
        fs.renameSync(filePath, `${path.dirname(filePath)}/${this.parsedFilePath(path.basename(filePath))}`);
      } else {
        const parsedSection = this.parsedFilePath(filePath.replace(absSourceDirPath, ''));
        fs.renameSync(filePath, `${absSourceDirPath}${parsedSection}`);
      }
    });
    console.log('Parsed filenames');
  },

  parseUrl(string) {
    return string.replace(/\/\/+/g, '/').replace(/\s+/g, '-');
  },

  pathToAngleBracket(path) {
    const parts = this.removeLeadingSlash(path).split('/');
    const parsed = parts.map(part => this.kebabToPascalCase(part));
    return parsed.join('::');
  },


  removeExt(filePath) {
    return path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
  },
  removeLeadingandTrailingSlash(str) {
    str = this.removeLeadingSlash(str);
    str = this.removeTrailingSlash(str);
    return str;
  },

  removeLeadingSlash(str) {
    if (str.startsWith('/')) {
      return str.substring(1);
    }  else if (str.startsWith('./')) {
      return str.substring(2);
    }

    return str;
  },


  removeTrailingSlash(str) {
    if (str.charAt(str.length - 1) === '/') {
      return str.substring(0, str.length - 1);
    }

    return str;
  },

  renameFilesAfterParentDir(sourceDir, opts = {}) {
    const subDirs = [sourceDir].concat(this.getDirs(sourceDir));
    subDirs.forEach(subDir => {
      const dirFiles = this.getFiles(subDir, false);
      const maxIndexDigits = dirFiles.length.toString().length;
      opts.minIndexDigits = opts.minIndexDigits || 0;
      const indexDigits = opts.minIndexDigits > maxIndexDigits ? opts.minIndexDigits : maxIndexDigits;
      dirFiles.forEach((orig, index) => {
        const numberStr = (index + 1).toString().padStart(indexDigits, '0'); // Add zeroes to the beginning of the nmber, so that each file's number has the same number of digits.

        const dest = `${subDir}/${path.basename(subDir)}-${numberStr}${path.extname(orig)}`;
        fs.renameSync(orig, dest);
      });
    });
    console.log('Renamed files after parent dir.');
  },

  timeConversion(duration) {
    if (duration < 1000) {
      return `${Math.round(parseFloat(duration / 1000) * 100) / 100}s`;
    }

    const portions = [];
    const msInHour = 1000 * 60 * 60;
    const hours = Math.trunc(duration / msInHour);

    if (hours > 0) {
      portions.push(`${hours}h`);
      duration = duration - (hours * msInHour);
    }

    const msInMinute = 1000 * 60;
    const minutes = Math.trunc(duration / msInMinute);

    if (minutes > 0) {
      portions.push(`${minutes}m`);
      duration = duration - (minutes * msInMinute);
    }

    const seconds = Math.trunc(duration / 1000);

    if (seconds > 0) {
      portions.push(`${seconds}s`);
    }

    return portions.join(' ');
  },
  trimFromEnd(string, trim = '') {
    if (!string) {
      return;
    }

    string = string.slice(0, -1 * trim.length);
    return string;
  },

  uniq(array) {
    return array.filter((v, i, a) => a.indexOf(v) === i);
  },

  uniqFilter(value, index, self) {
    return self.indexOf(value) === index;
  },

  yamlFileToJs(filePath) {
    return this.yamlToJs(fs.readFileSync(filePath, 'utf8'));
  },

  yamlToJs(contents) {
    try {
      const yamlToJS = require('js-yaml');
      return yamlToJS.load(contents);
    } catch (err) {
      console.log(err);
    }
  }
};