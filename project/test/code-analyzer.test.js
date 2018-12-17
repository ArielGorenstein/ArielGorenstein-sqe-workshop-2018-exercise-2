import assert from 'assert';
import {parseCode, makeTabs} from '../src/js/code-analyzer';


describe('Test', () => {
    it('simple function', () => {
        assert.equal(
            parseCode('function test (a,b,c) { return a+b+c; }', '1,2,3').join('\n'),
            'function test (a,b,c) {\n' + makeTabs(1) + 'return a + b + c;\n}'
        );
    }) ;
});

describe('Test', () => {
    it('variable declarations', () => {
        assert.equal(
            parseCode('function test (a,b,c) { let x = a; let y = b; let z = c; return x+y+z; }', '1,2,3').join('\n'),
            'function test (a,b,c) {\n' + makeTabs(1) + 'return a + b + c;\n}'
        );
    }) ;
});

describe('Test', () => {
    it('assignment 1', () => {
        assert.equal(
            parseCode('function test (a,b,c) { let x = a; x = x + 5; return x; }', '1,2,3').join('\n'),
            'function test (a,b,c) {\n' + makeTabs(1) + 'return a + 5;\n}'
        );
    }) ;
});

describe('Test', () => {
    it('assignment 2', () => {
        assert.equal(
            parseCode('function test (a,b,c) { let x = a; a = x + 5; return x; }', '1,2,3').join('\n'),
            'function test (a,b,c) {\n' + makeTabs(1) + 'a = a + 5;\n' + makeTabs(1) + 'return a;\n}'
        );
    }) ;
});

describe('Test', () => {
    it('update 1', () => {
        assert.equal(
            parseCode('function test (a,b,c) { let x = a; x++; return x; }', '1,2,3').join('\n'),
            'function test (a,b,c) {\n' + makeTabs(1) + 'return a + 1;\n}'
        );
    }) ;
});

describe('Test', () => {
    it('update 2', () => {
        assert.equal(
            parseCode('function test (a,b,c) { a++; return a; }', '1,2,3').join('\n'),
            'function test (a,b,c) {\n' + makeTabs(1) + 'a++;\n' + makeTabs(1) + 'return a;\n}'
        );
    }) ;
});

describe('Test', () => {
    it('update 1', () => {
        assert.equal(
            parseCode('function test (a,b,c) { let x = a; x--; return x; }', '1,2,3').join('\n'),
            'function test (a,b,c) {\n' + makeTabs(1) + 'return a - 1;\n}'
        );
    }) ;
});

describe('Test', () => {
    it('while', () => {
        assert.equal(
            parseCode('function test (a,b,c) { while(a < b){a++;} return a;}', '1,2,3').join('\n'),
            'function test (a,b,c) {\n' + makeTabs(1) + 'while(a < b) {\n' + makeTabs(2) + 'a++;\n' + makeTabs(1) + '}\n' + makeTabs(1) + 'return a;\n}'
        );
    }) ;
});

describe('Test', () => {
    it('if without else', () => {
        assert.equal(
            parseCode('function test () {if (1 < 2) {return 0;} return 1; }', '1,2').join('\n'),
            'function test () {\n' + (makeTabs(1) + 'if(1 < 2) {').fontcolor('green') + '\n' + makeTabs(2) + 'return 0;\n' + makeTabs(1) + '}\n'+  makeTabs(1) + 'return 1;\n}'
        );
    }) ;
});

describe('Test', () => {
    it('if with else', () => {
        assert.equal(
            parseCode('function test (a,b) {if (a < b) {return 0;} else return 1; }', '3,2').join('\n'),
            'function test (a,b) {\n' + (makeTabs(1) + 'if(a < b) {').fontcolor('red') + '\n' + makeTabs(2) + 'return 0;\n' + makeTabs(1) + '}\n'+  makeTabs(1) + 'else {\n' + makeTabs(2) + 'return 1;\n' + makeTabs(1) + '}\n}'
        );
    }) ;
});

describe('Test', () => {
    it('if else if', () => {
        assert.equal(
            parseCode('function test (a,b) {if (a === b) {return 0;} else if(a>b)return a; else return b;}', '3,2').join('\n'),
            'function test (a,b) {\n' + (makeTabs(1) + 'if(a === b) {').fontcolor('red') + '\n' + makeTabs(2) + 'return 0;\n' + makeTabs(1) + '}\n'+  (makeTabs(1) + 'else if(a > b) {').fontcolor('green') + '\n' + makeTabs(2) + 'return a;\n' + makeTabs(1) + '}\n' + makeTabs(1) + 'else {\n' + makeTabs(2) + 'return b;\n' + makeTabs(1) + '}\n}'
        );
    }) ;
});

describe('Test', () => {
    it('resolve binary', () => {
        assert.equal(
            parseCode('function test(a,b,c,d){\n' +
                '     let x = a-b;\n' +
                '     let y = a*c;\n' +
                '     let z = a / d;\n' +
                '     let b1 = x > y;\n' +
                '     let b2 = y < z;\n' +
                '     let b3 = z <= x;\n' +
                '     let b4 = y >= x;\n' +
                '     let b5 = b1 == b2;\n' +
                '     let b6 = b3 == b4;\n' +
                '     let b7 = b5 === b6;\n' +
                '     return b7;\n' +
                '}', '8,1,0,2').join('\n'),
            'function test (a,b,c,d) {\n' + makeTabs(1)+ 'return a - b > a * c == a * c < a / d === a / d <= a - b == a * c >= a - b;\n}'
        );
    }) ;
});

describe('Test', () => {
    it('resolve unary', () => {
        assert.equal(
            parseCode('function test(a){\n' +
                '     let x = -1;\n' +
                '     return a+x;\n' +
                '}', '3').join('\n'),
            'function test (a) {\n' + makeTabs(1) + 'return a + -1;\n}'
        );
    }) ;
});

describe('Test', () => {
    it('resolve array', () => {
        assert.equal(
            parseCode('function test(){\n' +
                '     let x = [0,1,2];\n' +
                '     return x[0];\n' +
                '}').join('\n'),
            'function test () {\n' + makeTabs(1) + 'return [0,1,2][0];\n}'
        );
    }) ;
});

describe('Test', () => {
    it('auxiliary', () => {
        assert.equal(
            parseCode('function test (a) {let b; return a;}', '3').join('\n'),
            'function test (a) {\n' + makeTabs(1) + 'return a;\n}'
        );
    }) ;
});

