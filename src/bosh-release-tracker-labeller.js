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
  async labelStories({RELEASE_NAME, RELEASE_REPO, TAG, TRACKER_TOKEN}) {
    const label = `${RELEASE_NAME}-${TAG}`;
    console.log({RELEASE_NAME, RELEASE_REPO, TAG, label});

    const opts = repo => ({cwd: `../${repo}`});
    const releaseOpts = opts(RELEASE_REPO);

    const previousTag = await GitHelper.getPreviousTag(TAG, releaseOpts);
    console.log({previousTag});

    const tagShas = await getShas(TAG, releaseOpts);
    console.log({tagShas});

    const previousTagShas = await getShas(previousTag, releaseOpts);
    console.log({previousTagShas});

    const commits = await Promise.all(Object.keys(tagShas)
      .filter(repo => previousTagShas[repo] !== tagShas[repo])
      .map(repo => GitHelper.getCommits(previousTagShas[repo], tagShas[repo], opts(repo))));
    const storyIds = Array.from(commits.map(TrackerHelper.getStoryIds)
      .reduce((memo, storyIds) => (storyIds.forEach(memo.add, memo), memo), new Set()));
    console.log({storyIds});

    (await Promise.all(storyIds.map(storyId => TrackerHelper.getStory(storyId, TRACKER_TOKEN))))
      .filter(({labels}) => !labels.find(({name}) => name === label))
      .map(({id, project_id}) => TrackerHelper.addLabel(project_id, id, label, TRACKER_TOKEN));
  }
};