import * as parsec from 'typescript-parsec';
/** the type of token  */
declare enum TokenKind {
    Int = 0,
    Flo = 1,
    Id = 2,
    At = 3,
    Comt = 4,
    Str = /** "foo" */ 5,
    Lambda = /** -> */ 6,
    Assign = /** = */ 7,
    Set = /** := */ 8,
    Keyword = /** let, in */ 9,
    LParen = /** ( */ 10,
    RParen = /** ) */ 11,
    Space = /** semi-width space tab, \r\n? */ 12,
    NewPara = /** breaking paragraph, (\r\n?){2} */ 13,
    MainTxt = /** used in main text */ 14
}
export interface ASTNode extends parsec.Token<TokenKind> {
    actualValue?: bigint | number | string;
}
/** AST Tree */
declare type AST = AST[] | ASTNode;
/** from AST to S-exp */
export declare function astToSExp(ast: AST): any;
export {};
