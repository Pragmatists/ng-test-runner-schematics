import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import {join} from 'path';
import {createWorkspace} from '../utils/testing';
import {NodePackageName} from '@angular-devkit/schematics/tasks/node-package/options';

describe('ng-add-schematic', () => {
    const collectionPath = join(__dirname, '../collection.json');
    const schematicRunner = new SchematicTestRunner('ng-test-runner-schematics', collectionPath);

    let appTree: UnitTestTree;

    beforeEach(() => {
        appTree = createWorkspace(schematicRunner);
    });

    it('should add dependency to package.json', () => {
        const tree = schematicRunner.runSchematic('ng-add', {}, appTree);

        const content = tree.readContent('/package.json');

        const packageJson = JSON.parse(content);
        expect(packageJson.devDependencies['ng-test-runner']).toBeDefined();
    });

    it('should add install task', () => {
        schematicRunner.runSchematic('ng-add', {}, appTree);

        expect(schematicRunner.tasks[0].name).toEqual(NodePackageName);
    });

    it('for skipPackageJson option should not add dependency', () => {
        const tree = schematicRunner.runSchematic('ng-add', {skipPackageJson: true}, appTree);

        const content = tree.readContent('/package.json');

        const packageJson = JSON.parse(content);
        expect(packageJson.devDependencies['ng-test-runner']).toBeUndefined();
    });
});
