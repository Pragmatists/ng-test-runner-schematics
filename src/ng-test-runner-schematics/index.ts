import {JsonAstObject, normalize, parseJsonAst, Path, relative, strings} from '@angular-devkit/core';
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
import {findPropertyInAstObject} from 'schematics-utilities/dist/angular/json-utils';
import {SchemaOptions} from './schema';
import {getFirstNgModuleName, getTsSourceFile} from './utils';

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

export default function(options: SchemaOptions): Rule {
    return chain([
        (tree: Tree) => {
            const styleext = findStyleext(tree);
            return externalSchematic('@schematics/angular', 'component', {
                ...options,
                spec: false,
                styleext
            });
        },
        (tree: Tree) => {
            if (!options.spec) {
                return noop();
            }
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

function findStyleext(tree: Tree) {
    const angularJson = tree.read('angular.json');
    const config = parseJsonAst(angularJson.toString());
    const schematics = findPropertyInAstObject(config as JsonAstObject, 'schematics');
    if (!schematics) {
        return 'css';
    }
    const component = findPropertyInAstObject(schematics as JsonAstObject, '@schematics/angular:component');
    if (!component) {
        return 'css';
    }
    const styleext = findPropertyInAstObject(component as JsonAstObject, 'styleext');
    if (!styleext) {
        return 'css';
    }
    return styleext.value;
}
