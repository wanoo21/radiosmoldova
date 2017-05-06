const gulp = require('gulp')
const sass = require('gulp-sass')
const htmlmin = require('gulp-htmlmin')
const jsmin = require('gulp-jsmin')
const zip = require('gulp-zip')
const runSequence = require('run-sequence')
const inject = require('gulp-inject')
const package = require('./package.json')
const exec = require('child_process').exec
const del = require('del')
const replace = require('gulp-string-replace')

let buildFolder = '_dist';
let buildeFolderServer = 'dist-server'
let ua = gulp.src('./ua.js', { read: false })

gulp.task('scss', () => {
    return gulp.src('./*.scss')
        .pipe(sass({'outputStyle': 'compressed'}))
        .pipe(gulp.dest(buildFolder))
});

gulp.task('js_uglify', () => {
    return gulp.src([
        '**.js',
        '!gulpfile.js'
    ])
        .pipe(jsmin())
        .pipe(gulp.dest(buildFolder))
});

gulp.task('html_min', () => {
    return gulp.src('./*.html')
        .pipe(inject(ua, { ignorePath: buildFolder, addRootSlash: false, relative: false }))
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(buildFolder))
});

gulp.task('icons', () => {
    return gulp.src('icons/**')
        .pipe(gulp.dest(`${buildFolder}/icons/`))
});

gulp.task('imgs', () => {
    return gulp.src('imgs/**')
        .pipe(gulp.dest(`${buildFolder}/imgs/`))
});

gulp.task('extension', ['scss', 'js_uglify', 'html_min', 'icons', 'imgs'], () => {
    return gulp.src([
        `!${buildFolder}`,
        '*.json',
        '!package.json',
        '!*.md',
        '!*.html'
    ]).pipe(gulp.dest(buildFolder))
});

gulp.task('zip', () => 
    gulp.src(`${buildFolder}/**/*`)
        .pipe(zip(`${package.name}-v${package.version}.zip`))
        .pipe(gulp.dest(`./`))
)

gulp.task('prepare_server', () => {
    gulp.src('./server/index.html')
        .pipe(inject(ua, { ignorePath: buildFolder, addRootSlash: false, relative: false }))
        .pipe(gulp.dest(`./${buildeFolderServer}`))

    return gulp.src(['!./server/index.html', './server/**', './ua.js']).pipe(gulp.dest(`./${buildeFolderServer}`))
})

gulp.task('deploy', cb => exec('firebase deploy --only hosting', (err, stdout, stderr) => {
  console.log(stdout)
  console.log(stderr)
  return cb(err)
}))

gulp.task('deleteAllFolders', () => del([`./${buildFolder}`, `./${buildeFolderServer}`]))

gulp.task('default', () => runSequence(['extension', 'prepare_server'], ['zip', 'deploy'], 'deleteAllFolders'));