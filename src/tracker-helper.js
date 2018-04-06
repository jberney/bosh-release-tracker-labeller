const {exec} = require('child_process');

const post = (url, body, token) => new Promise((res, rej) =>
  exec(`curl -X POST -H "X-TrackerToken: ${token}" -H "Content-Type: application/json" -d '${JSON.stringify(body)}' ${url}`,
    (err, out) => err ? rej(err) : res(out)));

const TrackerHelper = {
  getStoryNumbers(messages) {
    const storyNumbers = {};
    messages.forEach(message => {
      const re = /#(\d{9,})/gm;
      let matches;
      while (matches = re.exec(message)) {
        storyNumbers[matches[1]] = true;
      }
    });
    return Object.keys(storyNumbers);
  },
  addLabel: (projectId, storyNumber, name, token) =>
    post(`https://www.pivotaltracker.com/services/v5/projects/${projectId}/stories/${storyNumber}/labels`, {name}, token)
};

module.exports = TrackerHelper;