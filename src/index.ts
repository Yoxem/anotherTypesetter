import { Token } from 'typescript-parsec';
import { buildLexer, expectEOF, expectSingleResult, rule } from 'typescript-parsec';
import { alt, apply, kright, kmid, kleft, rep_sc, seq, str, tok, opt } from 'typescript-parsec';

enum TokenKind{
    Id,
    Int,
    Flo,
    Str,
    LParen,
    RParen,
    SpaceNL,
    At,
    BSlash,
    Other
    
}

enum ItemType{
    Int,
    Flo,
    Id,
    Str,
}

interface Item{
    type : ItemType, 
    int? : BigInt,
    flo? : number,
    str? : string,
    id? : string,

}

type AST = Item | AST[];

const tokenizer = buildLexer([
    [true, /^\d+/g,  TokenKind.Int],
    [true, /^\d+\.\d+/g,  TokenKind.Flo],
    [true, /^[\+\-\*\\\w_][0-9\+\-\*\\\w]*/g,  TokenKind.Id],
    [true, /^\"([^\"]|\\\")+\"/g,  TokenKind.Str],
    [true, /^\(/g, TokenKind.LParen],
    [true, /^\)/g, TokenKind.RParen],
    [true, /^(\s|\t|\r?\n)+/g, TokenKind.SpaceNL],
    [true, /^\@/g, TokenKind.At],
    [true, /^\\/g, TokenKind.BSlash],
    [true, /^[.]+/g, TokenKind.Other],
]);

const SINGLE = rule<TokenKind, AST>();
const SINGLES = rule<TokenKind, AST>();
const PROG_INNER = rule<TokenKind, AST>();
const STRINGS = rule<TokenKind, AST>();
const STRING = rule<TokenKind, AST>();


function applyId(value: Token<TokenKind.Id>): Item {
    return {
        type : ItemType.Id,
        id : value.text};
}

function applyInt(value: Token<TokenKind.Int>): Item {
    return {
        type : ItemType.Int,
        int : BigInt(value.text)};
}

function applyFlo(value: Token<TokenKind.Flo>): Item {
    return {
        type : ItemType.Flo,
        flo : +value.text};
}

function applyStr(value: Token<TokenKind.Str>): Item {
    return {
        type : ItemType.Str,
        str : value.text};
}


function applyInt(value: Token<TokenKind.Int>): Item {
    return {
        type : ItemType.Int,
        int : BigInt(value.text)};
}

function applyFlo(value: Token<TokenKind.Flo>): Item {
    return {
        type : ItemType.Flo,
        flo : +value.text};
}

function applyStr(value: Token<TokenKind.Str>): Item {
    return {
        type : ItemType.Str,
        str : value.text};
}

function applyList(value: AST[]):AST{
    return value;
}

/** for convinence to omit the spaces and newlines */
let __ = opt(tok(TokenKind.SpaceNL))

function getInsideParathesis (value: [Token<TokenKind>, Token<TokenKind>|undefined, AST, Token<TokenKind>]){
    return value[2];
}

function giveAST (value: AST){
    return value;
}

/**  SINGLE ::= Int| Flo | Str | Id  */
SINGLE.setPattern(
    alt(
        apply(tok(TokenKind.Id), applyId),
        apply(tok(TokenKind.Int), applyInt),
        apply(tok(TokenKind.Flo), applyFlo),
        apply(tok(TokenKind.Str), applyStr),
        apply(seq(tok(TokenKind.LParen),__, SINGLES,tok(TokenKind.RParen)),getInsideParathesis),
    ))



/** SINGLES ::= SINGLE  SP_NL? */
SINGLES.setPattern(
    apply(rep_sc(kleft(SINGLE, __)), applyList))





/**  PROG_INNER ::= "(" SP_NL? SINGLES ")" */
PROG_INNER.setPattern(
    apply(
        kmid(str('@'), SINGLE, str('@')),
        giveAST
    )
)

/**  PROG_INNER ::= "(" SP_NL? SINGLES ")" */
STRING.setPattern(
    alt(
        apply(tok(TokenKind.Id),idToStr),
        apply(tok(TokenKind.Float),fLoatToStr),

    ))
)



function evaluate(expr: string): AST {
    let a = expectSingleResult(expectEOF(PROG_INNER.parse(tokenizer.parse(expr))));
    console.log(a);
    return a;
}



[true, /^\d+/g,  TokenKind.Int],
[true, /^\d+\.\d+/g,  TokenKind.Flo],
[true, /^[\+\-\*\\\w_][0-9\+\-\*\\\w]*/g,  TokenKind.Id],
[true, /^\"([^\"]|\\\")+\"/g,  TokenKind.Str],
[true, /^\(/g, TokenKind.LParen],
[true, /^\)/g, TokenKind.RParen],
[true, /^(\s|\t|\r?\n)+/g, TokenKind.SpaceNL],
[true, /^\@/g, TokenKind.At],
[true, /^\\/g, TokenKind.BSlash],
[true, /^[.]+/g, TokenKind.Other],







evaluate("@(let (a 17) (+ a 10))@")