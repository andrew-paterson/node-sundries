const chalk = require('chalk');
const lib = require('./index');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
let status;
let hasChangesToCommit;
let gitLog;
let dependentPackageCommitResult;
const results = [];

module.exports = async function (localConfig) {
  if (lib.argExists('--help')) {
    // printHelp();
    return;
  }
  localConfig.parentPackageName = path.basename(localConfig.parentPackage.repo);
  localConfig.parentPackage.commit = localConfig.parentPackage.push ? true : localConfig.parentPackage.commit;
  localConfig.parentPackage.updatePackageFile = localConfig.parentPackage.commit ? true : localConfig.parentPackage.updatePackageFile;

  try {
    const parentPackageDir = path.resolve(process.cwd());
    const parentPackageGit = simpleGit({
      baseDir: parentPackageDir,
    });
    const currentParentPackageBranch = (await parentPackageGit.branch()).current;
    const branchLockItem = localConfig.branchLock.find((item) => item[localConfig.parentPackageName].trim() === currentParentPackageBranch);
    if (!branchLockItem) {
      console.log(chalk.cyan(`Stopping as no branch lock entry exists for branch ${currentParentPackageBranch} in ${localConfig.parentPackageName}.`));
      return;
    }
    console.log(chalk.white('[ -----------------------Branch lock----------------------- ]'));
    console.log(chalk.white('The following is a breakdown of which branches will be updated in the listed repos.'));
    console.log(chalk.white(JSON.stringify(branchLockItem, null, 2)));

    console.log(chalk.white('[ -----------------------Preliminary checks started----------------------- ]'));

    await initialiseRepo(localConfig.parentPackageName, parentPackageGit, 'cyan', branchLockItem, localConfig);
    const dependentPackages = [];
    const dependentPackagesFiltered = localConfig.localDependents.filter((item) => !item.skip);
    for (const item of dependentPackagesFiltered) {
      const repoPath = path.resolve(process.cwd(), item.repo);
      item.repo = repoPath;
      item.name = path.basename(item.repo);
      item.packageName = item.packageName || path.basename(repoPath);
      item.git = simpleGit({
        baseDir: repoPath,
      });
      await initialiseRepo(item.name, item.git, 'blue', branchLockItem, localConfig);
      dependentPackages.push(item);
    }

    console.log(chalk.white('[ -----------------------Preliminary checks completed----------------------- ]'));

    for (const dependentPackage of dependentPackages) {
      try {
        status = await dependentPackage.git.status();
        hasChangesToCommit = status.files.length > 0;
        gitLog = await dependentPackage.git.log();
        if (!hasChangesToCommit) {
          console.log(chalk.blue(`[${dependentPackage.name}] Nothing to commit - HEAD is still at ${gitLog.latest.hash}`));
        } else if (!dependentPackage.commitMessage && dependentPackage.amendLatestCommit !== 'no-edit') {
          console.log(chalk.blue(`[${dependentPackage.name}] Skipping as there are chnages to commit, but no commit message was provided.`));
          continue;
        } else {
          let dependentPackageCommitMessage = dependentPackage.commitMessage;
          await dependentPackage.git.add('.');
          console.log(chalk.blue(`[${dependentPackage.name}] Added untracked files`));

          const commitOptions = {};
          if (dependentPackage.amendLatestCommit) {
            commitOptions['--amend'] = true;
          }
          if (dependentPackage.amendLatestCommit === 'no-edit') {
            commitOptions['--no-edit'] = true;
            dependentPackageCommitMessage = [];
          }

          dependentPackageCommitResult = await dependentPackage.git.commit(dependentPackageCommitMessage, commitOptions);
          await commitFeedback(dependentPackage.name, dependentPackageCommitResult, 'blue', dependentPackage.git);
        }
        const pushOptions = [];
        if (dependentPackage.amendLatestCommit) {
          pushOptions.push('-f');
        }

        if (dependentPackage.push) {
          const push = await dependentPackage.git.push(pushOptions);
          const pushMessage = (push.pushed[0] || {}).alreadyUpdated ? 'Already pushed' : 'Pushed code';
          console.log(chalk.blue(`[${dependentPackage.name}] ${pushMessage}}`));
        } else if (hasChangesToCommit) {
          console.log(chalk.blue(`[${dependentPackage.name}] code committed but not pushed.`));
        }

        const result = {
          app: dependentPackage.name,
          hash: await latestCommit(dependentPackage.git),
        };
        if ((localConfig.parentPackage.updatePackageFile || localConfig.parentPackage.push) && dependentPackage.packageName) {
          updateParentPackageFunc(dependentPackage, await latestCommit(dependentPackage.git), localConfig);
          result.parentPackageUpdated = true;
        }
        results.push(result);
      } catch (err) {
        console.log(chalk.red(err));
      }
    }

    if (localConfig.parentPackage.commit || localConfig.parentPackage.push) {
      await commitParentPackage(parentPackageGit, localConfig);
    }

    if (localConfig.parentPackage.push) {
      await pushParentPackage(parentPackageGit, localConfig);
    }

    if (!results.length) {
      console.log(chalk.yellow('No consuming apps were updated'));
      return;
    }

    console.log('RESULT');
    console.log(results);
    console.log('SKIPPED');
    const dependentPackagesSkippedGit = [];
    const dependentPackagesSkipped = localConfig.localDependents.filter((item) => item.skip);
    for (const item of dependentPackagesSkipped) {
      const repoPath = path.resolve(process.cwd(), item.repo);
      item.name = path.basename(item.repo);
      item.git = simpleGit({
        baseDir: repoPath,
      });
      dependentPackagesSkippedGit.push({
        app: path.basename(item.repo),
        latestlocalHash: await latestCommit(item.git),
      });
    }
    console.log(dependentPackagesSkippedGit);
  } catch (err) {
    console.log(chalk.red(err));
  }
};

function updateParentPackageFunc(dependentPackage, sha, localConfig) {
  const parentPackageFilePath = path.resolve(localConfig.parentPackage.repo, 'package.json');
  const parentPackageFile = require(parentPackageFilePath);
  const dependentPackagePackageLink = parentPackageFile.dependencies[dependentPackage.packageName].split('#')[0];
  parentPackageFile.dependencies[dependentPackage.packageName] = `${dependentPackagePackageLink}#${sha}`;
  fs.writeFileSync(parentPackageFilePath, JSON.stringify(parentPackageFile, null, 2));
  console.log(chalk.cyan(`[${localConfig.parentPackageName}] Updated hash of ${dependentPackagePackageLink} to ${sha}`));
}

async function commitParentPackage(parentPackageGit, localConfig) {
  await parentPackageGit.add('.');
  console.log(chalk.cyan(`[${localConfig.parentPackageName}] Added untracked files`));
  const parentPackageCommitResult = await parentPackageGit.commit(localConfig.parentPackage.commitMessage);
  await commitFeedback(localConfig.parentPackageName, parentPackageCommitResult, 'cyan', parentPackageGit);
}

async function pushParentPackage(parentPackageGit, localConfig) {
  const parentPackagePush = await parentPackageGit.push();
  const parentPackagePushMessage = (parentPackagePush.pushed[0] || {}).alreadyUpdated ? 'Already pushed' : 'Pushed code';
  console.log(chalk.cyan(`[${localConfig.parentPackageName}] ${parentPackagePushMessage}`));
}

async function initialiseRepo(repoName, git, logColour, branchLockItem, localConfig) {
  const branch = await branchLockPass(repoName, git, logColour, branchLockItem, localConfig);
  if (!branch) {
    throw 'Error';
  }
  await git.fetch('origin', branch);
  const remoteCommits = (await git.raw('rev-list', `origin/${branch}`)).split('\n');
  const localCommits = (await git.raw('rev-list', `${branch}`)).split('\n');
  if (localCommits.indexOf(remoteCommits[0]) < 0 && remoteCommits.indexOf(localCommits[0]) < 0) {
    // Remote and local have diverged
    throw `[${repoName}] ${branch} and origin/${branch} have diverged. This must be resolved before continuing.`;
  } else if (localCommits[0] === remoteCommits[0]) {
    // Local is up top date with remote
    console.log(chalk[logColour](`[${repoName}] ${branch} is up to date with origin/${branch}.`));
  } else if (localCommits.indexOf(remoteCommits[0]) > -1 && remoteCommits.indexOf(localCommits[0]) < 0) {
    // Local ahead of remote
    console.log(chalk[logColour](`[${repoName}] ${branch} is ahead of origin/${branch} and can be pushed.`));
  } else if (remoteCommits.indexOf(localCommits[0]) > -1 && localCommits.indexOf(remoteCommits[0]) < 0) {
    // Remote ahead of local
    console.log(chalk[logColour](`[${repoName}] origin/${branch} is ahead of ${branch}.`));
    if ((await git.status()).isClean()) {
      await git.pull();
      console.log(chalk[logColour](`[${repoName}] Pulled ${branch} branch.`));
    } else {
      throw `[${repoName}] origin/${branch} is ahead of ${branch} but ${branch} has uncommitted changes. This must be resolved before continuing.`;
    }
  }
  console.log(chalk[logColour](`[${repoName}] ${branch} - initialisation complete.`));
}

async function branchLockPass(appName, git, logColour, branchLockItem, localConfig) {
  try {
    if (!branchLockItem[appName]) {
      throw `[${appName}] Error - the branch lock entry which includes ${localConfig.parentPackageName}: ${branchLockItem[localConfig.parentPackageName]}" does not specify a branch for ${appName}.`;
    }
    const currentAppBranch = (await git.branch()).current;
    if (branchLockItem[appName] !== currentAppBranch) {
      console.log(chalk[logColour](`[${appName}] Switching from branch "${currentAppBranch}" to "${branchLockItem[appName]}" as per branch lock entry.`));
      await git.checkout(branchLockItem[appName]);
    }
    return (await git.branch()).current;
  } catch (err) {
    console.log(chalk.red(err));
    throw err;
  }
}

async function commitFeedback(repoName, commitResult, logColour, git) {
  const newSha = commitResult.commit.length ? commitResult.commit : null;
  if (newSha) {
    console.log(chalk[logColour](`[${repoName}] Add commit ${newSha} in branch ${commitResult.branch}: ${JSON.stringify(commitResult.summary)}`));
  } else {
    console.log(chalk[logColour](`[${repoName}] Nothing to commit - head is still at ${await latestCommit(git)}`));
  }
}

async function latestCommit(git) {
  const gitLog = await git.log();
  return ((gitLog.all || [])[0] || {}).hash;
}
