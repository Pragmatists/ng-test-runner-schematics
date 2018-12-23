import * as ts from 'typescript';
import {SchematicsException, Tree} from '@angular-devkit/schematics';

export function getFirstNgModuleName(source: ts.SourceFile): string | undefined {
    // First, find the @NgModule decorators.
    const ngModulesMetadata = getDecoratorMetadata(source, 'NgModule', '@angular/core');
    if (ngModulesMetadata.length === 0) {
        return undefined;
    }

    // Then walk parent pointers up the AST, looking for the ClassDeclaration parent of the NgModule
    // metadata.
    const moduleClass = findClassDeclarationParent(ngModulesMetadata[0]);
    if (!moduleClass || !moduleClass.name) {
        return undefined;
    }

    // Get the class name of the module ClassDeclaration.
    return moduleClass.name.text;
}

function findClassDeclarationParent(node: ts.Node): ts.ClassDeclaration | undefined {
    if (ts.isClassDeclaration(node)) {
        return node;
    }

    return node.parent && findClassDeclarationParent(node.parent);
}

export function getDecoratorMetadata(source: ts.SourceFile, identifier: string, module: string): ts.Node[] {
    const angularImports: {[name: string]: string} = findNodes(source, ts.SyntaxKind.ImportDeclaration)
        .map((node: ts.ImportDeclaration) => _angularImportsFromNode(node))
        .reduce((acc: {[name: string]: string}, current: {[name: string]: string}) => {
            for (const key of Object.keys(current)) {
                acc[key] = current[key];
            }

            return acc;
        }, {});

    return getSourceNodes(source)
        .filter(node => {
            return (
                node.kind == ts.SyntaxKind.Decorator &&
                (node as ts.Decorator).expression.kind == ts.SyntaxKind.CallExpression
            );
        })
        .map(node => (node as ts.Decorator).expression as ts.CallExpression)
        .filter(expr => {
            if (expr.expression.kind == ts.SyntaxKind.Identifier) {
                const id = expr.expression as ts.Identifier;

                return id.getFullText(source) == identifier && angularImports[id.getFullText(source)] === module;
            } else if (expr.expression.kind == ts.SyntaxKind.PropertyAccessExpression) {
                // This covers foo.NgModule when importing * as foo.
                const paExpr = expr.expression as ts.PropertyAccessExpression;
                // If the left expression is not an identifier, just give up at that point.
                if (paExpr.expression.kind !== ts.SyntaxKind.Identifier) {
                    return false;
                }

                const id = paExpr.name.text;
                const moduleId = (paExpr.expression as ts.Identifier).getText(source);

                return id === identifier && angularImports[moduleId + '.'] === module;
            }

            return false;
        })
        .filter(expr => expr.arguments[0] && expr.arguments[0].kind == ts.SyntaxKind.ObjectLiteralExpression)
        .map(expr => expr.arguments[0] as ts.ObjectLiteralExpression);
}

export function findNodes(node: ts.Node, kind: ts.SyntaxKind, max = Infinity): ts.Node[] {
    if (!node || max == 0) {
        return [];
    }

    const arr: ts.Node[] = [];
    if (node.kind === kind) {
        arr.push(node);
        max--;
    }
    if (max > 0) {
        for (const child of node.getChildren()) {
            findNodes(child, kind, max).forEach(node => {
                if (max > 0) {
                    arr.push(node);
                }
                max--;
            });

            if (max <= 0) {
                break;
            }
        }
    }

    return arr;
}

export function getSourceNodes(sourceFile: ts.SourceFile): ts.Node[] {
    const nodes: ts.Node[] = [sourceFile];
    const result = [];

    while (nodes.length > 0) {
        const node = nodes.shift();

        if (node) {
            result.push(node);
            if (node.getChildCount(sourceFile) >= 0) {
                nodes.unshift(...node.getChildren());
            }
        }
    }

    return result;
}

function _angularImportsFromNode(node: ts.ImportDeclaration): {[name: string]: string} {
    const ms = node.moduleSpecifier;
    let modulePath: string;
    switch (ms.kind) {
        case ts.SyntaxKind.StringLiteral:
            modulePath = (ms as ts.StringLiteral).text;
            break;
        default:
            return {};
    }

    if (!modulePath.startsWith('@angular/')) {
        return {};
    }

    if (node.importClause) {
        if (node.importClause.name) {
            // This is of the form `import Name from 'path'`. Ignore.
            return {};
        } else if (node.importClause.namedBindings) {
            const nb = node.importClause.namedBindings;
            if (nb.kind == ts.SyntaxKind.NamespaceImport) {
                // This is of the form `import * as name from 'path'`. Return `name.`.
                return {
                    [(nb as ts.NamespaceImport).name.text + '.']: modulePath
                };
            } else {
                // This is of the form `import {a,b,c} from 'path'`
                const namedImports = nb as ts.NamedImports;

                return namedImports.elements
                    .map((is: ts.ImportSpecifier) => (is.propertyName ? is.propertyName.text : is.name.text))
                    .reduce((acc: {[name: string]: string}, curr: string) => {
                        acc[curr] = modulePath;

                        return acc;
                    }, {});
            }
        }

        return {};
    } else {
        // This is of the form `import 'path';`. Nothing to do.
        return {};
    }
}

export function getTsSourceFile(host: Tree, path: string): ts.SourceFile {
    const buffer = host.read(path);
    if (!buffer) {
        throw new SchematicsException(`Could not read file (${path}).`);
    }
    const content = buffer.toString();
    return ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
}
