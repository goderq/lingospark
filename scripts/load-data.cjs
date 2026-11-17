// Execute the same plain-data modules Metro uses, with JSON imports supported.
// This keeps Node audits from reimplementing the app's dictionary filters.
const fs = require('node:fs');
const path = require('node:path');
const { transformSync } = require('@babel/core');
const cache = new Map();
module.exports = function loadData(filename) {
  const absolute = path.resolve(filename);
  const file = [absolute, absolute + '.js', absolute + '.json'].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!file) throw new Error('Data module not found: ' + filename);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  if (file.endsWith('.json')) { module.exports = JSON.parse(fs.readFileSync(file, 'utf8')); return module.exports; }
  const compiled = transformSync(fs.readFileSync(file, 'utf8'), { filename: file, babelrc: false, configFile: false, plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')] }).code;
  const requireData = name => name.startsWith('.') ? loadData(path.resolve(path.dirname(file), name)) : require(name);
  new Function('require', 'module', 'exports', compiled)(requireData, module, module.exports);
  return module.exports;
};
