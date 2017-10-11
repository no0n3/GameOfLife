var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var inject = require("gulp-inject");
var ngHtml2Js = require("gulp-ng-html2js");

var buildDir = 'web';
var jsDest  = buildDir + '/js/';
var cssDest = buildDir + '/css/';

gulp.task('js', function() {
    gulp
        .src([
            'bower_components/angular/angular.min.js',
            'bower_components/angular-route/angular-route.min.js',
            'bower_components/hammerjs/hammer.min.js',
            'bower_components/angular-gestures/gestures.min.js',
            'src/app/app.js',
            'src/app/app.constants.js',
            'src/app/controllers/main.controller.js',
            'src/app/services/rest.service.js',
        ])
        .pipe(concat('all.js'))
        // .pipe(uglify())
        .pipe(gulp.dest(jsDest));
});

gulp.task('css', function() {
    gulp
        .src([
            'bower_components/components-font-awesome/css/font-awesome.min.css',
            'bower_components/font-awesome/css/font-awesome.min.css',
            'bower_components/bootstrap/dist/css/bootstrap.min.css',
            'node_modules/bootstrap/dist/css/bootstrap.min.css',
            'src/css/app.css',
        ])
        .pipe(concat('all.css'))
        .pipe(gulp.dest(cssDest));
});

gulp.task('build', ['js', 'css']);
