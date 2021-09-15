module.exports = {
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
  }
}