# ng-test-runner-schematics
[![Build Status](https://travis-ci.org/Pragmatists/ng-test-runner-schematics.svg?branch=master)](https://travis-ci.org/Pragmatists/ng-test-runner-schematics)
## About
[Schematics](https://www.npmjs.com/package/@angular-devkit/schematics) for [ng-test-runner](https://github.com/Pragmatists/ng-test-runner). It generates Angular `Component` with spec where `ng-test-runner` is configured and ready to run.
## Installation
```bash
ng add ng-test-runner-schematics
``` 
## Usage
### Test for Presentational Component
```bash
ng g ng-test-runner-schematics:component my-compoment
```
### Test for Smart Component (that uses http)
```bash
ng g ng-test-runner-schematics:component --server my-compoment 
```
### Test with speed hack
It decreases tests execution time by ~40%. For details see https://github.com/angular/angular/issues/12409#issuecomment-383607643 (and full discussion)
```bash
ng g ng-test-runner-schematics:component --fast my-compoment 
```
## Options
|Option                  |Description|
|------------------------|-----------|
|--server=true&#124;false|Flag to indicate if a sinon server is added to spec.<br>Default: `false`    |
|--fast=true&#124;false  |Flag to indicate if speed hack should be added to spec.<br>Default: `false` |
You can also use all Angular CLI component options (they are passed to default CLI schematic). For list of flags check [Component documentation](https://angular.io/cli/generate#component).
