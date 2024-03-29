import * as p from 'typescript-parsec';
/** the type of token  */
declare enum TokenKind {
    Flo = 0,
    Int = 1,
    At = 2,
    Id = 3,
    RArr = 4,
    SColon = 5,
    LPar = 6,
    RPar = 7,
    Assign = 8,
    Op = 9,
    Hash = 10,
    Com = 11,
    BSlash = 12,
    Str = 13,
    LitStr = 14,
    Space = 15
}
export interface ASTNode extends p.Token<TokenKind> {
    actualValue?: bigint | number | string;
}
/** AST Tree */
declare type AST = AST[] | ASTNode;
/** from AST to S-exp */
export declare function astToSExp(ast: AST): any;
export {};
