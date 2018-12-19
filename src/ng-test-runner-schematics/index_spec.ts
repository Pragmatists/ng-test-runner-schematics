import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';

const collectionPath = require.resolve('../collection.json');

describe('ng-test-runner-schematics', () => {
    const schematicRunner = new SchematicTestRunner(
        'ng-test-runner-schematics',
        collectionPath
    );

    let appTree: UnitTestTree;
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

    beforeEach(() => {
        appTree = schematicRunner.runExternalSchematic(
            '@schematics/angular', 'workspace', workspaceOptions);
        appTree = schematicRunner.runExternalSchematic(
            '@schematics/angular', 'application', appOptions, appTree);
    });


    it('generates all component files', () => {
        const tree = runSchematic({name: 'user', path: 'src/app'});

        const files = tree.files;
        expect(files.indexOf('/src/app/user/user.component.css')).toBeGreaterThanOrEqual(0);
        expect(files.indexOf('/src/app/user/user.component.html')).toBeGreaterThanOrEqual(0);
        expect(files.indexOf('/src/app/user/user.component.spec.ts')).toBeGreaterThanOrEqual(0);
        expect(files.indexOf('/src/app/user/user.component.ts')).toBeGreaterThanOrEqual(0);
    });

    it('spec should contain ng-test-runner imports', () => {
        const tree = runSchematic({name: 'abc', path: 'src/app'});

        const specContent = tree.readContent('/src/app/abc/abc.component.spec.ts');
        expect(specContent).toMatch(/import.*test.*from 'ng-test-runner'/);
        expect(specContent).toMatch(/import.*App.*from 'ng-test-runner'/);
        expect(specContent).toMatch(/import.*expectThat.*from 'ng-test-runner'/);
    });

    it('spec should contain component and module imports', () => {
        const tree = runSchematic({name: 'foo', path: 'src/app'});

        const specContent = tree.readContent('/src/app/foo/foo.component.spec.ts');
        expect(specContent).toMatch(/import.*FooComponent.*from '.\/foo.component'/);
        expect(specContent).toMatch(/import.*AppModule.*from '..\/app.module'/);
    });

    it('spec should run module', () => {
        const tree = runSchematic({name: 'foo', path: 'src/app'});

        const moduleContent = tree.readContent('/src/app/foo/foo.component.spec.ts');
        expect(moduleContent).toMatch(/app = test\(AppModule\)/);
    });

    it('spec should has component setup', () => {
        const tree = runSchematic({name: 'big-example', path: 'src/app'});

        const specContent = tree.readContent('/src/app/big-example/big-example.component.spec.ts');
        expect(specContent).toMatch(/describe\('BigExampleComponent', \(\) => {/);
        expect(specContent).toMatch(/const component = app.run\(BigExampleComponent\);/);
        expect(specContent).toMatch(/expectThat.textOf\('p'\).isEqualTo\('big-example works!'\)/);
    });

    describe('for server flag', () => {
        it('should add imports', () => {
            const tree = runSchematic({name: 'foo', path: 'src/app', server: true});

            const specContent = tree.readContent('/src/app/foo/foo.component.spec.ts');
            expect(specContent).toMatch(/import.*http, Server.*from 'ng-test-runner'/);
        });

        it('should set up server', () => {
            const tree = runSchematic({name: 'foo', path: 'src/app', server: true});

            const specContent = tree.readContent('/src/app/foo/foo.component.spec.ts');
            expect(specContent).toMatch(/server = http\(\)/);
        });

        it('should clean up server', () => {
            const tree = runSchematic({name: 'foo', path: 'src/app', server: true});

            const specContent = tree.readContent('/src/app/foo/foo.component.spec.ts');
            expect(specContent).toMatch(/server.stop\(\)/);
        });
    });

    function runSchematic(options?: {[key: string]: any}) {
        const opts = {
            name: 'user',
            path: 'src/app',
            project: 'bar',
            ...options
        };
        return schematicRunner.runSchematic('ng-test-runner-schematics', opts, appTree);
    }
});
