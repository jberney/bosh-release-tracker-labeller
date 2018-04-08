# bosh-release-tracker-labeller

## What is this project?

Pivotal teams use:
* **Pivotal Tracker** to track feature, bug, and chore stories. Stories have Story IDs.
* **Git** repositories to store code written for stories. Git commits have Pivotal Tracker Story IDs.
* **Bosh** to create release tarballs containing the work done for those stories. Bosh releases contain code from one or more Git repositories.

We want to know what code is in a given Bosh release, and also what tracker stories were completed for that Bosh release. This project addresses this need by taking a pair of Bosh release version numbers, determining the Pivotal Tracker stories that were addressed between these releases, and updating those stories with a label indicating that they were addressed for the new Bosh release.

1. We know the version of the Bosh release we just cut, and the version of previous Bosh release we cut in the past (`BOSH_VERSION_OLD`, `BOSH_VERSION_NEW`).
1. For `BOSH_VERSION_OLD` and `BOSH_VERSION_NEW`, determine the range of Git SHAs for each component project.
1. Retrieve the Git commit messages for each range of Git SHAs, and find the Pivotal Tracker Story IDs in the Git commits.
1. For each unique Pivotal Tracker story number, update the story with a label indicating that the story was addressed in `BOSH_VERSION_NEW`.

## Assumptions this project makes
* Story numbers are for projects hosted on www.pivotaltracker.com.
* Git commit messages include one or more Tracker Story IDs, e.g. `#12345678`
* Component projects are either submoduled in the `src` directory, or Bosh releases are tagged with commit messages that indicate the Git commit SHAs for each component project.

## How to use this project

### Dependencies

* node `^8.0.0`

This project has no node dependencies.

### Environment variables
* `RELEASE_NAME`: Prefix for the label that will be added to stories: `${RELEASE_NAME}-${NEW_TAG}`
* `RELEASE_REPO`: Name of the Git repository containing Bosh Release code.
* `TRACKER_TOKEN`: Pivotal Tracker API Token. Used to read story metadata and write labels to stories.

### Sha Finders

For each Bosh release version, we need to determine the range of Git SHAs for each component project. There are two available strategies.
#### `submodule` (default)

Use this option if the Bosh release submodules component projects into the `src` directory. Most Bosh releases are structured this way.

#### `commit`

If the Bosh release does not submodule component projects into the `src` directory, use this option. When tagging releases, use a commit message that lists the component project names and associated Git SHAs. Each project should be separated by a newline, and each name/SHA pair should be separated by a colon and a space.

```
project-1: 135ace
project-2: 2468bf
```

### Usage:
`npm start OLD_TAG NEW_TAG [SHA_FINDER]`

### Example:
```
RELEASE_NAME=some-release-name \
RELEASE_REPO=some-release-repo \
TRACKER_TOKEN=some-tracker-token \
npm start 1.2.3 1.2.4
```

* This will check `some-release-repo` between `1.2.3` and `1.2.4` for Git commits in submoduled component projects.
* The Git commits will be scanned for Tracker Story IDs.
* For each Story ID, `some-tracker-token` will be used to add the label `some-release-name-1.2.4`.

When determining the range of Git commits for component projects, to check commit messages in `some-release-repo` instead of checking its submodules, use `npm start 1.2.3 1.2.4 commit`.