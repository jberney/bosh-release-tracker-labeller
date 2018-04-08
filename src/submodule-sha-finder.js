const path = require('path');
const GitHelper = require('./git-helper');

const SubmoduleShaFinder = {
  findShas: async (tag, opts) => (await GitHelper.listTree(tag, path.join('src', '*'), opts))
    .map(({file, ...rest}) => ({...rest, file: file.replace(/^src\//, '')}))
    .reduce((memo, {object, file}) => ({...memo, [file]: object}), {})
};

module.exports = SubmoduleShaFinder;