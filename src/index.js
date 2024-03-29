"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_parsec_1 = require("typescript-parsec");
const typescript_parsec_2 = require("typescript-parsec");
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Id"] = 0] = "Id";
    TokenKind[TokenKind["Int"] = 1] = "Int";
    TokenKind[TokenKind["Flo"] = 2] = "Flo";
    TokenKind[TokenKind["Str"] = 3] = "Str";
    TokenKind[TokenKind["LParen"] = 4] = "LParen";
    TokenKind[TokenKind["RParen"] = 5] = "RParen";
    TokenKind[TokenKind["SpaceNL"] = 6] = "SpaceNL";
    TokenKind[TokenKind["At"] = 7] = "At";
    TokenKind[TokenKind["BSlash"] = 8] = "BSlash";
    TokenKind[TokenKind["Other"] = 9] = "Other";
})(TokenKind || (TokenKind = {}));
var ItemType;
(function (ItemType) {
    ItemType[ItemType["Int"] = 0] = "Int";
    ItemType[ItemType["Flo"] = 1] = "Flo";
    ItemType[ItemType["Id"] = 2] = "Id";
    ItemType[ItemType["Str"] = 3] = "Str";
})(ItemType || (ItemType = {}));
const tokenizer = (0, typescript_parsec_1.buildLexer)([
    [true, /^\d+/g, TokenKind.Int],
    [true, /^\d+\.\d+/g, TokenKind.Flo],
    [true, /^[\+\-\*\\\w_][0-9\+\-\*\\\w]*/g, TokenKind.Id],
    [true, /^\"([^\"]|\\\")+\"/g, TokenKind.Str],
    [true, /^\(/g, TokenKind.LParen],
    [true, /^\)/g, TokenKind.RParen],
    [true, /^(\s|\t|\r?\n)+/g, TokenKind.SpaceNL],
    [true, /^\@/g, TokenKind.At],
    [true, /^\\/g, TokenKind.BSlash],
    [true, /^[.]+/g, TokenKind.Other],
]);
const SINGLE = (0, typescript_parsec_1.rule)();
const SINGLES = (0, typescript_parsec_1.rule)();
const PROG_INNER = (0, typescript_parsec_1.rule)();
function applyId(value) {
    return {
        type: ItemType.Id,
        id: value.text
    };
}
function applyInt(value) {
    return {
        type: ItemType.Int,
        int: BigInt(value.text)
    };
}
function applyFlo(value) {
    return {
        type: ItemType.Flo,
        flo: +value.text
    };
}
function applyStr(value) {
    return {
        type: ItemType.Str,
        str: value.text
    };
}
function applyList(value) {
    return value;
}
/** for convinence to omit the spaces and newlines */
let __ = (0, typescript_parsec_2.opt)((0, typescript_parsec_2.tok)(TokenKind.SpaceNL));
function getInsideParathesis(value) {
    return value[2];
}
function giveAST(value) {
    return value;
}
/**  SINGLE ::= Int| Flo | Str | Id  */
SINGLE.setPattern((0, typescript_parsec_2.alt)((0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Id), applyId), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Int), applyInt), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Flo), applyFlo), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Str), applyStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.seq)((0, typescript_parsec_2.tok)(TokenKind.LParen), __, SINGLES, (0, typescript_parsec_2.tok)(TokenKind.RParen)), getInsideParathesis)));
/** SINGLES ::= SINGLE  SP_NL? */
SINGLES.setPattern((0, typescript_parsec_2.apply)((0, typescript_parsec_2.rep_sc)((0, typescript_parsec_2.kleft)(SINGLE, __)), applyList));
/**  PROG_INNER ::= "(" SP_NL? SINGLES ")" */
PROG_INNER.setPattern((0, typescript_parsec_2.apply)((0, typescript_parsec_2.kmid)((0, typescript_parsec_2.str)('@'), SINGLE, (0, typescript_parsec_2.str)('@')), giveAST));
function evaluate(expr) {
    let a = (0, typescript_parsec_1.expectSingleResult)((0, typescript_parsec_1.expectEOF)(PROG_INNER.parse(tokenizer.parse(expr))));
    console.log(a);
    return a;
}
evaluate("@(let (a 17) (+ a 10))@");
