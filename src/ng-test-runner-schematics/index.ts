import {
    apply,
    chain,
    externalSchematic,
    filter,
    MergeStrategy,
    mergeWith,
    move, noop,
    Rule,
    template,
    Tree,
    url
} from '@angular-devkit/schematics';
import { SchemaOptions } from './schema';
import { findModuleFromOptions } from '@schematics/angular/utility/find-module';
import { getFirstNgModuleName, getTsSourceFile } from './utils';
import { normalize, Path, relative, strings } from '@angular-devkit/core';
import { basename } from 'path';

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
    return (options.flat) ?
        normalize('/' + options.path) :
        normalize('/' + options.path + '/' + strings.dasherize(options.name));
}

function getModuleTemplatePath(movePath: Path, modulePath: Path) {
    if (!modulePath) {
        return '';
    }
    let moduleTemplatePath: string = relative(movePath, modulePath);
    return moduleTemplatePath.substring(0, moduleTemplatePath.length - 3);
}

export default function (options: SchemaOptions): Rule {

    return chain([
        externalSchematic('@schematics/angular', 'component', {
                ...options,
                spec: false
        }),
        (tree: Tree) => {
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
