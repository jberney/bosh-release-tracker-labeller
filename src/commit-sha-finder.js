const GitHelper = require('./git-helper');

const CommitShaFinder = {
  findShas: async (tag, opts) => (await GitHelper.getCommitMessage(tag, opts))
    .split('\n')
    .filter(Boolean)
    .map(line => line.split(': '))
    .filter(elements => elements.length === 2)
    .reduce((memo, [repo, sha]) => ({...memo, [repo]: sha}), {})
};

module.exports = CommitShaFinder;