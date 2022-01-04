'use strict';

const { partialClone } = require('./build_steps/partial_clone');
const { clone } = require('./build_steps/clone');
const { createPackagejson, getVersionFromGit } = require('./build_steps/create_packagejson');
const { buildRepository } = require('./build_steps/build_repository');
const { uploadBuild } = require('./build_steps/upload_build');
const { parsePackageInfo } = require('./build_steps/parse_package_info');

function processBuild (repoFullName, gitUrl, repoPrefix, buildPrefix) {
	const buildDir = `${buildPrefix}/${repoFullName}`;
	const repoDir = `${repoPrefix}/${repoFullName}`;
	const launcherDir = `${repoPrefix}/spring-launcher`;

	const buildInfo = makeBuild(repoFullName, gitUrl, repoDir, launcherDir, buildDir, true);
	uploadBuild(buildDir, repoFullName, buildInfo);
	return buildInfo;
}

function makeBuild (repoFullName, gitUrl, repoDir, launcherDir, buildDir, useGenericBackend) {
	const buildInfo = prepareForBuild(repoFullName, gitUrl, repoDir, launcherDir, useGenericBackend);
	buildRepository(repoDir, launcherDir, buildDir, buildInfo, !useGenericBackend);
	return buildInfo;
}

function prepareForBuild (repoFullName, gitUrl, repoDir, launcherDir, useGenericBackend) {
	console.log('Cloning repositories...');

	partialClone(gitUrl, repoDir, 'dist_cfg');
	clone('https://github.com/beyond-all-reason/spring-launcher.git', launcherDir);

	console.log('Creating package.json...');
	const version = getVersionFromGit(repoDir);
	console.log(`Version: ${version}`);
	createPackagejson(launcherDir, repoDir, repoFullName, version, useGenericBackend);

	const packageInfo = parsePackageInfo(repoDir);
	for (const downloadLink of packageInfo.downloadLinks) {
		downloadLink.link = `${repoFullName}/${downloadLink.link}`;
	}

	return {
		packageInfo: packageInfo,
		version: version
	};
}

module.exports = {
	processBuild: processBuild,
	makeBuild: makeBuild,
	prepareForBuild: prepareForBuild
};
