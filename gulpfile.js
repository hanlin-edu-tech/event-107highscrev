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

function buildScript(){
    return es.map(function(file, cb){
        var bundle = browserify({extensions : ['.coffee']});
        bundle.transform(coffeeify, {bare : false, header : true});
        bundle.add(file.path);
        bundle.bundle(function(error, result){
            if(error != null){
                console.log(error);
                throw error;
            }
            file.contents = new Buffer(result);
            cb(null, file);
        });
    });
}

function buildStyle(){
    return es.map(function(file, cb){
        less.render(
            file.contents.toString(), {
                paths : [],
                filename : file.path,
                compress : false
            },
            function(error, result){
                if(error != null){
                    console.log(error);
                    throw error;
                }
                file.contents = new Buffer(result.css);
                cb(null, file);
            }
        );
    });
}

function scriptTask(dest){
    return function(){
        return gulp.src('src/coffee/*.coffee')
            .pipe(buildScript())
            .pipe(rename({extname:'.js'}))
            .pipe(gulp.dest(dest));};
}

function styleTask(dest){
    return function(){
        return gulp.src('src/less/*.less')
            .pipe(buildStyle())
            .pipe(rename({extname:'.css'}))
            .pipe(gulp.dest(dest));};
}

function cleanTask(){
    return del([
        'dist',
        'src/js',
        'src/css']);
}

function copyImgTask(){
    return gulp.src('src/img/*')
        .pipe(gulp.dest('dist/img'));
}

function copyHtmlTask(){
    return gulp.src('src/**.html')
        .pipe(gulp.dest('dist'));
}


gulp.task('clean', cleanTask);

gulp.task('script', scriptTask('src/js'));
gulp.task('style', styleTask('src/css'));
gulp.task('build', ['script', 'style']);

gulp.task('watch', function() {
  gulp.watch('src/coffee/*.coffee', ['script']);
  gulp.watch('src/less/*.less', ['style']);
});

gulp.task('package', function(){
    var deferred = Q.defer();
    Q.fcall(function(){return util.logPromise(cleanTask)})
    .then(function(){return Q.all([
        util.logStream(copyHtmlTask),
        util.logStream(copyImgTask),
        util.logStream(scriptTask('dist/js')),
        util.logStream(styleTask('dist/css'))])});
    return deferred.promise;
});
