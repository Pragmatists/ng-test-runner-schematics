import {getTestBed, TestBed} from '@angular/core/testing';

export function speedHack() {
    const testbed: any = getTestBed();

    // Switch back to original resetTestingModule() function if it exists
    if ((window as any)['__testCache']) {
        testbed.resetTestingModule = (window as any)['__testCache'].realResetTestingModule;
    }

    // Do a reset on the testing module.
    TestBed.resetTestingModule();

    // Store reference to original resetTestingModule() function.
    const realResetTestingModule = testbed.resetTestingModule;
    (window as any)['__testCache'] = {realResetTestingModule: testbed.resetTestingModule};

    // Replace original resetTestingModule() with a custom version that re-uses the moduleFactory and compiler.
    // This cuts the test execution time by roughly 40%.
    testbed.resetTestingModule = () => {
        const mf = testbed._moduleFactory;
        const compiler = testbed._compiler;
        realResetTestingModule.apply(testbed);
        testbed._moduleFactory = mf;
        testbed._compiler = compiler;
    };
}
