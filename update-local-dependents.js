const chalk = require('chalk');
const lib = require('./index');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
let status;
let hasChangesToCommit;
let gitLog;
let localAddonCommitResult;
const results = [];
const amendConsuming = lib.getNamedArgVal('--amend-consuming');
const amendConsumingNoEdit = lib.getNamedArgVal('--amend-consuming') === 'no-edit' ? true : false;
const pushParentPackage = lib.getNamedArgVal('--push-hea') === 'true' ? true : false;
const commitParentPackage = lib.getNamedArgVal('--commit-hea') === 'true' || pushParentPackage ? true : false;
const updateParentPackage = lib.getNamedArgVal('--update-hea') === 'true' || commitParentPackage ? true : false;
const pushLocalAddons = lib.getNamedArgVal('--push-local-addons') === 'true' ? true : false;
module.exports = async function (localConfig) {
  if (lib.argExists('--help')) {
    // printHelp();
    return;
  }
  localConfig.hostAddonName = path.basename(localConfig.parentPackagePath);
  try {
    const hostAddonDir = path.resolve(process.cwd());
    const hostAddonGit = simpleGit({
      baseDir: hostAddonDir,
    });
    const currentHeaBranch = (await hostAddonGit.branch()).current;
    const branchLockItem = localConfig.branchLock.find((item) => item[localConfig.hostAddonName].trim() === currentHeaBranch);
    if (!branchLockItem) {
      console.log(chalk.cyan(`Stopping as no branch lock entry exists for branch ${currentHeaBranch} in ${localConfig.hostAddonName}.`));
      return;
    }
    console.log(chalk.white('[ -----------------------Branch lock----------------------- ]'));
    console.log(chalk.white('The following is a breakdown of which branches will be updated in the listed repos.'));
    console.log(chalk.white(JSON.stringify(branchLockItem, null, 2)));

    console.log(chalk.white('[ -----------------------Preliminary checks started----------------------- ]'));

    await initialiseRepo(localConfig.hostAddonName, hostAddonGit, 'cyan', branchLockItem, localConfig);
    const localAddons = [];
    const localAddonsFiltered = localConfig.localDependents.filter((item) => !item.skip);
    for (const item of localAddonsFiltered) {
      const repoPath = path.resolve(process.cwd(), item.repo);
      item.repo = repoPath;
      item.name = path.basename(item.repo);
      item.packageName = item.packageName || path.basename(repoPath);
      item.git = simpleGit({
        baseDir: repoPath,
      });
      await initialiseRepo(item.name, item.git, 'blue', branchLockItem, localConfig);
      localAddons.push(item);
    }

    console.log(chalk.white('[ -----------------------Preliminary checks completed----------------------- ]'));

    for (const localAddon of localAddons) {
      try {
        status = await localAddon.git.status();
        hasChangesToCommit = status.files.length > 0;
        gitLog = await localAddon.git.log();
        if (!hasChangesToCommit) {
          console.log(chalk.blue(`[${localAddon.name}] Nothing to commit - ParentPackageD is still at ${gitLog.latest.hash}`));
        } else {
          await localAddon.git.add('.');
          console.log(chalk.blue(`[${localAddon.name}] Added untracked files`));
          const commitOptions = {};
          if (amendConsuming) {
            commitOptions['--amend'] = true;
          }
          if (amendConsumingNoEdit) {
            commitOptions['--no-edit'] = true;
            localAddonCommitMessage = [];
          }
          let localAddonCommitMessage = localAddon.commitMessage;
          if (!localAddonCommitMessage) {
            localAddonCommitMessage = localConfig.parentPackageCommitMessage;
            console.log(chalk.yellow(`The consuming app did not have a commitMessage, using parentPackageCommitMessage as the commit message for ${localAddon.name}.`));
          }
          localAddonCommitResult = await localAddon.git.commit(localAddonCommitMessage, commitOptions);
          await commitFeedback(localAddon.name, localAddonCommitResult, 'blue', localAddon.git);
        }
        const pushOptions = [];
        if (amendConsuming || amendConsumingNoEdit) {
          pushOptions.push('-f');
        }

        if (pushLocalAddons) {
          const push = await localAddon.git.push(pushOptions);
          const pushMessage = (push.pushed[0] || {}).alreadyUpdated ? 'Already pushed' : 'Pushed code';
          console.log(chalk.blue(`[${localAddon.name}] ${pushMessage}}`));
        } else {
          console.log(chalk.blue(`[${localAddon.name}] code committed but not pushed.`));
        }

        const result = {
          app: localAddon.name,
          hash: await latestCommit(localAddon.git),
        };
        if ((updateParentPackage || pushParentPackage) && localAddon.packageName) {
          updateParentPackageFunc(localAddon, await latestCommit(localAddon.git), localConfig);
          result.heaUpdated = true;
        }
        results.push(result);
      } catch (err) {
        console.log(chalk.red(err));
      }
    }

    if (commitParentPackage || pushParentPackage) {
      await commitParentPackageFunc(hostAddonGit, localConfig);
    }

    if (pushParentPackage) {
      await pushParentPackageFunc(hostAddonGit, localConfig);
    }

    if (!results.length) {
      console.log(chalk.yellow('No consuming apps were updated'));
      return;
    }

    console.log('RESULT');
    console.log(results);
    console.log('SKIPPED');
    const localAddonsSkippedGit = [];
    const localAddonsSkipped = localConfig.localDependents.filter((item) => item.skip);
    for (const item of localAddonsSkipped) {
      const repoPath = path.resolve(process.cwd(), item.repo);
      item.name = path.basename(item.repo);
      item.git = simpleGit({
        baseDir: repoPath,
      });
      localAddonsSkippedGit.push({
        app: path.basename(item.repo),
        latestlocalHash: await latestCommit(item.git),
      });
    }
    console.log(localAddonsSkippedGit);
  } catch (err) {
    console.log(chalk.red(err));
  }
};

function updateParentPackageFunc(localAddon, sha, localConfig) {
  const heaPackageFilePath = path.resolve(localConfig.parentPackagePath, 'package.json');
  const heaPackageFile = require(heaPackageFilePath);
  const localAddonPackageLink = heaPackageFile.dependencies[localAddon.packageName].split('#')[0];
  heaPackageFile.dependencies[localAddon.packageName] = `${localAddonPackageLink}#${sha}`;
  fs.writeFileSync(heaPackageFilePath, JSON.stringify(heaPackageFile, null, 2));
  console.log(chalk.cyan(`[${localConfig.hostAddonName}] Updated hash of ${localAddonPackageLink} to ${sha}`));
}

async function commitParentPackageFunc(hostAddonGit, localConfig) {
  await hostAddonGit.add('.');
  console.log(chalk.cyan(`[${localConfig.hostAddonName}] Added untracked files`));
  const heaCommitResult = await hostAddonGit.commit(localConfig.parentPackageCommitMessage);
  await commitFeedback(localConfig.hostAddonName, heaCommitResult, 'cyan', hostAddonGit);
}

async function pushParentPackageFunc(hostAddonGit, localConfig) {
  const hostAddonPush = await hostAddonGit.push();
  const hostAddonPushMessage = (hostAddonPush.pushed[0] || {}).alreadyUpdated ? 'Already pushed' : 'Pushed code';
  console.log(chalk.cyan(`[${localConfig.hostAddonName}] ${hostAddonPushMessage}`));
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
      throw `[${appName}] Error - the branch lock entry which includes ${localConfig.hostAddonName}: ${branchLockItem[localConfig.hostAddonName]}" does not specify a branch for ${appName}.`;
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
