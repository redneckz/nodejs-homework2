const watchDir = require('./watch-dir');

(async (dir) => {
    for await (const delta of watchDir(dir)) {
        console.log(delta);
    }
})(process.argv[2]);
