const {exec} = require('child_process');

const curl = (url, token, method = 'GET', opts = '') => new Promise((res, rej) =>
  exec(`curl -X ${method} -H "X-TrackerToken: ${token}" ${opts} ${url}`, (err, out) => err ? rej(err) : res(out)));
const get = (url, token) => curl(url, token).then(JSON.parse);
const post = (url, body, token) =>
  curl(url, token, 'POST', `-H "Content-Type: application/json" -d '${JSON.stringify(body)}'`);

const labelsUrl = (projectId, storyId) => `https://www.pivotaltracker.com/services/v5/projects/${projectId}/stories/${storyId}/labels`;
const storyUrl = storyId => `https://www.pivotaltracker.com/services/v5/stories/${storyId}`;

const TrackerHelper = {
  addLabel: (projectId, storyId, name, token) => post(labelsUrl(projectId, storyId), {name}, token),
  getStory: (storyId, token) => get(storyUrl(storyId), token),
  getStoryIds(messages) {
    const storyIds = {};
    messages.forEach(message => {
      const re = /#(\d{9,})/gm;
      let matches;
      while (matches = re.exec(message)) {
        storyIds[matches[1]] = true;
      }
    });
    return Object.keys(storyIds);
  }
};

module.exports = TrackerHelper;