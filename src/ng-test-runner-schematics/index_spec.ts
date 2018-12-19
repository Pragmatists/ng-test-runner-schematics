import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import { EOL } from 'os';

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
        const tree = runNgTestRunnerSchematic({name: 'user', path: 'src/app', flat: false});

        verifyThat.in(tree).file('/src/app/user/user.component.css').exists();
        verifyThat.in(tree).file('/src/app/user/user.component.html').exists();
        verifyThat.in(tree).file('/src/app/user/user.component.spec.ts').exists();
        verifyThat.in(tree).file('/src/app/user/user.component.ts').exists();
    });

    it('spec should contain ng-test-runner imports', () => {
        const tree = runNgTestRunnerSchematic({name: 'abc', path: 'src/app'});

        const specContent = tree.readContent('/src/app/abc/abc.component.spec.ts');
        expect(specContent).toMatch(/import.*test.*from 'ng-test-runner'/);
        expect(specContent).toMatch(/import.*App.*from 'ng-test-runner'/);
        expect(specContent).toMatch(/import.*expectThat.*from 'ng-test-runner'/);
    });

    it('spec should contain component and module imports', () => {
        const tree = runNgTestRunnerSchematic({name: 'foo', path: 'src/app'});

        const specContent = tree.readContent('/src/app/foo/foo.component.spec.ts');
        expect(specContent).toMatch(/import.*FooComponent.*from '.\/foo.component'/);
        expect(specContent).toMatch(/import.*AppModule.*from '..\/app.module'/);
    });

    it('spec should contain have correct path to module if run deeply in directory structure', () => {
        const tree = runNgTestRunnerSchematic({name: 'foo', path: 'src/app/first/second/third'});

        const specContent = tree.readContent('/src/app/first/second/third/foo/foo.component.spec.ts');
        expect(specContent).toMatch(/import.*AppModule.*from '..\/..\/..\/..\/app.module'/);
    });

    it('spec should run module', () => {
        const tree = runNgTestRunnerSchematic({name: 'foo', path: 'src/app'});

        const moduleContent = tree.readContent('/src/app/foo/foo.component.spec.ts');
        expect(moduleContent).toMatch(/app = test\(AppModule\)/);
    });

    it('spec should has component setup', () => {
        const tree = runNgTestRunnerSchematic({name: 'big-example', path: 'src/app'});

        const specContent = tree.readContent('/src/app/big-example/big-example.component.spec.ts');
        expect(specContent).toMatch(/describe\('BigExampleComponent', \(\) => {/);
        expect(specContent).toMatch(/const component = app.run\(BigExampleComponent\);/);
        expect(specContent).toMatch(/expectThat.textOf\('p'\).isEqualTo\('big-example works!'\)/);
    });

    describe('for flat flag', () => {
        it('with --flat should generate spec in same directory', () => {
            const tree = runNgTestRunnerSchematic({name: 'flat', path: 'src/app', flat: true});

            verifyThat.in(tree).file('/src/app/flat.component.spec.ts').exists();
            verifyThat.in(tree).file('/src/app/flat/flat.component.spec.ts').doesNotExist();
        });

        it('without --flat should generate spec in same directory', function () {
            const tree = runNgTestRunnerSchematic({name: 'no-flat', path: 'src/app', flat: false});

            verifyThat.in(tree).file('/src/app/no-flat.component.spec.ts').doesNotExist();
            verifyThat.in(tree).file('/src/app/no-flat/no-flat.component.spec.ts').exists();
        });
    });

    describe('for server flag', () => {
        it('should add imports', () => {
            const tree = runNgTestRunnerSchematic({name: 'foo', path: 'src/app', server: true});

            const specContent = tree.readContent('/src/app/foo/foo.component.spec.ts');
            expect(specContent).toMatch(/import.*http, Server.*from 'ng-test-runner'/);
        });

        it('should set up server', () => {
            const tree = runNgTestRunnerSchematic({name: 'foo', path: 'src/app', server: true});

            const specContent = tree.readContent('/src/app/foo/foo.component.spec.ts');
            expect(specContent).toMatch(/server = http\(\)/);
        });

        it('should clean up server', () => {
            const tree = runNgTestRunnerSchematic({name: 'foo', path: 'src/app', server: true});

            const specContent = tree.readContent('/src/app/foo/foo.component.spec.ts');
            expect(specContent).toMatch(/server.stop\(\)/);
        });
    });

    function runNgTestRunnerSchematic(options?: { [key: string]: any }) {

        const opts = {
            name: 'user',
            path: 'src/app',
            project: 'bar',
            ...options
        };
        return schematicRunner.runSchematic('ng-test-runner-schematics', opts, appTree);
    }

    const verifyThat = {
        in: (tree: UnitTestTree) => ({
            file: (filename: string) => ({
                exists: () => expect(tree.files.indexOf(filename)).toBeGreaterThan(0, noFileInTreeError(filename, tree)),
                doesNotExist: () => expect(tree.files.indexOf(filename)).toBeLessThan(0, fileExistsError(filename))
            })
        })
    };

    function fileExistsError(filename: string) {
        return `File "${filename}" unexpectedly exists`;
    }

    function noFileInTreeError(filename: string, tree: UnitTestTree) {
        const files = tree.files.join(`,${EOL}\t\t`);
        return `File "${filename}" not found within:${EOL}\t\t${files}`;
    }
});
