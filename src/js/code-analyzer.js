import * as esprima from 'esprima';

const parseCode = (txt1, txt2) => {
    initializeExpressionDictionary();
    initializeValueDictionary();
    args = esprima.parse('[' + txt2 + ']').body[0].expression.elements.map(resolveValue);
    let ans = handleSingleElement(esprima.parseScript(txt1), 0);
    return ans;
};

let expressionDictionary;
let valueDictionary;
let origins = [];
let args;
let variables = {};
let stringVariables = {};

let goInside = (arr, tabs) => arr.map (inner => handleSingleElement(inner, tabs)).flat();

const initializeExpressionDictionary = () => {
    expressionDictionary = {
        Program : handleProgram,
        FunctionDeclaration : handleFunctionDeclaration,
        BlockStatement : handelBlockStatement,
        ReturnStatement : handleReturnStatement,
        VariableDeclaration : handleVariableDeclaration,
        VariableDeclarator : handleVariableDeclarator,
        ExpressionStatement : handleExpressionStatement,
        WhileStatement : handleWhileExpression,
        IfStatement : handleIfExpression,
        UpdateExpression : handleUpdateStatement,
        AssignmentExpression : handleAssignmentStatement
    };
};

const handleSingleElement = (p, tabs) => {
    return expressionDictionary[p.type](p, tabs);
};

const handleProgram = (p, tabs) => {
    return goInside(p.body, tabs);
};

const handelBlockStatement = (p, tabs) => {
    return goInside(p.body, tabs);
};

const handleFunctionDeclaration = (p, tabs) => {
    handleFunctionIdentifiers(p.params);
    let params = p.params.map(pa => pa.name).join(',');
    let ts = makeTabs(tabs);
    let ans = [ts + 'function ' + p.id.name + ' (' + params + ') {']
        .concat(handleSingleElement(p.body, tabs + 1))
        .concat([ ts + '}']);
    return ans;
};

const handleFunctionIdentifiers = idents => {
    for (let i = 0; i < idents.length; i++) {
        origins.push(idents[i].name);
        variables[idents[i].name] = args[i];
        stringVariables[idents[i].name] = idents[i].name;
    }
};

const handleVariableDeclaration = p => {
    return goInside(p.declarations);
};

const handleVariableDeclarator = p => {
    variables[p.id.name] = resolveValue(p.init);
    stringVariables[p.id.name] = resolveStringValue(p.init);
    return [];
};

const handleExpressionStatement = (p, tabs) => {
    return handleSingleElement(p.expression, tabs);
};

const handleAssignmentStatement = (p, tabs) => {
    if(!origins.includes(p.left.name)){
        variables[p.left.name] = resolveValue(p.right);
        stringVariables[p.left.name] = resolveStringValue(p.right);
        return [];
    }
    else {
        return [makeTabs(tabs) + p.left.name + ' = ' + resolveStringValue(p.right) + ';'];
    }
};

const handleUpdateStatement = (p, tabs) => {
    if(!origins.includes(p.argument.name)){
        variables[p.argument.name] = resolveValue(p.argument) + (p.operator === '++' ? 1 : -1);
        stringVariables[p.argument.name] += (p.operator === '++' ? ' + 1' : ' - 1');
        return [];
    }
    else {
        return [makeTabs(tabs) + p.argument.name + p.operator + ';'];
    }
};

const handleWhileExpression = (p, tabs) => {
    let ts = makeTabs(tabs);
    return [ ts + 'while(' + resolveStringValue(p.test) + ') {']
        .concat(handleSingleElement(p.body, tabs + 1))
        .concat([ts + '}']);
};

const handleIfExpression = (p, tabs) => {
    let ts = makeTabs(tabs);
    let temp = [copyDictionary(variables), copyDictionary(stringVariables)];
    let first = [changeColor(ts + 'if(' + resolveStringValue(p.test) + ') {', p.test)]
        .concat(handleSingleElement(p.consequent, tabs + 1))
        .concat([ts + '}']);
    variables = temp[0];
    stringVariables = temp[1];
    let second = p.alternate === null ? [] :
        p.alternate.type === 'IfStatement' ? handleSecondIf(p.alternate, tabs) :
            [ts + 'else {']
                .concat(handleSingleElement(p.alternate, tabs + 1))
                .concat([ts + '}']);
    variables = temp[0];
    stringVariables = temp[1];
    return first.concat(second);
};

const handleSecondIf = (second, tabs) => {
    let parsed = handleSingleElement(second, tabs);
    let f = parsed[0];
    let start = f.indexOf('if');
    let n = f.slice(0, start) + 'else ' + f.slice(start);
    parsed[0] = n;
    return parsed;
};

const changeColor = (line, test) => {
    if (resolveValue(test))
        return line.fontcolor('green');
    else
        return line.fontcolor('red');
};

const handleReturnStatement = (p, tabs) => {
    return [makeTabs(tabs) + 'return ' + resolveStringValue(p.argument) + ';'];
};


const initializeValueDictionary = () => {
    valueDictionary = {
        Identifier : resolveIdentifier,
        Literal : resolveLiteral,
        BinaryExpression : resolveBinary,
        UnaryExpression : resolveUnary,
        ArrayExpression : resolveArray,
        MemberExpression : resolveMember
    }  ;
};

const resolveValue = v => v == null ? null : valueDictionary[v.type](v);

const resolveIdentifier = v => variables[v.name];

const resolveLiteral = v => v.value;

const resolveBinary = v => ({
    '+' : ((a, b) => a + b),
    '-' : ((a, b) => a - b),
    '*' : ((a, b) => a * b),
    '/' : ((a, b) => a / b),
    '<' : ((a, b) => a < b),
    '>' : ((a, b) => a > b),
    '<=' : ((a, b) => a <= b),
    '>=' : ((a, b) => a >= b),
    '===' : ((a, b) => a === b),
    '==' : ((a, b) => a == b)
})[v.operator](resolveValue(v.left), resolveValue(v.right));

const resolveUnary = v => -resolveValue(v.argument);

const resolveArray = v => v.elements.map(resolveValue);

const resolveMember = v => resolveValue(v.object)[resolveValue(v.property)];



const resolveStringValue = v => v == null ? null : ({
    Identifier : resolveStringIdentifier,
    Literal : resolveStringLiteral,
    BinaryExpression : resolveStringBinary,
    UnaryExpression : resolveStringUnary,
    ArrayExpression : resolveStringArray,
    MemberExpression: resolveStringMember
})[v.type](v);

const resolveStringIdentifier = v => stringVariables[v.name];

const resolveStringLiteral = v => v.value;

const resolveStringBinary = v => resolveStringValue(v.left) + ' ' + v.operator + ' ' + resolveStringValue(v.right);

const resolveStringUnary = v => '-' + resolveStringValue(v.argument);

const resolveStringArray = v => '[' + v.elements.map(resolveStringValue).join(',') + ']';

const resolveStringMember = v => resolveStringValue(v.object) + '[' + resolveStringValue(v.property) + ']';

Object.defineProperty(Array.prototype, 'flat', {
    value: function() {
        return this.reduce(function (flat, toFlatten) {
            return flat.concat(toFlatten);
        }, []);
    }
});

const copyDictionary = d => {
    let newObj = {};

    Object.keys(d).forEach(function(key) {
        newObj[ key ] = d[ key ];
    });
    return newObj;
};

const makeTabs = amount => {
    let ans = '';
    for (let i = 0; i < amount; i++)
        ans += 'qqqq'.fontcolor('white');
    return ans;
};


export {parseCode, makeTabs};
