const {exec} = require('child_process');

const tagToSemver = tag => tag.split('.').map(s => s.replace(/^[^\d]*(\d+)[^\d]*$/, '$1')).map(i => +i);

const sortSemversReverse = ([majorA, minorA, patchA], [majorB, minorB, patchB]) => {
  if (majorA !== majorB) return Math.sign(majorB - majorA);
  if (minorA !== minorB) return Math.sign(minorB - minorA);
  if (patchA !== patchB) return Math.sign(patchB - patchA);
  return 0;
};

const GitHelper = {
  git: (cmd, opts) =>
    new Promise((res, rej) => exec(`git ${cmd}`, {maxBuffer: 1048576, ...opts},
      (err, out) => err ? rej(err) : res(out))),

  getCommitMessage: async (sha, opts) => GitHelper.git(`show -s --format=%B ${sha}`, opts),

  getCommits: async (sha1, sha2, opts) => (await GitHelper.git(`log ${sha1}..${sha2} --oneline`, opts))
    .split('\n')
    .filter(Boolean)
    .map(l => [l.substr(0, l.indexOf(' ')), l.substr(l.indexOf(' ') + 1)])
    .filter(([sha, message]) => !message.match(/v\d+\.\d+\.\d+/))
    .reduce((memo, [sha, message]) => [...memo, message.replace(/</g, '&lt;').replace(/>/g, '&gt;')], []),

  getForkPoint: (branch1, branch2, opts) => GitHelper.git(`merge-base ${branch1} ${branch2}`, opts),

  async getPreviousTag(tag, opts) {
    const [major, minor, patch] = tagToSemver(tag);
    const tags = (await GitHelper.git('tag', opts)).split('\n').map(tagToSemver)
      .filter(([major, minor, patch]) => !(isNaN(major) || isNaN(minor) || isNaN(patch)));
    tags.sort(sortSemversReverse);
    if (minor === 0 && patch === 0) return GitHelper.getForkPoint('master', `${major - 1}`, opts);
    const previousTag = patch === 0
      ? tags.find(([tagMajor, tagMinor]) => tagMajor === major && tagMinor < minor)
      : tags.find(([tagMajor, tagMinor, tagPatch]) => tagMajor === major && tagMinor === minor && tagPatch < patch);
    if (!previousTag) throw new Error(`Could not find a previous tag for ${tag}`);
    return previousTag.join('.');
  }
};

module.exports = GitHelper;