const {exec} = require('child_process');

const maxBuffer = 1048576;

const GitHelper = {
  git: (cmd, opts) =>
    new Promise((res, rej) => exec(`git ${cmd}`, {maxBuffer, ...opts}, (err, out) => err ? rej(err) : res(out))),

  getCommitMessage: async (sha, opts) => GitHelper.git(`show -s --format=%B ${sha}`, opts),

  getCommits: async (sha1, sha2, opts) => (await GitHelper.git(`log ${sha1}..${sha2} --oneline`, opts))
    .split('\n').filter(Boolean).map(l => [l.substr(0, l.indexOf(' ')), l.substr(l.indexOf(' ') + 1)])
    .filter(([sha, message]) => !message.match(/v\d+\.\d+\.\d+/))
    .reduce((memo, [sha, message]) => [...memo, message.replace(/</g, '&lt;').replace(/>/g, '&gt;')], []),

  listTree: async (tag, path, opts) => (await GitHelper.git(`ls-tree ${tag} ${path}`, opts)).split('\n').filter(Boolean)
    .map(line => line.split(/[\s\t]+/)).map(([mode, type, object, file]) => ({mode, type, object, file}))
};

module.exports = GitHelper;