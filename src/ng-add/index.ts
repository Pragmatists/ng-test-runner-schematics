import {SchemaOptions} from './schema';
import {noop, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {addPackageToPackageJson} from 'schematics-utilities';
import {NodeDependencyType} from '@schematics/angular/utility/dependencies';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';

export default function(options: SchemaOptions): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.logger.debug(`ng-add called with options: ${options}`);
        if (options && options.skipPackageJson) {
            return noop();
        }
        addPackageToPackageJson(tree, NodeDependencyType.Dev, 'ng-test-runner', '^1.1.8');
        context.addTask(new NodePackageInstallTask());
        return tree;
    };
}
