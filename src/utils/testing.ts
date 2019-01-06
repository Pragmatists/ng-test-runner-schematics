import {Schema as WorkspaceOptions} from '@schematics/angular/workspace/schema';
import {Schema as ApplicationOptions} from '@schematics/angular/application/schema';
import {SchematicTestRunner} from '@angular-devkit/schematics/testing';

const workspaceOptions: WorkspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '7.0.2'
};

const appOptions: ApplicationOptions = {
    name: 'bar',
    projectRoot: '',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    style: 'css',
    skipTests: false,
    skipPackageJson: false
};

export function createWorkspace(schematicRunner: SchematicTestRunner) {
    let appTree = schematicRunner.runExternalSchematic('@schematics/angular', 'workspace', workspaceOptions);
    appTree = schematicRunner.runExternalSchematic('@schematics/angular', 'application', appOptions, appTree);
    return appTree;
}
