# ng-test-runner-schematics
[![Build Status](https://travis-ci.org/Pragmatists/ng-test-runner-schematics.svg?branch=master)](https://travis-ci.org/Pragmatists/ng-test-runner-schematics.svg?branch=master)
## About
[Schematics](https://www.npmjs.com/package/@angular-devkit/schematics) for [ng-test-runner](https://github.com/Pragmatists/ng-test-runner). It generates Angular `Component` with spec where `ng-test-runner` is configured and ready to run.
## Installation
Still not published on npmjs. Currently you can use development version. For usage see [Development](#development). 
## Development
In `ng-test-runner-schematics` repo run: 
```bash
npm test && npm run build
```
In another angular project run:
```bash
npm link PATH-TO-ng-test-runner-schematic
```
# Usage
## Test for Presentational Component
```bash
ng g ng-test-runner-schematics:ngc --name=my-compoment
```
## Test for Smart Component (that uses http)
```bash
ng g ng-test-runner-schematics:ngc --name=my-compoment --server
```
## Schematics CLI info
### Getting Started With Schematics

This repository is a basic Schematic implementation that serves as a starting point to create and publish Schematics to NPM.

### Testing

To test locally, install `@angular-devkit/schematics-cli` globally and use the `schematics` command line tool. That tool acts the same as the `generate` command of the Angular CLI, but also has a debug mode.

Check the documentation with
```bash
schematics --help
```

### Unit Testing

`npm run test` will run the unit tests, using Jasmine as a runner and test framework.

### Publishing

To publish, simply do:

```bash
npm run build
npm publish
```

That's it!
 