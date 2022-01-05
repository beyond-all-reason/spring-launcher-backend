'use strict';

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

function buildRepository (repoDir, launcherDir, buildDir, buildInfo, shouldPublish) {
	console.log('Starting the build...');

	const packageInfo = buildInfo.packageInfo;
	const version = buildInfo.version;
	const buildTypes = packageInfo.buildTypes;
	const artifactBaseNameWithVersion = `${packageInfo.artifactBaseName}-${version}`;

	fs.removeSync(buildDir);
	fs.ensureDirSync(buildDir);
	fs.copySync(launcherDir, buildDir);
	fs.copySync(path.join(repoDir, 'dist_cfg'), path.join(buildDir, 'src'));
	copyIfExists(path.join(repoDir, 'dist_cfg/bin'), path.join(buildDir, 'bin'));
	copyIfExists(path.join(repoDir, 'dist_cfg/files'), path.join(buildDir, 'files'));
	copyIfExists(path.join(repoDir, 'dist_cfg/build'), path.join(buildDir, 'build'));
	fs.removeSync(path.join(buildDir, 'src/bin'));
	fs.copySync(path.join(repoDir, 'package.json'), path.join(buildDir, 'package.json'));
	execSync('npm install', { cwd: buildDir });
	execSync('npm ci', { cwd: buildDir });
	if (buildTypes.includes('linux')) {
		execSync(`npm run build-linux ${shouldPublish ? '-- --publish always' : ''}`, { cwd: buildDir, stdio: "inherit"});
	}
	if (buildTypes.includes('windows-portable')) {
		execSync('npm run build-win-portable', { cwd: buildDir });
		fs.moveSync(
			path.join(buildDir, `dist/${artifactBaseNameWithVersion}.exe`),
			path.join(buildDir, `dist/${artifactBaseNameWithVersion}-portable.exe`)
		);
	}
	if (buildTypes.includes('windows')) {
		execSync(`npm run build-win ${shouldPublish ? '-- --publish always' : ''}`, { cwd: buildDir });
	}
}

function copyIfExists (src, dest) {
	if (fs.existsSync(src)) {
		fs.copySync(src, dest);
	}
}

module.exports = {
	buildRepository: buildRepository
};
