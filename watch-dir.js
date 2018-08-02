const fs = require('fs');
const path = require('path');
const util = require('util');
const delay = require('./delay');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

module.exports = watchDir;

async function* watchDir(dir) {
    let oldStatsMap = {};
    while (true) {
        await delay(1000);
        const files = await readdir(dir);
        const newStatsMap = await createStatsMap(dir, files);
        const statsDelta = computeStatsDelta(oldStatsMap, newStatsMap);
        if (Object.keys(statsDelta).length > 0) {
            oldStatsMap = newStatsMap;
            yield statsDelta;
        }
    }
}

async function createStatsMap(dir, files) {
    const statsList = await Promise.all(files.map(file => stat(path.join(dir, file))));
    return Object.assign(
        {},
        ...statsList.map((fileStat, i) => ({ [files[i]]: fileStat })),
    );
}

function computeStatsDelta(oldStatsMap, newStatsMap) {
    if (!oldStatsMap) {
        return newStatsMap || {};
    }
    if (!newStatsMap) {
        return oldStatsMap;
    }
    const files = Object.keys(newStatsMap);
    return Object.assign(
        {},
        ...files
            .filter(isFileChanged(oldStatsMap, newStatsMap))
            .map(file => ({ [file]: newStatsMap[file] })),
    );
}

function isFileChanged(oldStatsMap, newStatsMap) {
    return (file) => {
        const oldStat = oldStatsMap[file];
        const newStat = newStatsMap[file];
        if (!oldStat || !newStat) {
            return true;
        }
        return oldStat.mtimeMs !== newStat.mtimeMs;
    };
}