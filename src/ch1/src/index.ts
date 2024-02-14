import * as p from 'typescript-parsec'; // import p
/* for test */
import * as assert from 'assert';

/** the type of token  */
enum TokenKind {
    Flo,
    Int,
    At, // @
    Id, // identifier
    RArr, // Right Arrow
    SColon, // Semi colon
    LPar, // left perenthesis
    RPar, // right paranthesis
    Assign, // =
    Op, // +-*/... 
    Hash, // #
    Com, // # comment
    BSlash, // backslash\
    Str, // "string"
    LitStr, // literal string
    Space, // Spaces
}

// add "actualValue" in the parsed Token
export interface ASTNode extends p.Token<TokenKind>{
    // number is for float number;
    //it's optional. since keyword has no value
    actualValue? : bigint | number | string;    
}

/** AST Tree */
type AST = AST[] | ASTNode;

/** from AST to S-exp */
export function astToSExp(ast : AST){
    // if it's an array
    if (Array.isArray(ast)){
        return "(" + ast.map((x : AST)=>astToSExp(x)).join(" ") + ")";
    // if it's a item
    }else{
        return ast.text;
    }
}


// tokenizer
const tokenizer = p.buildLexer([
    [true,/^\d+[.]\d+/g , TokenKind.Flo],
    [true, /^\d+/g, TokenKind.Int],
    [true,/^[@]/g, TokenKind.At ],
    [true,/^[_a-zA-Z][_0-9a-zA-Z]*/g, TokenKind.Id ],
    [true,/^->/g , TokenKind.RArr ],
    [true, /^[;]/g, TokenKind.SColon ],
    [true, /^\(/g, TokenKind.LPar ],
    [true, /^\)/g, TokenKind.RPar ],
    [true, /^[=]/g, TokenKind.Assign ],
    [true, /^([\+\-\*\/]|[!<>=]=)/g, TokenKind.Op ],
    [true, /^#[^#]*#/g, TokenKind.Com ],
    [true, /^[\\]/g, TokenKind.BSlash ],
    [true,/^\"([^"]|[\\\"])*\"/g , TokenKind.Str ],
    [true, /^\s+/g, TokenKind.Space],
    [true, /^([^\\]+?)/g, TokenKind.LitStr ],
]);



/** ignore spaces ,new lines, and comments */
const _ = p.opt(p.alt(
    p.tok(TokenKind.Space),
    p.tok(TokenKind.Com),
    )
);

function applyArg(value: [p.Token<TokenKind>,
                            p.Token<TokenKind> | undefined,
                            ASTNode,
                            p.Token<TokenKind> | undefined,
                            ASTNode,
                            p.Token<TokenKind> | undefined,
                            p.Token<TokenKind>]): AST[]{

    let type = value[2];
    let variable = value[4];

    return [type, variable];
}

function applyID(value: p.Token<TokenKind.Id>): ASTNode {
    // extend value to ASTNode
    const newNode : ASTNode  = {
        actualValue : value.text ,
        ...value};
    return newNode;
}

function applyInteger(value: p.Token<TokenKind.Int>): ASTNode {
    // extend value to ASTNode
    const newNode : ASTNode  = {
        actualValue : BigInt(value.text) ,
        ...value};
    return newNode;
}

function applyFloat(value: p.Token<TokenKind.Flo>): ASTNode {
    const newNode : ASTNode  = {
        actualValue : parseFloat(value.text) ,
        ...value};
    return newNode;
}

function applyString(value: p.Token<TokenKind.Str>): ASTNode {
    const newNode : ASTNode  = {
        // get only text[1,2,...,the second last char]
        actualValue : value.text.slice(1,value.text.length-1).replace(/\\\"/g, "\"") ,
        ...value};
    return newNode;
}

/** define all the parser sentence */
const CONST = p.rule<TokenKind, ASTNode>();
const VAR = p.rule<TokenKind, ASTNode>();
const TYPE = p.rule<TokenKind, ASTNode>();
const ARG = p.rule<TokenKind, AST[]>();

/*
const EXPR = p.rule<TokenKind, AST>();
const LETTING = p.rule<TokenKind, AST>();
const LAMBDA = p.rule<TokenKind, AST>();
const APPLYING = p.rule<TokenKind, AST>(); */

/** ARG ::= "(" TYPE VAR ")" */
ARG.setPattern(
    p.apply(p.seq(
        p.tok(TokenKind.LPar),
        _,
        TYPE,
        _,
        VAR,
        _,
        p.tok(TokenKind.RPar),
        ),applyArg)
);


/** VAR ::= ID */
VAR.setPattern(
    p.apply(p.tok(TokenKind.Id), applyID),
);
/** TYPE ::= ID */
TYPE.setPattern(
    p.apply(p.tok(TokenKind.Id), applyID),
);

/** * CONST ::= FLO | STR | INT */
CONST.setPattern(
    p.alt(
        p.apply(p.tok(TokenKind.Flo), applyFloat),
        p.apply(p.tok(TokenKind.Int), applyInteger),
        p.apply(p.tok(TokenKind.Str), applyString),

    )
);


// parse the strings
function mainParse(inputStr : string){
return p.expectSingleResult(p.expectEOF(
    CONST.parse(tokenizer.parse(inputStr))));
    // ARG.parse(tokenizer.parse(inputStr))));
}


// test
function main(){
    assert.strictEqual(<BigInt>mainParse("123").actualValue, 123n);
    assert.strictEqual(<BigInt>mainParse("3.14").actualValue, 3.14);
    assert.strictEqual(<BigInt>mainParse("\"foo\"").actualValue, "foo"); 
    //assert.strictEqual(astToSExp(mainParse("( int  a    )")), "(int a)");


};

main();