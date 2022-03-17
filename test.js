const CryptoJS = require('crypto-js');
const YAML = require('json2yaml');
const chalk = require('chalk');
const copydir = require('copy-dir');
const csv = require('csv-parser');
const fs = require('fs');
const jsdom = require("jsdom");
const mkdirp = require('mkdirp');
const moment = require('moment');
const nodeUrl = require('url');
const path = require('path');
const tomlify = require('tomlify-j0.4');

module.exports = {
  addEmptyColumns: function (parts, firstExpected, columnMatch, columnMatchInstance = 1) {
    const firstFound = this.nthColumn(parts, columnMatch, columnMatchInstance);

    if (firstExpected > firstFound) {
      parts.splice(firstFound, 0, '');
      this.addEmptyColumns(parts, firstExpected, columnMatch, columnMatchInstance);
    } else {
      return parts;
    }
  },
  addEmptyColumns: function (parts, firstExpected, columnMatch, columnMatchInstance = 1) {
    const firstFound = this.nthColumn(parts, columnMatch, columnMatchInstance);

    if (firstExpected > firstFound) {
      parts.splice(firstFound, 0, '');
      this.addEmptyColumns(parts, firstExpected, columnMatch, columnMatchInstance);
    } else {
      return parts;
    }
  },
  additionalDescriptionLine: function (parts) {
    const partsWithLength = (parts || []).filter(part => {
      return part.length > 0;
    });
    const allButOneEmpty = partsWithLength.length === 1;

    if (allButOneEmpty) {
      return partsWithLength[0];
    } else {
      return '';
    }
  },
  additionalDescriptionLine: function (parts) {
    const partsWithLength = (parts || []).filter(part => {
      return part.length > 0;
    });
    const allButOneEmpty = partsWithLength.length === 1;

    if (allButOneEmpty) {
      return partsWithLength[0];
    } else {
      return '';
    }
  },
  camelize: function (str) {
    // In node utils
    if (!str) {
      return;
    }

    return str.toLowerCase().replace(' ', '_').replace(/-|_+(.)?/g, function (match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  },
  capitaliseFirstChar: function (string) {
    return `${string[0].toUpperCase()}${string.slice(1)}`;
  },
  capitaliseFirstChar: function (string) {
    // In node utils
    return `${string[0].toUpperCase()}${string.slice(1)}`;
  },
  capitalizeFirstLetter: function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
  capitalizeFirstLetter: function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
  cleanEmptyFoldersRecursively: function (folder) {
    // In node uitls
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
      }); // re-evaluate files; after deleting subfolder
      // we may have parent folder empty now

      files = fs.readdirSync(folder);
    }

    if (files.length == 0) {
      fs.rmdirSync(folder);
      return;
    }
  },
  cleanEmptyFoldersRecursively: function (folder) {
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
      files = fs.readdirSync(folder);
    }

    if (files.length == 0) {
      fs.rmdirSync(folder); // console.log("removing: ", folder);

      return;
    }
  },
  cleanEmptyFoldersRecursively: function (folder) {
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
      files = fs.readdirSync(folder);
    }

    if (files.length == 0) {
      fs.rmdirSync(folder); // console.log("removing: ", folder);

      return;
    }
  },
  combinePaths: function (array) {
    return array.filter(item => {
      return item;
    }).map(item => {
      item = this.removeLeadingSlash(item);
      item = this.removeTrailingSlash(item);
      return item;
    }).join('/');
  },
  combinePaths: function (array) {
    return array.filter(item => {
      return item;
    }).map(item => {
      item = this.removeLeadingSlash(item);
      item = this.removeTrailingSlash(item);
      return item;
    }).join('/');
  },
  conditionalSlash: function (string, position) {
    return position === 'end' && string.endsWith('/') || position === 'start' && string.startsWith('/') ? '' : '/';
  },
  copyDirectory: function (source, dest, options = {}) {
    const rootSource = source ? path.resolve(process.cwd(), source) : process.cwd();
    const rootDest = dest ? path.resolve(process.cwd(), dest) : process.cwd();
    copydir.sync(rootSource, rootDest, options);
    return {
      from: rootSource,
      to: rootDest
    };
  },
  copyDirectory: function (source, dest, options = {}) {
    const rootSource = source ? path.resolve(process.cwd(), source) : process.cwd();
    const rootDest = dest ? path.resolve(process.cwd(), dest) : process.cwd();
    copydir.sync(rootSource, rootDest, options);
    return {
      from: rootSource,
      to: rootDest
    };
  },
  createMDFile: function (object, fileOutPutPath, frontMatterFormat) {
    var frontMatter = object.frontMatter || {};
    var content = object.content || {};
    return new Promise((resolve, reject) => {
      var frontMatterDelimiter;

      if (frontMatterFormat === 'toml') {
        frontMatterDelimiter = '+++';
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
        frontMatterDelimiter = '---';
      }

      var final = '';

      if (frontMatterFormat === 'toml') {
        // Only for toml, because JSON doesn't have delimiters and with yml, the YAML dep adds the first delimiter for you.
        final += `${frontMatterDelimiter}\n`;
      }

      if (frontMatterFormat === 'toml') {
        final += tomlify.toToml(frontMatter, {
          space: 2
        });
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
        final += YAML.stringify(frontMatter);
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

      var directoryOutPutPath = path.dirname(fileOutPutPath);
      this.mkdirP(directoryOutPutPath);
      var filepath = fileOutPutPath;
      fs.writeFile(filepath, final, function (err) {
        if (err) {
          reject(err);
        }

        resolve(`Succes! ${filepath} was saved!`);
      });
    });
  },
  createMDFile: function (object, fileOutPutPath, frontMatterFormat) {
    // In node utils
    var frontMatter = object.frontMatter || {};
    var content = object.content || {};
    return new Promise((resolve, reject) => {
      var frontMatterDelimiter;

      if (frontMatterFormat === 'toml') {
        frontMatterDelimiter = '+++';
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
        frontMatterDelimiter = '---';
      }

      var final = '';

      if (frontMatterFormat === 'toml') {
        // Only for toml, because JSON doesn't have delimiters and with yml, the YAML dep adds the first delimiter for you.
        final += `${frontMatterDelimiter}\n`;
      }

      if (frontMatterFormat === 'toml') {
        final += tomlify.toToml(frontMatter, {
          space: 2
        });
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
        final += YAML.stringify(frontMatter);
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

      var directoryOutPutPath = path.dirname(fileOutPutPath);
      this.mkdirP(directoryOutPutPath);
      var filepath = fileOutPutPath;
      fs.writeFile(filepath, final, function (err) {
        if (err) {
          reject(err);
        }

        resolve(`Succes! ${filepath} was saved!`);
      });
    });
  },
  createMDFile: function (object, fileOutPutPath, frontMatterFormat) {
    var frontMatter = object.frontMatter || {};
    var content = object.content || {};
    return new Promise((resolve, reject) => {
      var frontMatterDelimiter;

      if (frontMatterFormat === 'toml') {
        frontMatterDelimiter = '+++';
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
        frontMatterDelimiter = '---';
      }

      var final = '';

      if (frontMatterFormat === 'toml') {
        // Only for toml, because JSON doesn't have delimiters and with yml, the YAML dep adds the first delimiter for you.
        final += `${frontMatterDelimiter}\n`;
      }

      if (frontMatterFormat === 'toml') {
        final += tomlify.toToml(frontMatter, {
          space: 2
        });
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
        final += YAML.stringify(frontMatter);
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

      var directoryOutPutPath = path.dirname(fileOutPutPath);
      this.mkdirP(directoryOutPutPath);
      var filepath = fileOutPutPath;
      fs.writeFile(filepath, final, function (err) {
        if (err) {
          reject(err);
        }

        resolve(`Succes! ${filepath} was saved!`);
      });
    });
  },
  createMDFile: function (object, fileOutPutPath, frontMatterFormat) {
    var frontMatter = object.frontMatter || {};
    var content = object.content || {};
    return new Promise((resolve, reject) => {
      var frontMatterDelimiter;

      if (frontMatterFormat === 'toml') {
        frontMatterDelimiter = '+++';
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
        frontMatterDelimiter = '---';
      }

      var final = '';

      if (frontMatterFormat === 'toml') {
        // Only for toml, because JSON doesn't have delimiters and with yml, the YAML dep adds the first delimiter for you.
        final += `${frontMatterDelimiter}\n`;
      }

      if (frontMatterFormat === 'toml') {
        final += tomlify.toToml(frontMatter, {
          space: 2
        });
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
        final += YAML.stringify(frontMatter);
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

      var directoryOutPutPath = path.dirname(fileOutPutPath);
      this.mkdirP(directoryOutPutPath);
      var filepath = fileOutPutPath;
      fs.writeFile(filepath, final, function (err) {
        if (err) {
          reject(err);
        }

        resolve(`Succes! ${filepath} was saved!`);
      });
    });
  },
  createMenuFile: function (allMenus, fileOutPutPath, frontMatterFormat, outputDirectory) {
    return new Promise((resolve, reject) => {
      var final;

      if (frontMatterFormat === 'toml') {
        final = tomlify.toToml(allMenus, {
          space: 2
        });
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
        final = YAML.stringify(allMenus);
      } else {
        if (frontMatterFormat !== 'json') {
          console.log(chalk.red(`${frontMatterFormat} is not a valid output format. Use 'toml', 'yml', 'yaml' ot 'json'. JSON has been used as the default.`));
        }

        final = JSON.stringify(allMenus);
      }

      var filepath = `${outputDirectory}/menu-output.${frontMatterFormat}`;
      fs.writeFile(filepath, final, function (err) {
        if (err) {
          reject(err);
        }

        resolve(`Succes! ${filepath} was saved!`);
      });
    });
  },
  createMenuFile: function (allMenus, fileOutPutPath, frontMatterFormat, outputDirectory) {
    return new Promise((resolve, reject) => {
      var final;

      if (frontMatterFormat === 'toml') {
        final = tomlify.toToml(allMenus, {
          space: 2
        });
      } else if (frontMatterFormat === 'yml' || frontMatterFormat === 'yaml') {
        final = YAML.stringify(allMenus);
      } else {
        if (frontMatterFormat !== 'json') {
          console.log(chalk.red(`${frontMatterFormat} is not a valid output format. Use 'toml', 'yml', 'yaml' ot 'json'. JSON has been used as the default.`));
        }

        final = JSON.stringify(allMenus);
      }

      var filepath = `${outputDirectory}/menu-output.${frontMatterFormat}`;
      fs.writeFile(filepath, final, function (err) {
        if (err) {
          reject(err);
        }

        resolve(`Succes! ${filepath} was saved!`);
      });
    });
  },
  createSha256: function (string) {
    var hash = CryptoJS.SHA256(string);
    return hash.toString(CryptoJS.enc.Hex);
  },
  csvFromPdf: function (pdfPaths) {
    return pdfPaths.map(pdfPath => {
      return path.format({
        dir: path.dirname(pdfPath),
        name: path.basename(pdfPath, path.extname(pdfPath)),
        ext: '.csv'
      });
    });
  },
  csvFromPdf: function (pdfPaths) {
    return pdfPaths.map(pdfPath => {
      return path.format({
        dir: path.dirname(pdfPath),
        name: path.basename(pdfPath, path.extname(pdfPath)),
        ext: '.csv'
      });
    });
  },
  csvToJSON: function (filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath).pipe(csv([])).on('data', data => results.push(data)).on('end', () => {
        const lines = results.map(result => {
          const line = [];

          for (const key in result) {
            line.push(result[key]);
          }

          return line;
        });
        resolve(lines);
      });
    });
  },
  csvToJSON: function (filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath).pipe(csv([])).on('data', data => results.push(data)).on('end', () => {
        const lines = results.map(result => {
          const line = [];

          for (const key in result) {
            line.push(result[key]);
          }

          return line;
        });
        resolve(lines);
      });
    });
  },
  deleteFolderRecursively: function (directoryPath) {
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
  downcaseUnderscore: function (string) {
    // In node utils
    return string.toLowerCase().replace(/ /g, '_');
  },
  downcaseUnderscore: function (string) {
    return string.toLowerCase().replace(/ /g, '_');
  },
  escapeRegExp: function (text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  },
  escapeRegExp: function (text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  },
  escapeRegExp: function (string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  },
  fileIsNewer: function (opts) {
    if (!fs.existsSync(opts.destPath)) {
      return true;
    }

    if (!fs.existsSync(opts.srcPath)) {
      return;
    }

    const srcMtime = opts.srcMtime || fs.statSync(opts.srcPath).mtime;
    return srcMtime > fs.statSync(opts.destPath).mtime;
  },
  fileOutputPathfromUrl: function (url, outputDirectory) {
    var directory = outputDirectory || "output";
    var fullPath = nodeUrl.parse(url).path;
    return this.parseUrl(`${directory}/${fullPath}.md`);
  },
  fileOutputPathfromUrl: function (url, outputDirectory) {
    var directory = outputDirectory || "output";
    var fullPath = nodeUrl.parse(url).path;
    return this.parseUrl(`${directory}/${fullPath}.md`);
  },
  fileOutputPathfromUrl: function (url, outputDirectory) {
    var directory = outputDirectory || "output";
    var fullPath = nodeUrl.parse(url).path;
    return this.parseUrl(`${directory}/${fullPath}.md`);
  },
  fileOutputPathfromUrl: function (url, outputDirectory) {
    var directory = outputDirectory || "output";
    var fullPath = nodeUrl.parse(url).path;
    return this.parseUrl(`${directory}/${fullPath}.md`);
  },
  findParents: function (current, acc, k2Categories) {
    acc = acc || [];
    var parent = this.parentCategoryObject(current, k2Categories);

    if (parent) {
      acc.unshift(parent.alias);
      return this.findParents(parent, acc);
    } else {
      return acc;
    }
  },
  findParents: function (current, acc, k2Categories) {
    acc = acc || [];
    var parent = this.parentCategoryObject(current, k2Categories);

    if (parent) {
      acc.unshift(parent.alias);
      return findParents(parent, acc);
    } else {
      return acc;
    }
  },
  firstColumn: function (parts, columnMatch) {
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].trim().match(columnMatch)) {
        return i;
      }
    }
  },
  firstColumn: function (parts, columnMatch) {
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].trim().match(columnMatch)) {
        return i;
      }
    }
  },
  flattenDirectory: function (dir, opts = {}) {
    if (opts.copyDir) {
      var copyResult = this.copyDirectory(dir, opts.copyDir.outputPath, opts.copyDir.copySyncOpts);
      dir = copyResult.to;
    }

    const rootdir = dir ? path.resolve(process.cwd(), dir) : process.cwd();
    this.getFiles(rootdir).forEach(orig => {
      var rootDirParts = rootdir.split(path.sep);
      var baseDir = orig.split(path.sep).slice(0, rootDirParts.length + (opts.depth || 0)).join(path.sep);
      const destFileName = orig.slice(baseDir.length).split(path.sep).filter(Boolean).join("-").split(" ").join("-");
      const dest = path.resolve(baseDir, destFileName);
      fs.renameSync(orig, dest);
    });
    this.cleanEmptyFoldersRecursively(rootdir);
    return `Flattened ${rootdir}`;
  },
  flattenDirectory: function (dir, opts = {}) {
    if (opts.copyDir) {
      var copyResult = this.copyDirectory(dir, opts.copyDir.outputPath, opts.copyDir.copySyncOpts);
      dir = copyResult.to;
    }

    const rootdir = dir ? path.resolve(process.cwd(), dir) : process.cwd();
    this.getFiles(rootdir).forEach(orig => {
      var rootDirParts = rootdir.split(path.sep);
      var baseDir = orig.split(path.sep).slice(0, rootDirParts.length + (opts.depth || 0)).join(path.sep);
      const destFileName = orig.slice(baseDir.length).split(path.sep).filter(Boolean).join("-").split(" ").join("-");
      const dest = path.resolve(baseDir, destFileName);
      fs.renameSync(orig, dest);
    });
    this.cleanEmptyFoldersRecursively(rootdir);
    return `Flattened ${rootdir}`;
  },
  getAbsolutePath: function (inputPath) {
    return inputPath ? path.resolve(process.cwd(), inputPath) : process.cwd();
  },
  getAbsolutePath: function (inputPath) {
    return inputPath ? path.resolve(process.cwd(), inputPath) : process.cwd();
  },
  getCsvs: function (dir) {
    return this.getFiles(dir).filter(file => path.extname(file) === '.csv');
  },
  getCsvs: function (dir) {
    return this.getFiles(dir).filter(file => path.extname(file) === '.csv');
  },
  getDirs: function (dir, recursive = true, acc = []) {
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
  getDirs: function (dir, recursive = true, acc = []) {
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
  getFieldPropById: function (collection, itemId, prop) {
    var object = collection.find(item => {
      return item.id === itemId;
    });
    return object[prop];
  },
  getFieldPropById: function (collection, itemId, prop) {
    var object = collection.find(item => {
      return item.id === itemId;
    });
    return object[prop];
  },
  getFiles: function (dir, files_) {
    // In node utils
    files_ = files_ || [];
    var files = fs.readdirSync(dir);

    for (var i in files) {
      var name = dir + '/' + files[i];

      if (fs.statSync(name).isDirectory()) {
        this.getFiles(name, files_);
      } else {
        files_.push(name);
      }
    }

    return files_;
  },
  getFiles: function (dir, recursive = true, acc = []) {
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
  getFiles: function (dir, files_) {
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
  getFiles: function (dir, files_) {
    // in node utils
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
  getFiles: function (dir, recursive = true, acc = []) {
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
  getFiles: function (dir, files_) {
    files_ = files_ || [];
    var files;

    try {
      files = fs.readdirSync(dir);

      for (var i in files) {
        var name = dir + '/' + files[i];

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
  getK2ItemMenuItemById: function (itemId, menuItems) {
    return menuItems.find(mi => {
      var splitLink = mi.link.split(/[?=&]+/);

      if (splitLink[2] === 'com_k2' && splitLink[4] === 'item') {
        return itemId === splitLink[splitLink.length - 1];
      }
    });
  },
  getK2ItemMenuItemById: function (itemId, menuItems) {
    return menuItems.find(mi => {
      var splitLink = mi.link.split(/[?=&]+/);

      if (splitLink[2] === 'com_k2' && splitLink[4] === 'item') {
        return itemId === splitLink[splitLink.length - 1];
      }
    });
  },
  getNamedArgVal: function (requested) {
    const [,, ...args] = process.argv;
    let val;
    args.forEach(arg => {
      if (arg.indexOf('=') < 0) {
        return;
      }

      const argName = arg.split('=')[0];

      if (argName === requested) {
        val = arg.split('=')[1];
      }
    });
    return val;
  },
  getNamedArgVal: function (requested) {
    // In node utils
    const [,, ...args] = process.argv;
    let val;
    args.forEach(arg => {
      if (arg.indexOf('=') < 0) {
        return;
      }

      const argName = arg.split('=')[0];

      if (argName === requested) {
        val = arg.split('=')[1];
      }
    });
    return val;
  },
  getPdfs: function (dir) {
    return this.getFiles(dir).filter(file => path.extname(file) === '.pdf');
  },
  getPdfs: function (dir) {
    return this.getFiles(dir).filter(file => path.extname(file) === '.pdf');
  },
  getStatementMonth: function (filePath, monthRange, matchIndex = 0) {
    const yearMonthStringMatches = path.basename(filePath).match(/(19|20)\d{2}\-(0[1-9]|1[012])/g) || [];

    if (!yearMonthStringMatches[matchIndex]) {
      return;
    }

    const monthName = moment(`${yearMonthStringMatches[matchIndex]}-01`).format('MMM');

    if (monthRange.indexOf(monthName > -1)) {
      return {
        month: monthName,
        year: moment(`${yearMonthStringMatches[matchIndex]}-01`).format('YYYY')
      };
    } else {
      matchIndex++;
      return this.getStatementMonth(filePath, monthRange, matchIndex);
    }
  },
  getStatementMonth: function (filePath, monthRange, matchIndex = 0) {
    const yearMonthStringMatches = path.basename(filePath).match(/(19|20)\d{2}\-(0[1-9]|1[012])/g) || [];

    if (!yearMonthStringMatches[matchIndex]) {
      return;
    }

    const monthName = moment(`${yearMonthStringMatches[matchIndex]}-01`).format('MMM');

    if (monthRange.indexOf(monthName > -1)) {
      return {
        month: monthName,
        year: moment(`${yearMonthStringMatches[matchIndex]}-01`).format('YYYY')
      };
    } else {
      matchIndex++;
      return this.getStatementMonth(filePath, monthRange, matchIndex);
    }
  },
  isPaymentLine: function (parts, columns, options = {}) {
    const dateColumnIndex = columns.indexOf('Date');
    const amountColumnIndex = columns.indexOf('Amount');

    if (!parts[dateColumnIndex] || !parts[amountColumnIndex]) {
      return false;
    }

    if (moment(parts[dateColumnIndex], options.dateFormat, true).isValid() && parts[amountColumnIndex].match(options.amountFormat)) {
      return true;
    } else {
      return false;
    }
  },
  isPaymentLine: function (parts, columns, options = {}) {
    const dateColumnIndex = columns.indexOf('Date');
    const amountColumnIndex = columns.indexOf('Amount');

    if (!parts[dateColumnIndex] || !parts[amountColumnIndex]) {
      return false;
    }

    if (moment(parts[dateColumnIndex], options.dateFormat, true).isValid() && parts[amountColumnIndex].match(options.amountFormat)) {
      return true;
    } else {
      return false;
    }
  },
  kebabToPascalCase: function (string) {
    // In node utils
    return string.toLowerCase().split('-').map(it => it.charAt(0).toUpperCase() + it.substr(1)).join('');
  },
  logJSToFile: function (outPut, filePath) {
    // In node utils
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
  logJSToFile: function (outPut, filePath = 'log.json') {
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
  logJSToFile: function (outPut, filePath = 'log.json') {
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
  minifyText: function (text) {
    // In node utils
    return text.replace(/\n\s*\n/g, '').replace(/\s+/g, '');
  },
  mkdirP: function (dirPath) {
    mkdirp.sync(dirPath, err => {
      if (err) {
        console.error(err);
      }
    });
  },
  mkdirP: function (dirPath) {
    mkdirp.sync(dirPath);
  },
  mkdirP: function (dirPath) {
    mkdirp.sync(dirPath);
  },
  mkdirP: function (dirPath) {
    mkdirp.sync(dirPath);
  },
  mkdirP: function (dirPath) {
    mkdirp.sync(dirPath);
  },
  nthColumn: function (parts, columnMatch, n = 1) {
    let instancesFound = 0;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].trim().match(columnMatch)) {
        instancesFound++;
        if (instancesFound === n) return i;
      }
    }
  },
  nthColumn: function (parts, columnMatch, n = 1) {
    let instancesFound = 0;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].trim().match(columnMatch)) {
        instancesFound++;
        if (instancesFound === n) return i;
      }
    }
  },
  parentCategoryObject: function (categoryObject, k2Categories) {
    if (categoryObject.parent && categoryObject.parent !== "0") {
      return k2Categories.find(cat => {
        return cat.id === categoryObject.parent;
      });
    }
  },
  parentCategoryObject: function (categoryObject, k2Categories) {
    if (categoryObject.parent && categoryObject.parent !== "0") {
      return k2Categories.find(cat => {
        return cat.id === categoryObject.parent;
      });
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
        var findRegex = new RegExp(find, replacement.flags);
        filePath = filePath.replace(findRegex, replacement.replace);
      });
    });

    if (opts.strict) {
      filePath = filePath.replace(/[^a-zA-Z0-9\-_./]/g, '-');
    }

    return filePath.replace(/ /g, '-').replace(/-+/g, '-');
  },
  parsedFilePath: function (filePath, opts = {}) {
    filePath = filePath.trim();

    if (opts.downcase) {
      filePath = filePath.toLowerCase();
    }

    opts.customReplacements.forEach(replacement => {
      replacement.find.forEach(find => {
        var findRegex = new RegExp(find, replacement.flags);
        filePath = filePath.replace(findRegex, replacement.replace);
      });
    });

    if (opts.strict) {
      filePath = filePath.replace(/[^a-zA-Z0-9\-_./]/g, '-');
    }

    return filePath.replace(/ /g, '-').replace(/-+/g, '-');
  },
  parseFilePaths: function (sourceDir, opts = {}) {
    var absSourceDirPath = this.getAbsolutePath(sourceDir);
    var objectPaths;

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
        var parsedSection = this.parsedFilePath(filePath.replace(absSourceDirPath, ''));
        fs.renameSync(filePath, `${absSourceDirPath}${parsedSection}`);
      }
    });
    console.log('Parsed filenames');
    return;
  },
  parseFilePaths: function (sourceDir, opts = {}) {
    var absSourceDirPath = this.getAbsolutePath(sourceDir);
    var objectPaths;

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
        var parsedSection = this.parsedFilePath(filePath.replace(absSourceDirPath, ''));
        fs.renameSync(filePath, `${absSourceDirPath}${parsedSection}`);
      }
    });
    console.log('Parsed filenames');
    return;
  },
  parseUrl: function (string) {
    return string.replace(/\/\/+/g, '/').replace(/\s+/g, '-');
  },
  parseUrl: function (string) {
    return string.replace(/\/\/+/g, '/').replace(/\s+/g, '-');
  },
  parseUrl: function (string) {
    return string.replace(/\/\/+/g, '/').replace(/\s+/g, '-');
  },
  parseUrl: function (string) {
    return string.replace(/\/\/+/g, '/').replace(/\s+/g, '-');
  },
  pathToAngleBracket: function (path) {
    const parts = this.removeLeadingSlash(path).split('/');
    const parsed = parts.map(part => this.kebabToPascalCase(part));
    return parsed.join('::');
  },
  paymentType: function (rule, parts, options) {
    if (rule.default) {
      return;
    }

    const column = options.columns.indexOf(rule.column);
    const amount = parts[column];

    if (rule.position === 'end' && amount.trim().endsWith(rule.string) || rule.position === 'start' && amount.trim().startsWith(rule.string)) {
      parts[column] = amount.replace(rule.string, '').trim();
      return rule.type;
    }
  },
  paymentType: function (rule, parts, options) {
    if (rule.default) {
      return;
    }

    const column = options.columns.indexOf(rule.column);
    const amount = parts[column];

    if (rule.position === 'end' && amount.trim().endsWith(rule.string) || rule.position === 'start' && amount.trim().startsWith(rule.string)) {
      parts[column] = amount.replace(rule.string, '').trim();
      return rule.type;
    }
  },
  removeExt: function (filePath) {
    // In node utils
    return path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
  },
  removeLeadingandTrailingSlash: function (str) {
    str = this.removeLeadingSlash(str);
    str = this.removeTrailingSlash(str);
    return str;
  },
  removeLeadingandTrailingSlash: function (str) {
    str = this.removeLeadingSlash(str);
    str = this.removeTrailingSlash(str);
    return str;
  },
  removeLeadingSlash: function (inputPath) {
    if (inputPath.startsWith('/')) {
      return inputPath.substring(1);
    } else if (inputPath.startsWith('./')) {
      return inputPath.substring(2);
    } else {
      return inputPath;
    }
  },
  removeLeadingSlash: function (str) {
    if (str.charAt(0) === '/') {
      return str.substring(1);
    }

    return str;
  },
  removeLeadingSlash: function (str) {
    if (str.charAt(0) === '/') {
      return str.substring(1);
    }

    return str;
  },
  removeTrailingSlash: function (inputPath) {
    var lastChar = inputPath[inputPath.length - 1];
    return lastChar === '/' ? inputPath.slice(0, -1) : inputPath;
  },
  removeTrailingSlash: function (str) {
    if (str.charAt(str.length - 1) === '/') {
      return str.substring(0, str.length - 1);
    }

    return str;
  },
  removeTrailingSlash: function (str) {
    if (str.charAt(str.length - 1) === '/') {
      return str.substring(0, str.length - 1);
    }

    return str;
  },
  renameFilesAfterParentDir: function (sourceDir, opts = {}) {
    var subDirs = [sourceDir].concat(this.getDirs(sourceDir));
    subDirs.forEach(subDir => {
      var dirFiles = this.getFiles(subDir, false);
      var maxIndexDigits = dirFiles.length.toString().length;
      opts.minIndexDigits = opts.minIndexDigits || 0;
      var indexDigits = opts.minIndexDigits > maxIndexDigits ? opts.minIndexDigits : maxIndexDigits;
      dirFiles.forEach((orig, index) => {
        var numberStr = (index + 1).toString().padStart(indexDigits, "0"); // Add zeroes to the beginning of the nmber, so that each file's number has the same number of digits.

        var dest = `${subDir}/${path.basename(subDir)}-${numberStr}${path.extname(orig)}`;
        fs.renameSync(orig, dest);
      });
    });
    console.log('Renamed files after parent dir.');
  },
  renameFilesAfterParentDir: function (sourceDir, opts = {}) {
    var subDirs = [sourceDir].concat(this.getDirs(sourceDir));
    subDirs.forEach(subDir => {
      var dirFiles = this.getFiles(subDir, false);
      var maxIndexDigits = dirFiles.length.toString().length;
      opts.minIndexDigits = opts.minIndexDigits || 0;
      var indexDigits = opts.minIndexDigits > maxIndexDigits ? opts.minIndexDigits : maxIndexDigits;
      dirFiles.forEach((orig, index) => {
        var numberStr = (index + 1).toString().padStart(indexDigits, "0"); // Add zeroes to the beginning of the nmber, so that each file's number has the same number of digits.

        var dest = `${subDir}/${path.basename(subDir)}-${numberStr}${path.extname(orig)}`;
        fs.renameSync(orig, dest);
      });
    });
    console.log('Renamed files after parent dir.');
  },
  timeConversion: function (duration) {
    if (duration < 1000) {
      return `${Math.round(parseFloat(duration / 1000) * 100) / 100}s`;
    }

    const portions = [];
    const msInHour = 1000 * 60 * 60;
    const hours = Math.trunc(duration / msInHour);

    if (hours > 0) {
      portions.push(hours + 'h');
      duration = duration - hours * msInHour;
    }

    const msInMinute = 1000 * 60;
    const minutes = Math.trunc(duration / msInMinute);

    if (minutes > 0) {
      portions.push(minutes + 'm');
      duration = duration - minutes * msInMinute;
    }

    const seconds = Math.trunc(duration / 1000);

    if (seconds > 0) {
      portions.push(seconds + 's');
    }

    return portions.join(' ');
  },
  trimFromEnd: function (string, trim = '') {
    if (!string) {
      return;
    }

    string = string.slice(0, -1 * trim.length);
    return string;
  },
  uniq: function (array) {
    return array.filter((item, i, ar) => {
      return ar.indexOf(item) === i;
    });
  },
  uniq: function (array) {
    return array.filter((v, i, a) => a.indexOf(v) === i);
  },
  uniq: function (array) {
    // in node utils
    return array.filter((v, i, a) => a.indexOf(v) === i);
  },
  uniq: function (array) {
    return array.filter((item, i, ar) => {
      return ar.indexOf(item) === i;
    });
  },
  uniqFilter: function (value, index, self) {
    return self.indexOf(value) === index;
  },
  uniqFilter: function (value, index, self) {
    return self.indexOf(value) === index;
  },
  unsizedImagePath: function (imagePath) {
    var imagePathParts = imagePath.split('-');
    var lastPart = imagePathParts[imagePathParts.length - 1].replace(/\d{1,}w./, '.');
    return `${imagePathParts.slice(0, -1).join('-')}${lastPart}`;
  }
};