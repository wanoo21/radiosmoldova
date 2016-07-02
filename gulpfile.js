const gulp = require('gulp');
const sass = require('gulp-sass');
const htmlmin = require('gulp-htmlmin');
const jsmin = require('gulp-jsmin');
const zip = require('gulp-zip');

let buildFolder = '_dist';
let buildFolderRomania = '_dist-romania/';

gulp.task('scss', () => {
    gulp.src('./*.scss')
        .pipe(sass({'outputStyle': 'compressed'}))
        .pipe(gulp.dest(buildFolder))
});

gulp.task('js_uglify', () => {
    gulp.src([
        '**.js',
        '!gulpfile.js'
    ])
        .pipe(jsmin())
        .pipe(gulp.dest(buildFolder))
});

gulp.task('html_min', () => {
    gulp.src('./*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(buildFolder))
});

gulp.task('icons', () => {
    gulp.src('icons/**')
        .pipe(gulp.dest(`${buildFolder}/icons/`))
});

gulp.task('imgs', () => {
    gulp.src('imgs/**')
        .pipe(gulp.dest(`${buildFolder}/imgs/`))
});

gulp.task('prod', ['scss', 'js_uglify', 'html_min', 'icons', 'imgs'], () => {
    gulp.src([
        `!${buildFolder}`,
        `!${buildFolderRomania}`,
        '*.json',
        '!package.json',
        '!*.md',
        '!*.html'
    ]).pipe(gulp.dest(buildFolder))
});

gulp.task('default', ['prod'], () => {
    gulp.src(buildFolder)
        .pipe(zip('radiosmoldova.zip'))
        .pipe(gulp.dest('../'));
});