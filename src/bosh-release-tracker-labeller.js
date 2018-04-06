const GitHelper = require('./git-helper');
const TrackerHelper = require('./tracker-helper');

const getShas = async (tag, opts) =>
  (await GitHelper.getCommitMessage(tag, opts))
    .split('\n')
    .filter(Boolean)
    .map(line => line.split(': '))
    .filter(elements => elements.length === 2)
    .reduce((memo, [repo, sha]) => ({...memo, [repo]: sha}), {});

module.exports = {
  async labelStories({RELEASE_NAME, RELEASE_REPO, TAG, TRACKER_PROJECT_ID, TRACKER_TOKEN}) {
    const opts = repo => ({cwd: `../${repo}`});
    const releaseOpts = opts(RELEASE_REPO);
    const previousTag = await GitHelper.getPreviousTag(TAG, releaseOpts);
    const tagShas = await getShas(TAG, releaseOpts);
    const previousTagShas = await getShas(previousTag, releaseOpts);
    (await Promise.all(Object.keys(tagShas)
      .filter(repo => previousTagShas[repo] !== tagShas[repo])
      .map(repo => GitHelper.getCommits(previousTagShas[repo], tagShas[repo], opts(repo)))))
      .reduce((memo, [...messages]) => [...memo, ...TrackerHelper.getStoryNumbers(messages)], [])
      .map(storyNumber => TrackerHelper.addLabel(TRACKER_PROJECT_ID, storyNumber, `${RELEASE_NAME}-${TAG}`, TRACKER_TOKEN));
  }
};