var gulp = require('gulp');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var exit = require('gulp-exit');

var paths = {
    tests: [
        './tests/**/*.js'
    ]
}

gulp.task('test', function() {
    return gulp.src([
        './index.js',
        ])
        // Right there
        .pipe(istanbul({includeUntested: true}))
        // .pipe(istanbul())
        .pipe(istanbul.hookRequire())
        .on('finish', function () {
            // gulp.src(paths.tests, {
            gulp.src(['./tests'], {
                read: false
            })
            .pipe(mocha({
                recursive: true,
                reporter: 'spec',
                ui: 'bdd'
            }))
            // Creating the reports after tests ran
            .pipe(istanbul.writeReports())
            // Enforce a coverage of at least 90%
            //.pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }))
            .pipe(exit())
            .on('error', gutil.log);
        });
});

gulp.task('default', ['test']);
