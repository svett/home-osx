# `tester-go` Atom Tester [![Build Status](https://travis-ci.org/joefitzgerald/tester-go.svg?branch=master)](https://travis-ci.org/joefitzgerald/tester-go) [![Build status](https://ci.appveyor.com/api/projects/status/wgivdhtdd0foyylw/branch/master?svg=true)](https://ci.appveyor.com/project/joefitzgerald/tester-go/branch/master)

`tester-go` runs `go test -coverprofile` on your code and then displays coverage
information in the editor. By default this is done automatically on save, and you can disable it via package configuration.

It depends on the following packages:

* [`go-config`](https://atom.io/packages/go-config)
* [`go-get`](https://atom.io/packages/go-get)

## Usage

* Run
* Run tests for the current package with `golang: run-tests` or the shortcut <kbd>ctrl</kbd> + <kbd>alt</kbd> + <kbd>shift</kbd> + <kbd>g</kbd>&nbsp;&nbsp;<kbd>t</kbd>.
* Clear coverage with `golang: hide-coverage` or <kbd>ctrl</kbd> + <kbd>alt</kbd> + <kbd>shift</kbd> + <kbd>g</kbd>&nbsp;&nbsp;<kbd>x</kbd>.

## Configuration

* `runTestsOnSave`: Run `go test -coverprofile` on the current package each
time you save a `.go` file (default: `true`)
* `runTestsWithShortFlag`: Runs `go test` with `-short` flag set (default: `true`)
* `coverageHighlightMode`: Control the way that coverage highlighting occurs:
  * `covered-and-uncovered`: highlight covered and uncovered regions of text
  * `covered`: highlight covered regions of text
  * `uncovered`: highlight uncovered regions of text
  * `disabled`: disable highlighting
* `focusPanelIfTestsFail`: If the `go-plus` panel is hidden, or the panel is showing a different tab, the panel will be expanded and the test tab focused when tests fail (default: `true`)
