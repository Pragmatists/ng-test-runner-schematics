import {ChangeDetection, ViewEncapsulation} from '@schematics/angular/component/schema';

export interface SchemaOptions {
    server: boolean;
    fast: boolean;
    changeDetection?: ChangeDetection;
    entryComponent?: boolean;
    export?: boolean;
    flat?: boolean;
    inlineStyle?: boolean;
    inlineTemplate?: boolean;
    lintFix?: boolean;
    module?: string;
    name: string;
    path?: string;
    prefix?: string;
    project?: string;
    selector?: string;
    skipImport?: boolean;
    spec?: boolean;
    styleext?: string;
    viewEncapsulation?: ViewEncapsulation;
}
