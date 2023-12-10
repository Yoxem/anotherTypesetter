"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.astToSExp = void 0;
const parsec = require("typescript-parsec"); // import parsec
/* for test */
const assert = require("assert");
/** the type of token  */
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Int"] = 0] = "Int";
    TokenKind[TokenKind["Flo"] = 1] = "Flo";
    TokenKind[TokenKind["Id"] = 2] = "Id";
    TokenKind[TokenKind["At"] = 3] = "At";
    TokenKind[TokenKind["Comt"] = 4] = "Comt";
    TokenKind[TokenKind["Str"] = 5] = "Str";
    TokenKind[TokenKind["Lambda"] = 6] = "Lambda";
    TokenKind[TokenKind["Assign"] = 7] = "Assign";
    TokenKind[TokenKind["Set"] = 8] = "Set";
    TokenKind[TokenKind["Keyword"] = 9] = "Keyword";
    TokenKind[TokenKind["LParen"] = 10] = "LParen";
    TokenKind[TokenKind["RParen"] = 11] = "RParen";
    TokenKind[TokenKind["Space"] = 12] = "Space";
    TokenKind[TokenKind["NewPara"] = 13] = "NewPara";
    TokenKind[TokenKind["MainTxt"] = 14] = "MainTxt";
})(TokenKind || (TokenKind = {}));
/** from AST to S-exp */
function astToSExp(ast) {
    // if it's an array
    if (Array.isArray(ast)) {
        return "(" + ast.map((x) => astToSExp(x)).join(" ") + ")";
        // if it's a item
    }
    else {
        return ast.text;
    }
}
exports.astToSExp = astToSExp;
// tokenizer
const tokenizer = parsec.buildLexer([
    [true, /^\d+/g, TokenKind.Int],
    [true, /^\d+\.\d+/g, TokenKind.Flo],
    [true, /^(let|in|fn)/g, TokenKind.Keyword],
    [true, /^[_a-zA-Z][_0-9a-zA-Z]*/g, TokenKind.Id],
    [true, /^\@/g, TokenKind.At],
    /* inside comment, only accept 1. non / character
    or  2. "/ + non * character" */
    [true, /^\/\*(\/[^*]|[^\\]?)*\*\//g, TokenKind.Comt],
    [true, /^\"(\\\"|[^\"]?)*\"/g, TokenKind.Str],
    [true, /^\:\=/g, TokenKind.Set],
    [true, /^\=/g, TokenKind.Assign],
    [true, /^->/g, TokenKind.Lambda],
    [true, /^\(/g, TokenKind.LParen],
    [true, /^\)/g, TokenKind.RParen],
    [true, /^([ \t]+|[ \t]*\r?\n[ \t]*)/g, TokenKind.Space],
    [true, /^(\r?\n){2}/g, TokenKind.NewPara],
    [true, /^(\\\@|[^@\s])/g, TokenKind.MainTxt],
]);
/** ignore spaces ,new lines, and comments */
const _ = parsec.opt(parsec.alt(parsec.tok(TokenKind.Space), parsec.tok(TokenKind.NewPara), 
// space or newPara + comment + space or newPara
parsec.seq(parsec.opt(parsec.alt(parsec.tok(TokenKind.Space), parsec.tok(TokenKind.NewPara))), parsec.tok(TokenKind.Comt), parsec.opt(parsec.alt(parsec.tok(TokenKind.Space), parsec.tok(TokenKind.NewPara))))));
function applyInteger(value) {
    // extend value to ASTNode
    const newNode = {
        actualValue: BigInt(value.text),
        ...value
    };
    return newNode;
}
function applyFloat(value) {
    const newNode = {
        actualValue: parseFloat(value.text),
        ...value
    };
    return newNode;
}
function applyString(value) {
    const newNode = {
        // get only text[1,2,...,the second last char]
        actualValue: value.text.slice(1, value.text.length - 1).replace(/\\\"/g, "\""),
        ...value
    };
    return newNode;
}
function applyIdentifier(value) {
    const newNode = {
        actualValue: value.text,
        ...value
    };
    return newNode;
}
/** apply LETTING.
 * returns [let, [var, x], expr] */
function applyLetting(input) {
    // node representing let
    let letNode = input[0];
    let varNode = input[2];
    let valueNode = input[6];
    let exprAST = input[10];
    return [letNode, [varNode, valueNode], exprAST];
}
/** apply SETTING */
function applySetting(input) {
    // node representing let
    let setNode = input[2];
    let varNode = input[0];
    let valueNode = input[4];
    let exprAST = input[8];
    //  (:= (var val) expr) : set var = val in expr
    return [setNode, [varNode, valueNode], exprAST];
}
function applyLambda(input) {
    let lambdaNode = input[0];
    let argHead = input[1];
    let argTail = input[2];
    let body = input[6];
    let args = [argHead].concat(argTail);
    // return (fn (args) body) like lambda in Scheme
    return [lambdaNode, args, body];
}
function applyApplying(input) {
    let applier = input[0];
    let applieeHead = input[2];
    let applieeTail = input[3];
    let appliee = [(applieeHead)].concat(applieeTail);
    // foo 2 3 => (foo (2 3))
    return [applier, appliee];
}
/** define all the parser sentence */
const CONST = parsec.rule();
const VAR = parsec.rule();
const ARG = parsec.rule();
const EXPR = parsec.rule();
const LETTING = parsec.rule();
const SETTING = parsec.rule();
const LAMBDA = parsec.rule();
const APPLYING = parsec.rule();
/*
CONST ::=  INT | FLOAT | STRING
*/
CONST.setPattern(parsec.alt(parsec.apply(parsec.tok(TokenKind.Int), applyInteger), parsec.apply(parsec.tok(TokenKind.Flo), applyFloat), parsec.apply(parsec.tok(TokenKind.Str), applyString)));
/** VAR = ID  */
VAR.setPattern(parsec.apply(parsec.tok(TokenKind.Id), applyIdentifier));
/** ARG = ID  */
ARG.setPattern(parsec.apply(parsec.tok(TokenKind.Id), applyIdentifier));
/**SETTING ::= VAR ":=" EXPR in EXPR
 * and ignore the spaces and new lines with `_`
*/
SETTING.setPattern(parsec.apply(parsec.seq(VAR, _, parsec.str(":="), _, EXPR, _, parsec.str("in"), _, EXPR), applySetting));
/**LETTING ::= "let" VAR "=" EXPR in EXPR
 * and ignore the spaces and new lines with `_`
*/
LETTING.setPattern(parsec.apply(parsec.seq(parsec.str("let"), _, VAR, _, parsec.str("="), _, EXPR, _, parsec.str("in"), _, EXPR), applyLetting));
/**LAMBDA ::= "fn" (Args)+ "->" EXPR
 * and ignore the spaces and new lines with `_`
*/
LAMBDA.setPattern(parsec.apply(parsec.seq(parsec.str("fn"), parsec.kright(_, ARG), // arg SpaceNL
parsec.rep_sc(parsec.kright(_, ARG)), //other (arg SpaceNL), repeat 0+times
_, parsec.str("->"), _, EXPR), applyLambda));
// APPLYING = ( "(" APPLYING ")" |LAMBDA|VAR) APPLIEE+
APPLYING.setPattern(parsec.apply(parsec.seq(parsec.alt(LAMBDA, VAR, parsec.kmid(parsec.seq(parsec.str('('), _), APPLYING, parsec.seq(_, parsec.str(')')))), _, EXPR, parsec.rep_sc(parsec.kright(_, EXPR))), applyApplying));
/** EXPR = CONST | VAR
 * | LETTING | SETTING
 * | LAMBDA | APPLYING
 * | "(" APPLYING ")" */
EXPR.setPattern(parsec.alt(CONST, VAR, LETTING, SETTING, LAMBDA, parsec.kmid(parsec.seq(parsec.str('('), _), APPLYING, parsec.seq(_, parsec.str(')')))));
function mainParse(inputStr) {
    return parsec.expectSingleResult(parsec.expectEOF(EXPR.parse(tokenizer.parse(inputStr))));
}
// test
function main() {
    // bigint has suffix `n`
    assert.strictEqual(mainParse('123455667').actualValue, 123455667n);
    assert.strictEqual(mainParse('000').actualValue, 0n);
    assert.strictEqual(mainParse('1.22').actualValue, 1.22);
    assert.strictEqual(mainParse('0.0').actualValue, 0.0);
    assert.strictEqual(mainParse(`""`).actualValue, "");
    assert.strictEqual(mainParse(`"the little town"`).actualValue, `the little town`);
    assert.strictEqual(mainParse(`"\\\"Alice\\\""`).actualValue, `"Alice"`);
    assert.strictEqual(mainParse(`foo`).actualValue, "foo");
    assert.strictEqual(astToSExp(mainParse(`let x = 12 in 23`)), "(let (x 12) 23)");
    assert.strictEqual(astToSExp(mainParse(`let y = 10 in let x = 12 in 23`)), "(let (y 10) (let (x 12) 23))");
    assert.strictEqual(astToSExp(mainParse(`let y = 10 in y := 12 in 23`)), "(let (y 10) (:= (y 12) 23))");
    assert.strictEqual(astToSExp(mainParse(`fn x y -> 234`)), "(fn (x y) 234)");
    assert.strictEqual(astToSExp(mainParse(`(add 12 23 )`)), "(add (12 23))");
    assert.strictEqual(astToSExp(mainParse(`(foo x y)`)), "(foo (x y))");
    assert.strictEqual(astToSExp(mainParse(`((foo 6 7) bar)`)), "((foo (6 7)) (bar))");
    assert.strictEqual(astToSExp(mainParse(`fn x y ->
    /* foo bar */
    (foo x y)`)), "(fn (x y) (foo (x y)))");
}
;
main();
//# sourceMappingURL=index.js.map