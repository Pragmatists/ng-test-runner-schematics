import {parseJsonAst} from '@angular-devkit/core';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import {EOL} from 'os';
import {SchemaOptions} from './schema';
import {createWorkspace} from '../utils/testing';

const collectionPath = require.resolve('../collection.json');

describe('ng-test-runner-schematics', () => {
    const schematicRunner = new SchematicTestRunner('ng-test-runner-schematics', collectionPath);

    let appTree: UnitTestTree;

    beforeEach(() => {
        appTree = createWorkspace(schematicRunner);
    });

    it('generates all component files', () => {
        const tree = runNgTestRunnerSchematic({name: 'user', path: 'src/app', flat: false});

        verifyThat
            .in(tree)
            .file('/src/app/user/user.component.css')
            .exists();
        verifyThat
            .in(tree)
            .file('/src/app/user/user.component.html')
            .exists();
        verifyThat
            .in(tree)
            .file('/src/app/user/user.component.spec.ts')
            .exists();
        verifyThat
            .in(tree)
            .file('/src/app/user/user.component.ts')
            .exists();
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

    it('spec should contain correct path to module if run deeply in directory structure', () => {
        const tree = runNgTestRunnerSchematic({name: 'foo', path: 'src/app/first/second/third'});

        const specContent = tree.readContent('/src/app/first/second/third/foo/foo.component.spec.ts');
        expect(specContent).toMatch(/import.*AppModule.*from '..\/..\/..\/..\/app.module'/);
    });

    it('spec should contain correct path to module if run from root directory', () => {
        const tree = runNgTestRunnerSchematic({name: 'abc', path: undefined});

        const specContent = tree.readContent('/src/app/abc/abc.component.spec.ts');
        expect(specContent).toMatch(/import.*AppModule.*from '..\/app.module'/);
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

            verifyThat
                .in(tree)
                .file('/src/app/flat.component.spec.ts')
                .exists();
            verifyThat
                .in(tree)
                .file('/src/app/flat/flat.component.spec.ts')
                .doesNotExist();
        });

        it('without --flat should generate spec in same directory', () => {
            const tree = runNgTestRunnerSchematic({name: 'no-flat', path: 'src/app', flat: false});

            verifyThat
                .in(tree)
                .file('/src/app/no-flat.component.spec.ts')
                .doesNotExist();
            verifyThat
                .in(tree)
                .file('/src/app/no-flat/no-flat.component.spec.ts')
                .exists();
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

    describe('speed hack', () => {
        it('should copy speed hack to test-utils directory', () => {
            const tree = runNgTestRunnerSchematic({name: 'fast', path: 'src/app', fast: true});

            const hackPath = '/src/test-utils/test-speed-hack.ts';
            verifyThat
                .in(tree)
                .file(hackPath)
                .exists();
            expect(tree.readContent(hackPath)).toMatch(/export function speedHack/);
        });

        it('without --fast speed hack should not be created', () => {
            const tree = runNgTestRunnerSchematic({name: 'slow', path: 'src/app', fast: false});

            verifyThat
                .in(tree)
                .file('/src/test-utils/test-speed-hack.ts')
                .doesNotExist();
        });

        it('should include speed hack in spec', () => {
            const tree: UnitTestTree = runNgTestRunnerSchematic({
                name: 'fast',
                path: 'src/app/first/second',
                fast: true
            });

            const specContent = tree.readContent('/src/app/first/second/fast/fast.component.spec.ts');
            expect(specContent).toMatch(/beforeAll\(/);
            expect(specContent).toMatch(/speedHack\(\)/);
            expect(specContent).toMatch(/import { speedHack } from '..\/..\/..\/..\/test-utils\/test-speed-hack'/);
        });

        it('should not overwrite file if it exists', () => {
            const hackPath = '/src/test-utils/test-speed-hack.ts';
            appTree.create(hackPath, 'old content');

            const tree: UnitTestTree = runNgTestRunnerSchematic({name: 'fast', path: 'src/app', fast: true});
            expect(tree.readContent(hackPath)).not.toMatch('export function speedHack');
            expect(tree.readContent(hackPath)).toEqual('old content');
        });
    });

    describe('component options', () => {
        it('skipImport should create TestModule in spec and run it', () => {
            const tree = runNgTestRunnerSchematic({name: 'foo', path: 'src/app', skipImport: true});

            verifyThat
                .in(tree)
                .file('/src/app/foo/foo.component.spec.ts')
                .exists();
            const specContent = tree.readContent('/src/app/foo/foo.component.spec.ts');
            expect(specContent).toMatch(/app = test\(TestModule\)/);
            expect(specContent).toMatch(/import { NgModule }/);
            expect(specContent).toMatch(/@NgModule\({/);
            expect(specContent).toMatch(/class TestModule {/);
        });

        it('for spec set to false should not generate spec file', () => {
            const tree = runNgTestRunnerSchematic({name: 'without', path: 'src/app', spec: false});

            verifyThat
                .in(tree)
                .file('/src/app/without/without.component.ts')
                .exists();
            verifyThat
                .in(tree)
                .file('/src/app/without/without.component.spec.ts')
                .doesNotExist();
        });

        it('for module options should use this module in spec', () => {
            appTree.create(
                'src/app/todo/todo.module.ts',
                `import { NgModule } from '@angular/core'; 
                @NgModule({}) 
                export class TodoModule {}`
            );
            appTree.create('src/app/todo/list/list.module.ts', '');

            const tree = runNgTestRunnerSchematic({name: 'foo', path: 'src/app/todo/list', module: 'todo'});

            const specContent = tree.readContent('/src/app/todo/list/foo/foo.component.spec.ts');
            expect(specContent).toMatch(/import.*TodoModule.*from '..\/..\/todo.module'/);
            expect(specContent).toMatch(/app = test\(TodoModule\)/);
        });

        it('should use styleext from angular.json', () => {
            setStyleextInAngularJson('scss');

            const tree = runNgTestRunnerSchematic({name: 'foo', path: 'src/app'});

            verifyThat
                .in(tree)
                .file('/src/app/foo/foo.component.scss')
                .exists();
        });

        it('should use styleext specified in project in angular.json', () => {
            const config = JSON.parse(appTree.readContent('/angular.json'));
            config.projects.bar.schematics['@schematics/angular:component'] = {};
            config.projects.bar.schematics['@schematics/angular:component'].styleext = 'scss';
            appTree.overwrite('/angular.json', JSON.stringify(config, null, 2));

            const tree = runNgTestRunnerSchematic({name: 'test', path: 'src/app'});

            verifyThat
                .in(tree)
                .file('/src/app/test/test.component.scss')
                .exists();
        });
    });

    function runNgTestRunnerSchematic(options?: Partial<SchemaOptions>) {
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
                exists: () =>
                    expect(tree.files.indexOf(filename)).toBeGreaterThan(0, noFileInTreeError(filename, tree)),
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

    function setStyleextInAngularJson(style: string) {
        const angularJson = appTree.read('angular.json');
        const config = parseJsonAst(angularJson.toString());
        const recorder = appTree.beginUpdate('angular.json');
        recorder.insertRight(
            config.end.offset - 1,
            `,
            "schematics": {
                "@schematics/angular:component": {
                    "styleext": "${style}"
                }
            }            
            `
        );
        appTree.commitUpdate(recorder);
    }
});
