"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.astToSExp = void 0;
const p = require("typescript-parsec"); // import p
/* for test */
const assert = require("assert");
/** the type of token  */
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Flo"] = 0] = "Flo";
    TokenKind[TokenKind["Int"] = 1] = "Int";
    TokenKind[TokenKind["At"] = 2] = "At";
    TokenKind[TokenKind["Id"] = 3] = "Id";
    TokenKind[TokenKind["RArr"] = 4] = "RArr";
    TokenKind[TokenKind["SColon"] = 5] = "SColon";
    TokenKind[TokenKind["LPar"] = 6] = "LPar";
    TokenKind[TokenKind["RPar"] = 7] = "RPar";
    TokenKind[TokenKind["Assign"] = 8] = "Assign";
    TokenKind[TokenKind["Op"] = 9] = "Op";
    TokenKind[TokenKind["Hash"] = 10] = "Hash";
    TokenKind[TokenKind["Com"] = 11] = "Com";
    TokenKind[TokenKind["BSlash"] = 12] = "BSlash";
    TokenKind[TokenKind["Str"] = 13] = "Str";
    TokenKind[TokenKind["LitStr"] = 14] = "LitStr";
    TokenKind[TokenKind["Space"] = 15] = "Space";
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
const tokenizer = p.buildLexer([
    [true, /^\d+[.]\d+/g, TokenKind.Flo],
    [true, /^\d+/g, TokenKind.Int],
    [true, /^[@]/g, TokenKind.At],
    [true, /^[_\w][_\d\w]*/g, TokenKind.Id],
    [true, /^->/g, TokenKind.RArr],
    [true, /^[;]/g, TokenKind.SColon],
    [true, /^[(]/g, TokenKind.LPar],
    [true, /^[)]/g, TokenKind.RPar],
    [true, /^[=]/g, TokenKind.Assign],
    [true, /^([\+\-\*\/]|[!<>=]=)/g, TokenKind.Op],
    [true, /^#[^#]*#/g, TokenKind.Com],
    [true, /^[\\]/g, TokenKind.BSlash],
    [true, /^\"([^"]|[\\\"])*\"/g, TokenKind.Str],
    [true, /^([^\\]+?)/g, TokenKind.LitStr],
    [true, /^\s+/g, TokenKind.Space],
]);
/** ignore spaces ,new lines, and comments */
//const _ = p.opt(p.alt(
//    p.tok(TokenKind.Space),
//    p.tok(TokenKind.Com),
//    )
//);
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
/** define all the parser sentence */
const CONST = p.rule();
/*const VAR = p.rule<TokenKind, ASTNode>();
const ARG = p.rule<TokenKind, ASTNode>();
const EXPR = p.rule<TokenKind, AST>();
const LETTING = p.rule<TokenKind, AST>();
const LAMBDA = p.rule<TokenKind, AST>();
const APPLYING = p.rule<TokenKind, AST>(); */
CONST.setPattern(p.alt(p.apply(p.tok(TokenKind.Flo), applyFloat), p.apply(p.tok(TokenKind.Int), applyInteger), p.apply(p.tok(TokenKind.Str), applyString)));
function mainParse(inputStr) {
    return p.expectSingleResult(p.expectEOF(CONST.parse(tokenizer.parse(inputStr))));
}
// test
function main() {
    assert.strictEqual(mainParse("123").actualValue, 123n);
    assert.strictEqual(mainParse("3.14").actualValue, 3.14);
    assert.strictEqual(mainParse("\"foo\"").actualValue, "foo");
}
;
main();
//# sourceMappingURL=index.js.map