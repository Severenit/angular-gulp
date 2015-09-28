var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var del = require('del');
var es = require('event-stream');
var bowerFiles = require('main-bower-files');
var browserSync = require('browser-sync');
// If you jade in your project you must set varible 'usedJade' equal 'TRUE'
var usedJade = true;
// ==
// ==
// == PATH STRINGS ========
var paths = {
  scripts: 'app/**/*.js',
  styles: ['./app/**/*.css', './app/**/*.scss'],
  images: './img/**/*',
  index: './app/index.html',
  indexJade: './app/index.jade',
  partials: ['app/**/*.html', '!app/index.html'],
  partialsJade: ['app/**/*.jade', '!app/index.jade'],
  distDev: './dist.dev',
  distProd: './dist.prod',
  distScriptsProd: './dist.prod/scripts',
  scriptsDevServer: 'devServer/**/*.js'
};
// ==
// ==
// == PIPE SEGMENTS ========
var pipes = {};

pipes.orderedVendorScripts = function() {
  return plugins.order(['jquery.js', 'angular.js']);
};

pipes.builtVendorScriptsDev = function() {
  return gulp.src(bowerFiles())
    .pipe(gulp.dest(paths.distDev + '/bower_components'));
};

pipes.validatedAppScripts = function() {
  return gulp.src(paths.scripts)
      .pipe(plugins.jshint())
      .pipe(plugins.jshint.reporter('jshint-stylish'));
};

pipes.validatedIndex = function() {
  var indexPath;
  if (usedJade) {
    indexPath = paths.indexJade;
    return gulp.src(indexPath)
        .pipe(plugins.plumber())
        .pipe(plugins.jade())
        .pipe(plugins.prettify({indent_size: 2}))
  } else {
    indexPath = paths.index;
    return gulp.src(indexPath);
  }
};

pipes.builtAppScriptsDev = function() {
  return pipes.validatedAppScripts()
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.concat('app.js'))
    .pipe(gulp.dest(paths.distDev));
};

pipes.builtPartialsFilesDev = function() {
  var partialsFiles;
  if (usedJade) {
    partialsFiles = paths.partialsJade;
    return gulp.src(partialsFiles)
        .pipe(plugins.plumber())
        .pipe(plugins.jade())
        .pipe(plugins.prettify({indent_size: 2}))
        .pipe(gulp.dest(paths.distDev));
  } else {
    partialsFiles = paths.partials;
    return gulp.src(partialsFiles)
        .pipe(plugins.htmlhint({'doctype-first': false}))
        .pipe(plugins.htmlhint.reporter())
        .pipe(gulp.dest(paths.distDev));
  }
};

pipes.processedImagesDev = function() {
  return gulp.src(paths.images)
      .pipe(gulp.dest(paths.distDev + '/img/'));
};

pipes.builtIndexDev = function() {

  var orderedVendorScripts = pipes.builtVendorScriptsDev()
    .pipe(pipes.orderedVendorScripts());

  var orderedAppScripts = pipes.builtAppScriptsDev();

  return pipes.validatedIndex()
    .pipe(gulp.dest(paths.distDev)) // write first to get relative path for inject
    .pipe(plugins.inject(orderedVendorScripts, {relative: true, name: 'bower'}))
    .pipe(plugins.inject(orderedAppScripts, {relative: true}))
    .pipe(gulp.dest(paths.distDev));
};

pipes.builtAppDev = function() {
  return es.merge(pipes.builtIndexDev(), pipes.builtPartialsFilesDev(), pipes.processedImagesDev());
};
// ==
// ==
// == TASKS ========

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
gulp.task('builts-app-dev', pipes.builtAppDev);

// build, and watch live changes to the dev environment
gulp.task('watch-dev', ['builts-app-dev'], function() {
  var indexPath, partialsPath;
  if (usedJade) {
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
  //gulp.watch(paths.styles, function() {
  //  return pipes.builtStylesDev()
  //      .pipe(plugins.livereload());
  //});

});
// Start command gulp... We look in dev folder!
gulp.task('default', ['watch-dev']);