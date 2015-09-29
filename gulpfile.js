var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var del = require('del');
var es = require('event-stream');
var bowerFiles = require('main-bower-files');
var browserSync = require('browser-sync');
// If you use jade in your project you must set varible 'useJade' equal 'TRUE'
var useJade = true;
// ==
// == PATH STRINGS ========
var paths = {
  scripts: 'app/**/*.js',
  styles: ['./app/scss/**/*.css', './app/scss/**/*.scss'],
  images: './app/img/**/*',
  index: './app/index.html',
  indexJade: './app/index.jade',
  partials: ['app/**/*.html', '!app/index.html'],
  partialsJade: ['app/**/*.jade', '!app/index.jade'],
  distDev: './dist.dev',
  distProd: './dist.prod',
  distDevCss: './dist.dev/css',
  distProdCss: './dist.prod/css',
  distDevImg: './dist.dev/img',
  distScriptsProd: './dist.prod/scripts',
  scriptsDevServer: 'devServer/**/*.js'
};
// ==
// == PIPE SEGMENTS ========
var pipes = {};
// Sort scripts first jquery
pipes.orderedVendorScripts = function() {
  return plugins.order(['jquery.js', 'angular.js']);
};
// Build bower script and move in dist folder
pipes.builtVendorScriptsDev = function() {
  return gulp.src(bowerFiles())
    .pipe(gulp.dest(paths.distDev + '/bower_components'));
};
// Validate script on jshint
pipes.validatedAppScripts = function() {
  return gulp.src(paths.scripts)
      .pipe(plugins.jshint())
      .pipe(plugins.jshint.reporter('jshint-stylish'));
};
// Build index.jsde file or copy index.html
pipes.buildIndexFile = function() {
  var indexPath;
  if (useJade) {
    indexPath = paths.indexJade;
    return gulp.src(indexPath)
        .pipe(plugins.plumber({
          errorHandler: function (error) {
            console.log(error.message);
            this.emit('end');
          }}))
        .on('error', log)
        .pipe(plugins.jade())
        .pipe(plugins.prettify({indent_size: 2}))
  } else {
    indexPath = paths.index;
    return gulp.src(indexPath);
  }
};
// Build App script and move to dev
pipes.builtAppScriptsDev = function() {
  return pipes.validatedAppScripts()
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.concat('app.js'))
    .pipe(gulp.dest(paths.distDev));
};
// Build style scss file
pipes.builtStylesDev = function() {
    return gulp.src('./app/scss/**/*.scss')
      .pipe(plugins.plumber({
        errorHandler: function (error) {
          console.log(error.message);
          this.emit('end');
        }}))
      .on('error', log)
      .pipe(plugins.compass({
          sourcemap: true,
          css: './dist.dev/css/',
          sass: './app/scss/',
          image: './app/img/',
          require: ['compass', 'singularitygs']
      }))
      .pipe(plugins.cssUrlAdjuster({
        replace:  ['../../app/img','../img/']
      }))
      .pipe(gulp.dest(paths.distDev + '/css/'));
};
// Builde all others jade file or copy html files
pipes.builtPartialsFilesDev = function() {
  var partialsPath;
  if (useJade) {
    partialsPath = paths.partialsJade;
    return gulp.src(partialsPath)
        .pipe(plugins.plumber())
        .pipe(plugins.jade())
        .pipe(plugins.prettify({indent_size: 2}))
        .pipe(gulp.dest(paths.distDev));
  } else {
    partialsPath = paths.partials;
    return gulp.src(partialsPath)
        .pipe(plugins.htmlhint({'doctype-first': false}))
        .pipe(plugins.htmlhint.reporter())
        .pipe(gulp.dest(paths.distDev));
  }
};
// Copy images files
pipes.processedImagesDev = function() {
  return gulp.src(paths.images)
      .pipe(gulp.dest(paths.distDev + '/img/'));
};
// Build all project
pipes.builtIndexDev = function() {

  var orderedVendorScripts = pipes.builtVendorScriptsDev()
    .pipe(pipes.orderedVendorScripts());

  var orderedAppScripts = pipes.builtAppScriptsDev();

  var appStyles = pipes.builtStylesDev();

  return pipes.buildIndexFile()
    .pipe(gulp.dest(paths.distDev)) // write first to get relative path for inject
    .pipe(plugins.inject(orderedVendorScripts, {relative: true, name: 'bower'}))
    .pipe(plugins.inject(orderedAppScripts, {relative: true}))
    .pipe(plugins.inject(appStyles, {relative: true}))
    .pipe(gulp.dest(paths.distDev));
};
// Set stream
pipes.builtAppDev = function() {
  return es.merge(pipes.builtIndexDev(), pipes.builtPartialsFilesDev(), pipes.processedImagesDev());
};
// ==
// ==
// == TASKS ========
// Error
var log = function (error) {
  console.log([
    '',
    "----------ERROR MESSAGE START----------",
    ("[" + error.name + " in " + error.plugin + "]"),
    error.message,
    "----------ERROR MESSAGE END----------",
    ''
  ].join('\n'));
  this.end();
};
// removes all compiled dev files
gulp.task('clean-dev', function() {
  return del(paths.distDev);
});
// removes all compiled prod files
gulp.task('clean-prod', function() {
  return del(paths.distProd);
});
// moves vendor scripts into the dev environment
gulp.task('build-vendor-scripts-dev', pipes.builtVendorScriptsDev);

// validates and injects sources into index.html or index.jade and moves into to the dev environment
gulp.task('build-index-dev', pipes.builtIndexDev);

// checks html or jade source files for syntax errors and moves into the dev enviroment
gulp.task('build-partials-files-dev', pipes.builtPartialsFilesDev);

// moves app scripts into the dev environment
gulp.task('build-app-scripts-dev', pipes.builtAppScriptsDev);

// cleans and builds a complete dev environment
gulp.task('built-app-dev', pipes.builtAppDev);

// cleans and builds a complete dev environment
gulp.task('built-style-dev', pipes.builtStylesDev);

// cleans and builds a complete dev environment
gulp.task('clean-build-app-dev', ['clean-dev'], pipes.builtAppDev);

// build, and watch live changes to the dev environment
gulp.task('watch-dev', ['clean-build-app-dev'], function() {
  var indexPath, partialsPath;
  if (useJade) {
    indexPath = paths.indexJade;
    partialsPath = paths.partialsJade;
  } else {
    indexPath = paths.index;
    partialsPath = paths.partials;
  }
  // start browser-sync to auto-reload the dev server
  browserSync({
      port: 8000,
      server: {
        baseDir: paths.distDev
      }
    });

  var reload = browserSync.reload;

  // watch index
  gulp.watch(indexPath, function() {
    return pipes.builtIndexDev()
        .pipe(reload({stream: true}));
  });

  // watch app scripts
  gulp.watch(paths.scripts, function() {
    return pipes.builtAppScriptsDev()
        .pipe(reload({stream: true}));
  });

  // watch html partials
  gulp.watch(partialsPath, function() {
    return pipes.builtPartialsFilesDev()
        .pipe(reload({stream: true}));

  });

  // watch styles
  gulp.watch(paths.styles, function() {
    return pipes.builtStylesDev()
        .pipe(reload({stream: true}));
  });

  // watch images
  gulp.watch(paths.images, function() {
    return pipes.processedImagesDev()
        .pipe(reload({stream: true}));
  });

});
// Start command gulp... We look in dev folder!
gulp.task('default', ['watch-dev']);