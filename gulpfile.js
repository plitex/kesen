const gulp = require("gulp");
const ts = require("gulp-typescript");
const merge = require("merge2");
const del = require("del");

const tsProject = ts.createProject("tsconfig.json");

gulp.task("build:clean", function() {
  return del(["build"]);
});

gulp.task("build", ["build:clean"], function() {
  const tsResult = tsProject.src().pipe(tsProject());
  return merge([
    tsResult.dts.pipe(gulp.dest("build")),
    tsResult.js.pipe(gulp.dest("build"))
  ]);
});

gulp.task("dist:clean", function() {
  return del(["lib"]);
});

gulp.task("dist", ["dist:clean", "build"], function() {
  return gulp
    .src([
      "build/**/*",
      "!build/**/__mocks__/",
      "!build/**/__mocks__/**/*",
      "!build/**/__tests__/",
      "!build/**/__tests__/**/*"
    ])
    .pipe(gulp.dest("lib"));
});

gulp.task("default", ["dist"]);
