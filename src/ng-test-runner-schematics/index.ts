import {
    apply,
    chain,
    externalSchematic,
    filter,
    MergeStrategy,
    mergeWith,
    move,
    Rule,
    template,
    Tree,
    url
} from '@angular-devkit/schematics';
import { SchemaOptions } from './schema';
import { findModuleFromOptions } from '@schematics/angular/utility/find-module';
import { getFirstNgModuleName, getTsSourceFile } from './utils';
import { normalize, relative, strings } from '@angular-devkit/core';

export default function (options: SchemaOptions): Rule {
    const testHelperDir = '/src/test-utils';
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
            const templateOptions = {
                moduleClass,
                moduleTemplatePath
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
        () => {
            const source = apply(url('./files'), [
                filter(file => file.includes('test-speed-hack.ts')),
                filter(() => options.fast),
                move(testHelperDir)
            ]);
            return mergeWith(source, MergeStrategy.Overwrite);
        }
    ]);
}

