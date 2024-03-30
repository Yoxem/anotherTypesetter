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
    LBrack,
    RBrack,
    SpaceNL,
    BSlash,
    Apos,
    Other
    
}

enum ItemType{
    Int,
    Flo,
    Id,
    Str,
}

type Item = ItemStr | ItemInt | ItemId | ItemFlo;



interface ItemStr{
    type : ItemType.Str, 
    str : string,
}

interface ItemInt{
    type : ItemType.Int, 
    int : BigInt,
}

interface ItemId{
    type : ItemType.Id, 
    id : string,
}


interface ItemFlo{
    type : ItemType.Flo, 
    flo : number,
}

type AST = Item | AST[];

const tokenizer = buildLexer([
    [true, /^\d+/g,  TokenKind.Int],
    [true, /^\d+\.\d+/g,  TokenKind.Flo],
    [true, /^[+\-*/a-zA-Z_][0-9+\-*/a-zA-Z_]*/g,  TokenKind.Id],
    [true, /^\"([^\"]|\\\")+\"/g,  TokenKind.Str],
    [true, /^[(]/g, TokenKind.LParen],
    [true, /^[)]/g, TokenKind.RParen],
    [true, /^\[/g, TokenKind.LBrack],
    [true, /^\]/g, TokenKind.RBrack],
    [true, /^'/g, TokenKind.Apos],
    [true, /^(\s|\t|\r?\n)+/g, TokenKind.SpaceNL],
    [true, /^\\/g, TokenKind.BSlash],
    [true, /^([^+\-*/a-zA-Z_0-9\[\]()'\s\t\r\n\\]+)/g, TokenKind.Other],
]);

/**
 * ## BNF
LISP = UNIT | LISPS | CON_STR
LISPS = "(" LISP ")" | "'" "(" LISP ")"
SINGLE = "{" CONSTR_INNR | LISP "}"
UNIT = INT | NUMBER | STRING | ID
CONSTR = "[" (CONSTR_INNER "]"
CONSTR_INNER = ([^\\\[\][]] | [\\][{}\[\]]) | LISPS)*
 */

const SINGLE = rule<TokenKind, AST>();
const LISPS = rule<TokenKind, AST>();
const LISP = rule<TokenKind, AST>();
const CON_STR = rule<TokenKind, AST>();
const CON_STR_INNER = rule<TokenKind, AST>();



function tokenToStr(value: Token<TokenKind>): Item {
    return {
        type : ItemType.Str,
        str : value.text};
}


function bSlashTokenToStr(value: Token<TokenKind>): Item {
    return {
        type : ItemType.Str,
        str : value.text};
}


function applyId(value: Token<TokenKind.Id>): Item {
    return {
        type :ItemType.Id,
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
        str : value.text.slice(1,value.text.length-1)};
}

function applyList(value: AST[]):AST{
    return value;
}

function applyQuoted(value: AST[]):AST{
    let head : Item = {type : ItemType.Id,
        id:"quote"}
        let merged = [head, value];
        return merged;
}

function applyStrings(value: AST[]):AST{
    let head : AST[] = [{type : ItemType.Id,
    id:"%concat"}]
    let merged = head.concat(value);
    return merged;
}

/** for convinence to omit the spaces and newlines */
let __ = opt(tok(TokenKind.SpaceNL))

LISP.setPattern(
    alt(
        kleft(SINGLE, __),
        kleft(LISPS, __),
        kleft(CON_STR, __)
    ))

SINGLE.setPattern(
    alt(
        apply(tok(TokenKind.Id), applyId),
        apply(tok(TokenKind.Int), applyInt),
        apply(tok(TokenKind.Flo), applyFlo),
        apply(tok(TokenKind.Str), applyStr),
    ))



LISPS.setPattern(
alt(
    apply(kmid(seq(str("("), __),rep_sc(LISP),str(")")), applyList),
    apply(kright(str("'"),
            kmid(seq(str("("), __),rep_sc(LISP),str(")"))), applyQuoted),
))




CON_STR_INNER.setPattern(
    alt(
        apply(tok(TokenKind.Id),tokenToStr),
        apply(tok(TokenKind.Int),tokenToStr),
        apply(tok(TokenKind.Flo),tokenToStr),
        apply(tok(TokenKind.Str),tokenToStr),
        apply(tok(TokenKind.Other),tokenToStr),
        apply(tok(TokenKind.SpaceNL), tokenToStr),
        apply(kright(tok(TokenKind.BSlash),tok(TokenKind.LParen)), tokenToStr),
        apply(kright(tok(TokenKind.BSlash),tok(TokenKind.RParen)), tokenToStr),
        apply(kright(tok(TokenKind.BSlash),tok(TokenKind.LBrack)), tokenToStr),
        apply(kright(tok(TokenKind.BSlash),tok(TokenKind.RBrack)), tokenToStr),
        apply(kright(tok(TokenKind.BSlash),tok(TokenKind.Apos)), tokenToStr),
        apply(kright(tok(TokenKind.BSlash),tok(TokenKind.BSlash)), bSlashTokenToStr),
        LISPS

    ))

CON_STR.setPattern(
    apply(kmid(str("["),
        rep_sc(CON_STR_INNER),
        str("]")), applyStrings)
)

function printAST(ast : AST): string{
    if (Array.isArray(ast)){
        let ast2 = ast.map(printAST);
        return "(" + ast2.join(" ") + ")";
    }else{
        if (ast.type==ItemType.Str){
            return "`" + ast.str + "`";
        }else if (ast.type==ItemType.Id){
            return ast.id;
        }else if (ast.type== ItemType.Flo){
            return ast.flo.toString();
        }else{
            return ast.int.toString();
        }
    }

}

function evaluate(expr: string): AST {
    let a = expectSingleResult(expectEOF(LISP.parse(tokenizer.parse(expr))));
    const util = require('util')
    console.log(printAST(a))
    return a;
}


evaluate(`(main '((text 12)) [ 快狐跳懶狗\\\\\\\[\\\]\\\(\\\)(italic "fox and dog") (bold [OK])])`)
//evaluate("@(let (a 17) (+ a 10))@")