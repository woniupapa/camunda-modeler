'use strict';

/**
 * This tool generates `.wiredeps` file from currently installed modules.
 * Based on organisations and other
 */



var childProcess = require('child_process'),
    fs = require('fs'),
    _ = require('lodash'),
    request = require('request'),
    async = require('async');


function getNextPage(linkHeader) {
  if (!linkHeader) {
    return;
  }

  var links = linkHeader.split(',');
  links = _.map(links, (link) => {
    return link.split(';');
  });

  var next = _.find(links, (link) => {
    return link[1] === ' rel="next"';
  });

  if (!next) {
    return;
  }

  return next[0].substring(1, next[0].length - 1);
}


function createGetRepositoriesTask(organisation, url) {
  return (done) => {
    var opts = {
      url: url || `https://api.github.com/orgs/${organisation}/repos`,
      json: true,
      headers: {
        'User-Agent': 'request'
      }
    };

    request(opts, (err, res, body) => {
      if (err || res.statusCode !== 200) {
        throw err;
        return done(err);
      }

      var repos = _.map(body, function(r) {
        return {
          name: r.name,
          fullName: r.full_name
        };
      });

      var linkHeader = res.headers['link'];

      var nextUrl = getNextPage(linkHeader);

      if (nextUrl) {
        return createGetRepositoriesTask(organisation, nextUrl)((nextErr, nextRepos) => {
          if (nextErr) {
            return done(nextErr);
          }

          done(null, _.unionBy(repos, nextRepos, 'name'));
        });
      }

      return done(null, repos);
    });
  };
}


function getRepositories(organisations, cb) {
  var orgTasks = _.map(organisations, (org) => {
    return createGetRepositoriesTask(org);
  });

  async.parallel(orgTasks, (err, results) => {
    if (err) {
      throw err;

      return cb(err);
    }

    var repos = _.flatten(results);

    cb(null, repos);
  });
}


function processDependencies(dependencies, repositories) {
  _.each(dependencies, (d, name) => {
    // remove 'resolved' and rely on 'version' instead
    delete d.resolved;
    // remove
    delete d.from;

    // replace modules with snapshots
    if (_.includes(_.map(repositories, 'name'), name)) {
      d.version = _.find(repositories, { name: name }).fullName;
    }

    if (d.dependencies) {
      processDependencies(d.dependencies, repositories);
    }
  });
}


function removeShrinkwrap(shrinkwrapPath) {
  try {
    fs.unlinkSync(shrinkwrapPath);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.log(e);
      process.exit(1);
    }
  }
}

function run(config) {
  var shrinkwrapPath = `${config.projectPath}/npm-shrinkwrap.json`;

  // changin working directory
  process.chdir(config.projectPath);

  // remove shrinkwrap
  removeShrinkwrap(shrinkwrapPath);

  // generate shrinkwrap with DEV
  childProcess.execSync('npm shrinkwrap --dev');

  // load generated file
  var shrinkwrap = require(shrinkwrapPath);

  // check for dependencies to transform to git version
  getRepositories(config.githubOrganisations, (err, repositories) => {
    if (err) {
      throw err;
    }

    // join remote and config repositories
    repositories = _.unionBy(config.repositories, repositories, 'name');

    // process each of the dependencies
    processDependencies(shrinkwrap.dependencies, repositories);

    // write file back
    fs.writeFileSync(`${config.projectPath}/.wiredeps`, JSON.stringify(shrinkwrap, null, '  '), 'utf8');

    // cleanup
    removeShrinkwrap(shrinkwrapPath);
  });
}


run({
  githubOrganisations: [
    // 'bpmn-io',
    // 'camunda'
  ],
  repositories: require('./repos.json'),
  projectPath: `${__dirname}/..`
});