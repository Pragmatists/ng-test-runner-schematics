import {normalize, Path, relative, strings} from '@angular-devkit/core';
import {
    apply,
    chain,
    externalSchematic,
    filter,
    MergeStrategy,
    mergeWith,
    move,
    noop,
    Rule,
    template,
    Tree,
    url
} from '@angular-devkit/schematics';
import {findModuleFromOptions} from '@schematics/angular/utility/find-module';
import {basename} from 'path';
import {SchemaOptions} from './schema';
import {getFirstNgModuleName, getTsSourceFile} from './utils';
import {buildDefaultPath} from 'schematics-utilities';
import {getProject} from '@schematics/angular/utility/project';

const testHelperDir = '/src/test-utils';
const speedHackName = 'test-speed-hack.ts';

function findModuleClass(tree: Tree, modulePath: Path) {
    if (!modulePath) {
        return null;
    }
    const source = getTsSourceFile(tree, modulePath);
    return getFirstNgModuleName(source as any);
}

function getMovePath(options: SchemaOptions): Path {
    return options.flat
        ? normalize('/' + options.path)
        : normalize('/' + options.path + '/' + strings.dasherize(options.name));
}

function getModuleTemplatePath(movePath: Path, modulePath: Path) {
    if (!modulePath) {
        return '';
    }
    const moduleTemplatePath: string = relative(movePath, modulePath);
    return moduleTemplatePath.substring(0, moduleTemplatePath.length - 3);
}

function setupPathInOptions(tree: Tree, options: SchemaOptions) {
    const project = getProject(tree, options.project);
    if (options.path === undefined) {
        options.path = buildDefaultPath(project);
    }
}

export default function(options: SchemaOptions): Rule {
    return chain([
        (tree: Tree) => {
            const opts = {...options, spec: false};
            const styleext = findStyleext(tree, options);
            if (styleext) {
                opts.styleext = styleext;
            }
            return externalSchematic('@schematics/angular', 'component', opts);
        },
        (tree: Tree) => {
            if (!options.spec) {
                return noop();
            }
            setupPathInOptions(tree, options);
            const movePath = getMovePath(options);
            const modulePath = findModuleFromOptions(tree, options);
            const moduleClass = findModuleClass(tree, modulePath);
            const moduleTemplatePath = getModuleTemplatePath(movePath, modulePath);
            const speedHackTemplatePath: string = speedHackPath(movePath);
            const templateOptions = {
                moduleClass,
                moduleTemplatePath,
                speedHackTemplatePath
            };
            const templateSource = apply(url('./files'), [
                filter(file => file.endsWith('spec.ts')),
                template({
                    ...strings,
                    ...options,
                    ...templateOptions
                }),
                move(movePath)
            ]);

            return mergeWith(templateSource, MergeStrategy.Default);
        },
        (tree: Tree) => {
            if (tree.exists(testHelperDir + '/' + speedHackName)) {
                return noop();
            }
            const source = apply(url('./files'), [
                filter(file => file.includes(speedHackName)),
                filter(() => options.fast),
                move(testHelperDir)
            ]);
            return mergeWith(source, MergeStrategy.AllowOverwriteConflict);
        }
    ]);
}

function speedHackPath(movePath: Path) {
    let path: string = relative(movePath, testHelperDir as Path);
    path = path + '/' + basenameTs(speedHackName);
    return path;
}

function basenameTs(filename: string) {
    return basename(filename, '.ts');
}

function hasStyleext(configParsed: any) {
    return (
        configParsed.schematics &&
        configParsed.schematics['@schematics/angular:component'] &&
        configParsed.schematics['@schematics/angular:component'].styleext
    );
}

function findStyleext(tree: Tree, options: SchemaOptions) {
    const angularJson = tree.read('angular.json');
    const configParsed = JSON.parse(angularJson.toString());
    if (hasStyleext(configParsed.projects[options.project])) {
        return configParsed.projects[options.project].schematics['@schematics/angular:component'].styleext;
    }
    if (hasStyleext(configParsed)) {
        return configParsed.schematics['@schematics/angular:component'].styleext;
    }
    return undefined;
}
