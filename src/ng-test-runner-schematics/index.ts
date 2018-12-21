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

export default function (options: SchemaOptions): Rule {

    return chain([
        externalSchematic('@schematics/angular', 'component', {
                ...options,
                spec: false
        }),
        (tree: Tree) => {
            const modulePath = findModuleFromOptions(tree, options);
            const source = getTsSourceFile(tree, modulePath);
            const moduleClass = getFirstNgModuleName(source as any);
            const movePath = (options.flat) ?
                normalize('/' + options.path) :
                normalize('/' + options.path + '/' + strings.dasherize(options.name));
            let moduleTemplatePath: string = relative(movePath, modulePath);
            moduleTemplatePath = moduleTemplatePath.substring(0, moduleTemplatePath.length - 3);
            let speedHackTemplatePath: string = speedHackPath(movePath);
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
