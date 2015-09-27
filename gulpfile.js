var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var del = require('del');
var bowerFiles = require('main-bower-files');

// == PATH STRINGS ========

var paths = {
  scripts: 'app/**/*.js',
  styles: ['./app/**/*.css', './app/**/*.scss'],
  images: './img/**/*',
  index: './app/index.html',
  partials: ['app/**/*.html', '!app/index.html'],
  distDev: './dist.dev',
  distProd: './dist.prod',
  distScriptsProd: './dist.prod/scripts',
  scriptsDevServer: 'devServer/**/*.js'
};

// == PIPE SEGMENTS ========

var pipes = {};

pipes.orderedVendorScripts = function() {
  return plugins.order(['jquery.js', 'angular.js']);
};

pipes.builtVendorScriptsDev = function() {
  return gulp.src(bowerFiles())
    .pipe(gulp.dest(paths.distDev + '/bower_components'));
};

pipes.builtAppScriptsDev = function() {
  return gulp.src(paths.scripts)
    .pipe(plugins.concat('app.js'))
    .pipe(gulp.dest(paths.distDev));
};

pipes.builtIndexDev = function() {

  var orderedVendorScripts = pipes.builtVendorScriptsDev()
    .pipe(pipes.orderedVendorScripts());

  var orderedAppScripts = pipes.builtAppScriptsDev();

  return gulp.src(paths.index)
    .pipe(gulp.dest(paths.distDev)) // write first to get relative path for inject
    .pipe(plugins.inject(orderedVendorScripts, {relative: true, name: 'bower'}))
    .pipe(plugins.inject(orderedAppScripts, {relative: true}))
    .pipe(gulp.dest(paths.distDev));
};

// == TASKS ========

// moves vendor scripts into the dev environment
gulp.task('build-vendor-scripts-dev', pipes.builtVendorScriptsDev);

// validates and injects sources into index.html and moves it to the dev environment
gulp.task('build-index-dev', pipes.builtIndexDev);

// moves app scripts into the dev environment
gulp.task('build-app-scripts-dev', pipes.builtAppScriptsDev);