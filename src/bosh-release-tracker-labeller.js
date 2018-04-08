const CommitShaFinder = require('./commit-sha-finder');
const GitHelper = require('./git-helper');
const SubmoduleShaFinder = require('./submodule-sha-finder');
const TrackerHelper = require('./tracker-helper');

const opts = repo => ({cwd: `../${repo}`});
const shaFinders = {commit: CommitShaFinder, submodule: SubmoduleShaFinder};

module.exports = {
  async labelStories({RELEASE_NAME, RELEASE_REPO, TRACKER_TOKEN}) {
    const [previousTag, tag, shaFinder = 'submodule'] = process.argv.slice(2);

    const ShaFinder = shaFinders[shaFinder];
    if (!ShaFinder) throw new Error(`Unknown sha finder: ${shaFinder} (must be 'commit' or 'submodule')`);

    const releaseOpts = opts(RELEASE_REPO);
    const tagShas = await ShaFinder.findShas(tag, releaseOpts);
    const previousTagShas = await ShaFinder.findShas(previousTag, releaseOpts);

    const commits = await Promise.all(Object.keys(tagShas)
      .filter(repo => previousTagShas[repo] !== tagShas[repo])
      .map(repo => GitHelper.getCommits(previousTagShas[repo], tagShas[repo], opts(repo))));
    const storyIds = Array.from(commits.map(TrackerHelper.getStoryIds)
      .reduce((memo, storyIds) => (storyIds.forEach(memo.add, memo), memo), new Set()));
    console.log(`Found ${storyIds.length} stories in git commits.`);
    if (storyIds.length === 0) return;

    const allStories = await Promise.all(storyIds.map(storyId => TrackerHelper.getStory(storyId, TRACKER_TOKEN)));
    console.log(`Found ${allStories.length} stories in Tracker.`);
    if (allStories.length === 0) return;

    const label = `${RELEASE_NAME}-${tag}`;
    const stories = allStories.filter(({labels}) => !labels.find(({name}) => name === label));
    console.log(`Found ${stories.length} stories that were missing the label '${label}'`);
    if (stories.length === 0) return;

    for (let i = 0; i < stories.length; i++) {
      const {id, project_id} = stories[i];
      console.log(`[${i + 1}/${stories.length}] Adding label '${label}' to story #${id}`);
      await TrackerHelper.addLabel(project_id, id, label, TRACKER_TOKEN);
    }

    console.log(`Label '${label}' successfully added to ${stories.length} stories`);
  }
};