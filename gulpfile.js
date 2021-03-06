var gulp = require('gulp');
var rename = require("gulp-rename");
var fs = require('fs');
var es = require('event-stream');
var del = require('del');
var path = require('path');
var Q = require('q');
var util = require('gulp-template-util');

var browserify = require('browserify');
var coffeeify = require('coffeeify');
var less = require('less');
var pug = require('pug');


const gcPub = require("gulp-gcloud-publish");
const bucketNameForTest = "tutor-test-events";
const bucketNameForProd = "tutor-events";
const projectId = "tutor-204108";
const projectIdTest = "tutor-test-238709";
const keyFileName = "tutor.json";
const keyFileNameTest = "tutor-test.json";
const projectName = "";


let uploadGCSProd = bucketName => {
    return gulp
        .src(["dist/**"], {
            base: `${__dirname}/dist/`
        })
        .pipe(
            gcPub({
                bucket: bucketName,
                keyFilename: keyFileName,
                base: projectName,
                projectId: projectId,
                public: true,
                metadata: {
                    cacheControl: "no-cache, no-transform, public"
                }
            })
        );
};

let uploadGCSTest = bucketName => {
    return gulp
        .src(["dist/**"], {
            base: `${__dirname}/dist/`
        })
        .pipe(
            gcPub({
                bucket: bucketName,
                keyFilename: keyFileNameTest,
                base: projectName,
                projectId: projectIdTest,
                public: true,
                metadata: {
                    cacheControl: "no-store, no-transform, public"
                }
            })
        );
};

function buildHtml() {
    return es.map(function (file, cb) {
        file.contents = new Buffer(pug.renderFile(
            file.path, {
            filename: file.path,
            pretty: "    "
        }
        ));
        cb(null, file);
    });
}

function buildScript() {
    return es.map(function (file, cb) {
        var bundle = browserify({ extensions: ['.coffee'] });
        bundle.transform(coffeeify, { bare: false, header: true });
        bundle.add(file.path);
        bundle.bundle(function (error, result) {
            if (error != null) {
                console.log(error);
                throw error;
            }
            file.contents = new Buffer(result);
            cb(null, file);
        });
    });
}

function buildStyle() {
    return es.map(function (file, cb) {
        less.render(
            file.contents.toString(), {
            paths: [],
            filename: file.path,
            compress: false
        },
            function (error, result) {
                if (error != null) {
                    console.log(error);
                    throw error;
                }
                file.contents = new Buffer(result.css);
                cb(null, file);
            }
        );
    });
}

function libTask(dest) {
    return function () {
        var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8').toString());
        if (!packageJson.dependencies) {
            packageJson.dependencies = {};
        }
        var webLibModules = [];
        for (var module in packageJson.dependencies) {
            webLibModules.push('node_modules/' + module + '/**/*');
        }
        return gulp.src(webLibModules, { base: 'node_modules/' })
            .pipe(gulp.dest(dest));
    };
}

function htmlTask(dest) {
    return function () {
        return gulp.src('src/pug/**/*.pug')
            .pipe(buildHtml())
            .pipe(rename({ extname: '.html' }))
            .pipe(gulp.dest(dest));
    };
}

function scriptTask(dest) {
    return function () {
        return gulp.src('src/coffee/**/*.coffee')
            .pipe(buildScript())
            .pipe(rename({ extname: '.js' }))
            .pipe(gulp.dest(dest));
    };
}

function styleTask(dest) {
    return function () {
        return gulp.src('src/less/*.less')
            .pipe(buildStyle())
            .pipe(rename({ extname: '.css' }))
            .pipe(gulp.dest(dest));
    };
}

function cleanTask() {
    return del([
        'dist',
        'src/**/*.html',
        'src/js',
        'src/css']);
}

function copyImgTask() {
    return gulp.src('src/img/**/*')
        .pipe(gulp.dest('dist/event/107highscrev/img'));
}

function copyHtmlTask() {
    return gulp.src('src/**/*.html')
        .pipe(gulp.dest('dist/event/107highscrev'));
}


gulp.task('clean', cleanTask);

gulp.task('html', htmlTask('src'));
gulp.task('script', scriptTask('src/js'));
gulp.task('style', styleTask('src/css'));
gulp.task('lib', libTask('src/lib'))
gulp.task('build', ['html', 'script', 'style', 'lib']);

gulp.task('watch', function () {
    gulp.watch('src/pug/**/*.pug', ['html']);
    gulp.watch('src/coffee/**/*.coffee', ['script']);
    gulp.watch('src/less/**/*.less', ['style']);
});

gulp.task('package', function () {
    var deferred = Q.defer();
    Q.fcall(function () { return util.logPromise(cleanTask) })
        .then(function () {
            return Q.all([
                util.logStream(copyImgTask),
                util.logStream(libTask('dist/event/107highscrev/lib')),
                util.logStream(htmlTask('dist/event/107highscrev')),
                util.logStream(scriptTask('dist/event/107highscrev/js')),
                util.logStream(styleTask('dist/event/107highscrev/css'))])
        });
    return deferred.promise;
});

gulp.task("uploadGcsTest", uploadGCSTest.bind(uploadGCSTest, bucketNameForTest));
gulp.task("uploadGcsProd", uploadGCSProd.bind(uploadGCSProd, bucketNameForProd));
