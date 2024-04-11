import * as fs from 'fs';
import { PDFDocument , RGB, rgb, StandardFonts} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Token } from "typescript-parsec";
import {
  buildLexer,
  expectEOF,
  expectSingleResult,
  rule,
} from "typescript-parsec";
import {
  alt,
  apply,
  kright,
  kmid,
  kleft,
  rep_sc,
  seq,
  str,
  tok,
  opt,
} from "typescript-parsec";



/** input lisp file */
const filename = "./text.lisp";
let pdfDoc :  PDFDocument;

enum TokenKind {
  Id,
  Int,
  Flo,
  Str,
  Bool,
  LParen,
  RParen,
  LBrack,
  RBrack,
  SpaceNL,
  BSlash,
  Apos,
  Other,
}

enum ItemType {
  Int,
  Flo,
  Id,
  Str,
  Bool,
  Clos,
  Ls,
  Unit,
}

type Item = ItemStr | ItemInt | ItemId | ItemFlo | ItemBool | ItemUnit | Closure | List;

interface ItemStr {
  type: ItemType.Str;
  str: string;
}

// returned type for input or print, etc. #unit for representation
interface ItemUnit {
  type: ItemType.Unit;
}

interface ItemInt {
  type: ItemType.Int;
  int: number;
}

interface ItemId {
  type: ItemType.Id;
  id: string;
  isRec? : boolean; /** is it recursive function */
}

interface ItemFlo {
  type: ItemType.Flo;
  flo: number;
}

interface ItemBool {
    type: ItemType.Bool;
    bool: boolean;
  }

interface List {
    type: ItemType.Ls;
    list: AST[];
  }

interface EnvValue{
  isRec : boolean;
  value : AST;
}

interface Env {
  [Key: string]: EnvValue[];
}

interface Closure{
    type: ItemType.Clos;
    vars : Item[];
    env : Env;
    body : AST;
}

type AST = Item | AST[];

const tokenizer = buildLexer([
  [true, /^-?\d+/g, TokenKind.Int],
  [true, /^-?\d+\.\d+/g, TokenKind.Flo],
  [true, /^true/g, TokenKind.Bool],
  [true, /^false/g, TokenKind.Bool],
  [true, /^([+\-*/a-zA-Z_][0-9+\-*/a-zA-Z_]*!?|[<>]=?|!?=)/g, TokenKind.Id],
  [true, /^\"([^\"]|\\\")+\"/g, TokenKind.Str],
  [true, /^[(]/g, TokenKind.LParen],
  [true, /^[)]/g, TokenKind.RParen],
  [true, /^\[/g, TokenKind.LBrack],
  [true, /^\]/g, TokenKind.RBrack],
  [true, /^'/g, TokenKind.Apos],
  [true, /^(\s|\t|\r?\n)+/g, TokenKind.SpaceNL],
  [true, /^\\/g, TokenKind.BSlash],
  [true, /^([^+\-*/a-zA-Z_0-9\[\]()'\s\t\r\n\\]+)/g, TokenKind.Other],
]);

/*
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
    type: ItemType.Str,
    str: value.text,
  };
}

function bSlashTokenToStr(value: Token<TokenKind>): Item {
  return {
    type: ItemType.Str,
    str: value.text,
  };
}

function applyId(value: Token<TokenKind.Id>): Item {
  return {
    type: ItemType.Id,
    id: value.text,
  };
}

function applyInt(value: Token<TokenKind.Int>): Item {
  return {
    type: ItemType.Int,
    int: +value.text,
  };
}

function applyFlo(value: Token<TokenKind.Flo>): Item {
  return {
    type: ItemType.Flo,
    flo: +value.text,
  };
}

function applyStr(value: Token<TokenKind.Str>): Item {
  return {
    type: ItemType.Str,
    str: value.text.slice(1, value.text.length - 1),
  };
}

function applyBool(value: Token<TokenKind.Bool>): Item {
    if (value.text === "true"){
        return {
        type: ItemType.Bool,
        bool: true,
        };
    } else{
        return {
            type: ItemType.Bool,
            bool: false,
        };
    }
  }

function applyList(value: AST[]): AST {
  return value;
}

function applyQuoted(value: AST[]): AST {
  const head: Item = { type: ItemType.Id, id: "quote" };
  const merged = [head, value];
  return merged;
}

function applyStrings(value: AST[]): AST {
  const head: AST[] = [{ type: ItemType.Id, id: "%concat" }];
  const merged = head.concat(value);
  return merged;
}

/** for convinence to omit the spaces and newlines */
const __ = opt(tok(TokenKind.SpaceNL));

LISP.setPattern(alt(kleft(SINGLE, __), kleft(LISPS, __), kleft(CON_STR, __)));

SINGLE.setPattern(
  alt(
    apply(tok(TokenKind.Id), applyId),
    apply(tok(TokenKind.Int), applyInt),
    apply(tok(TokenKind.Flo), applyFlo),
    apply(tok(TokenKind.Str), applyStr),
    apply(tok(TokenKind.Bool), applyBool),
  )
);

LISPS.setPattern(
  alt(
    apply(kmid(seq(str("("), __), rep_sc(LISP), str(")")), applyList),
    apply(
      kright(str("'"), kmid(seq(str("("), __), rep_sc(LISP), str(")"))),
      applyQuoted
    )
  )
);

CON_STR_INNER.setPattern(
  alt(
    apply(tok(TokenKind.Id), tokenToStr),
    apply(tok(TokenKind.Int), tokenToStr),
    apply(tok(TokenKind.Flo), tokenToStr),
    apply(tok(TokenKind.Str), tokenToStr),
    apply(tok(TokenKind.Other), tokenToStr),
    apply(tok(TokenKind.SpaceNL), tokenToStr),
    apply(kright(tok(TokenKind.BSlash), tok(TokenKind.LParen)), tokenToStr),
    apply(kright(tok(TokenKind.BSlash), tok(TokenKind.RParen)), tokenToStr),
    apply(kright(tok(TokenKind.BSlash), tok(TokenKind.LBrack)), tokenToStr),
    apply(kright(tok(TokenKind.BSlash), tok(TokenKind.RBrack)), tokenToStr),
    apply(kright(tok(TokenKind.BSlash), tok(TokenKind.Apos)), tokenToStr),
    apply(
      kright(tok(TokenKind.BSlash), tok(TokenKind.BSlash)),
      bSlashTokenToStr
    ),
    LISPS
  )
);

CON_STR.setPattern(
  apply(kmid(str("["), rep_sc(CON_STR_INNER), str("]")), applyStrings)
);

function astToString(ast: AST, isInQuoted? : boolean): string {
  if (Array.isArray(ast)) {
    const ast2 = ast.map((x)=>astToString(x, isInQuoted));
    return "(" + ast2.join(" ") + ")";
  } else {
    if (ast.type === ItemType.Str) {
      return "`" + ast.str + "`";
    } else if (ast.type === ItemType.Id) {
      return ast.id;
    } else if (ast.type === ItemType.Flo) {
      return ast.flo.toString();
    } else if (ast.type === ItemType.Bool) {
        return ast.bool.toString();
    }else if (ast.type === ItemType.Unit) {
      return "#unit"; // mark for unit
    }else if (ast.type === ItemType.Clos){
        const binding = astToString(ast.vars);
        const body = astToString(ast.body);
        return `<closure; binding : ${binding}, body : ${body}>`;
    }else if (ast.type === ItemType.Ls){
      const body = astToString(ast.list, true);
      if (isInQuoted){
        return body;
      }else{
        return "'"+body;
      }
    }
     else {
      return ast.int.toString();
    }
  }
}

function isItem(x: AST): x is Item {
  return !Array.isArray(x);
}

function interpBinary(op: (a : number, b : number) => number, argsMapped: AST[]):
  ItemFlo | ItemInt  {
  const fst = argsMapped[0];
  const snd = argsMapped[1];
  if (argsMapped.length === 2 && isItem(fst) && isItem(snd)) {
    if (fst.type === ItemType.Flo && snd.type === ItemType.Flo) {
      return {
        type: ItemType.Flo,
        flo: op(fst.flo, snd.flo),
      };
    } else if (fst.type === ItemType.Int && snd.type === ItemType.Int) {
      return {
        type: ItemType.Int,
        int: op(fst.int, snd.int),
      };
    } else {

      throw new Error(`the type of ${op.toString()} should be (int, int) or (flo, flo)`);
    }
  } else {
    throw new Error(`the number of args of ${op} should be 2, but it's ${argsMapped}`);
  }
}

function interpBinaryBool(op: (a : number, b : number) => boolean, argsMapped: AST[]):
  ItemBool {
  const fst = argsMapped[0];
  const snd = argsMapped[1];
  if (argsMapped.length === 2 && isItem(fst) && isItem(snd)) {
    if (fst.type === ItemType.Flo && snd.type === ItemType.Flo) {
      return {
        type: ItemType.Bool,
        bool: op(fst.flo, snd.flo),
      };
    } else if (fst.type === ItemType.Int && snd.type === ItemType.Int) {
      return {
        type: ItemType.Bool,
        bool: op(fst.int, snd.int) as  boolean,
      };
    } else {
      throw new Error(`the type of ${op.toString()} should be (int, int) or (flo, flo)`);
    }
  } else {
    throw new Error("the number of args should be 2.");
  }
}

function add(x: number, y: number): number {
  return x + y;
}
function sub(x: number, y: number): number {
  return x - y;
}
function mul(x: number, y: number): number {
  return x * y;
}
function div(x: number, y: number): number {
  return x / y;
}
function lt(x: number, y: number): boolean {
  return x < y;
}
function gt(x: number, y: number): boolean {
  return x > y;
}
function eq(x: number, y: number): boolean {
  return x === y;
}
function le(x: number, y: number): boolean {
  return x <= y;
}
function ne(x: number, y: number): boolean {
  return x !== y;
}
function ge(x: number, y: number): boolean {
  return x >= y;
}

function otherNe(x: any, y: any): boolean {
  return astToString(x) !== astToString(y);
}
function otherEq(x: any, y: any): boolean {
  return astToString(x) === astToString(y);
}


// string manipulations
function concatString(l: ItemStr, r : ItemStr) : ItemStr {
  const rtn : ItemStr = {
      type: ItemType.Str,
      str: l.str + r.str,
  }
    return rtn;
}
/**
 * get string `s`'s substring from ith-char to (j-1)th-char.
 * @param s the string
 * @param i beginning index
 * @param j ending index (excluded)
 * @returns the substring
 */
function subString(s: ItemStr, i: ItemInt, j? : ItemInt): ItemStr {
  const realI = i.int;
  const realStr = s.str;
  if (realI >= realStr.length || realI < 0){
    throw new Error("the 2nd argument of `listRef` should between 0..(length of string `s` - 1)");
  }
  else if(j === undefined){
    const rtn : ItemStr = {
      type:ItemType.Str,
      str:realStr.substring(realI)
    };
    return rtn;
  }
  else{

  const realJ = j.int;
  if (realJ >= realStr.length || realJ < 0){
    throw new Error("the 3rd argument of `listRef` should between 0..(length of string `s` - 1)");
  }else if (realI > realJ){
    throw new Error("the 2nd argument should not larger than the 3rd arg.");
  }else{
    const rtn : ItemStr = {
      type:ItemType.Str,
      str:realStr.substring(realI,realJ),
    };
    return rtn;
  }}
}


/** list manipulation */
function car(x : List) : Item {
  const fst = (x.list as AST[])[0];
  if (Array.isArray(fst)){
    const rtnList : List = {
      type: ItemType.Ls,
      list: fst,
  }
  return rtnList;
  }else{
    return fst;
  }
}
function cdr(x : List) : Item {
  if (x.list.length == 0){
    throw new Error("the argument of 'cdr' can't be a empty list.")
  }
  const remained = (x.list as AST[]).slice(1);
  const rtnList : List = {
      type: ItemType.Ls,
      list: remained,
  }
    return rtnList;
}
function cons(h: AST, t : List) : List {
  const inner = [h].concat(t.list);
  const rtnList : List = {
      type: ItemType.Ls,
      list: inner,
  }
    return rtnList;
}

/* PDF manipulation */
async function drawText(pageIndex : number,
                fontFamily : string,
                textSize : number,
                color : string,
                x : number,
                y : number,
                text : string){
  let currentPage = pdfDoc.getPages()[0];

const fcMatch = await spawnSync('fc-match', ['--format=%{file}', fontFamily]);
const path = fcMatch.stdout.toString();
 pdfDoc.registerFontkit(fontkit);
   const fontBytes = fs.readFileSync(path);
   console.log("A2A",rgb(0,0,0));

  const customFont = await pdfDoc.embedFont(fontBytes);
  console.log("A3A",rgb(0,0,0));

  const rgbColor = await hexColorToRGB(color);
  console.log("A4A",rgb(0,0,0));

  let a = await pdfDoc.getPage(0).drawText(text, {
    x: x,
    y: y,
    size: textSize,
    font: customFont,
    color: rgbColor,
  });
  await pdfDoc.save();
  
}


async function hexColorToRGB(hex: string): Promise<RGB>{
  let rgbHex = /[#]?(\d{2})(\d{2})(\d{2})/.exec(hex);
  let r = parseInt((rgbHex as RegExpExecArray)[1], 16)/256.0;
  let g = parseInt((rgbHex as RegExpExecArray)[2], 16)/256.0;
  let b = parseInt((rgbHex as RegExpExecArray)[3], 16)/256.0;
  return rgb(r,g,b);
}

function listRef(l: List, i: ItemInt): AST {
  const realI = i.int;
  if (realI >= l.list.length || realI < 0){
    throw new Error("the argument of `listRef` should between 0..(length of l - 1)");
  }else{
    const rtn = l.list[realI];
    return rtn;
  }
}



function extendEnv(env : Env, vari : string, isRec: boolean, data : AST) : Env{
    // add var
    if (!(vari in env)){
        env[vari] = [{isRec, value:data}];

    // update
    }else{
        env[vari] = [{isRec, value:data}].concat(env[vari]);
    }
    return env;
}
const emptyEnv: Env = {};

/**
 * @throws {Error}
 */
function invalidLengthException( id : string, no : number) : Error{
    return new Error(`the number of args for ${id} should be ${no}.`);
}

function isItemArray(x: any): x is Item[] {
    return x[0].hasOwnProperty('type');
  }

function isItemId(x: any): x is ItemId {
    return x.hasOwnProperty('type') && x.hasOwnProperty('id');
  }

function isClosure(x: any): x is Closure {
    return x.hasOwnProperty('type') && x.hasOwnProperty('vars');
}

async function interp(prog: AST, env: Env): Promise<AST> {
  if (Array.isArray(prog)) {
    if (!Array.isArray(prog[0])) {
      const op = prog[0];
      if (op.type === ItemType.Id) {
        // a list
        if (op.id === "quote"){
          const body = prog[1];
          if (!Array.isArray(body)){
            throw new Error("the argument of quote, aka: "+body+", is not a list.");
          }else{
          return {
            type: ItemType.Ls,
            list: body,
        }
      }
        }
        /* lambda */
        else if (op.id === "lambda"){
            const vars = prog[1];
            if (prog.length !== 3){
                throw invalidLengthException('lambda', 2);
            }
            else if (!isItemArray(vars)){
                throw new Error("the vars of lambda should be a list of items");
            }
            else{
                return {
                    type: ItemType.Clos,
                    env,
                    vars,
                    body: prog[2],
                }
            }
        }
        /** let function */
        else if (op.id === "let" || op.id === "letrec"){
            const bindings = prog[1];
            if (prog.length !== 3){
              if (op.id === "let"){
                throw invalidLengthException('let', 2);
              }else{
                throw invalidLengthException('letrec', 2);
              }
            }
            else if (!Array.isArray(bindings)){
                throw new Error("the bindings should be array");
            }else{

                let newEnv = structuredClone(env);
                for (let i=0;i<bindings.length;i++){
                    const binding = bindings[i];
                    if (!Array.isArray(binding)
                        || (binding as AST[]).length !== 2){
                      if (op.id === "let"){
                        throw new Error("malformed of let.")
                      }else{
                        throw new Error("malformed of letrec.")
                      }
                    }else{
                        const vari = binding[0];
                        if (vari.hasOwnProperty("id")){
                            const variName = (vari as ItemId).id;
                            const data = await interp(binding[1], env);
                            if (op.id === "letrec"){
                              newEnv = extendEnv(newEnv, variName , true, data);
                            }else{
                              newEnv = extendEnv(newEnv, variName , false, data);
                            }
                        }
                    }
                }
                const body = prog[2];
                return interp(body, newEnv);
            }
        }
        // end of let
        else if(op.id === "if"){
            if (prog.length !== 4){
                throw invalidLengthException('if', 3);
            }else{
              const cond = await interp(prog[1], env);
                if (Array.isArray(cond)){
                    throw new Error("cond can't be reduced to a constant");
                }else if (cond.type !== ItemType.Bool){
                    throw new Error("type error of cond, not a bool");
                }else if (cond.bool === true){
                    return interp(prog[2], env);
                // if cond is false
                }else{
                    return interp(prog[3], env);
                }
            }
        }
        else{

        const argsMapped = await Promise.all( prog.slice(1).map(async (x) => {
          return interp(x, env);
        }));
        // binary basic operator
        if (op.id === "+") {
          return interpBinary(add, argsMapped);
        } else if (op.id === "-") {
          return interpBinary(sub, argsMapped);
        } else if (op.id === "*") {
          return interpBinary(mul, argsMapped);
        } else if (op.id === "/") {
          return interpBinary(div, argsMapped);
        // bool calculation
        } else if (op.id === ">") {
          return interpBinaryBool(gt, argsMapped);
        } else if (op.id === "<") {
          return interpBinaryBool(lt, argsMapped);
        } else if (op.id === ">=") {
          return interpBinaryBool(ge, argsMapped);
        } else if (op.id === "<=") {
          return interpBinaryBool(le, argsMapped);
        } else if (op.id === "=") {
          if ((argsMapped[1] as Item).type === ItemType.Flo ||
          (argsMapped[1] as Item).type === ItemType.Int){
            return interpBinaryBool(eq, argsMapped);
          }else{
            if (prog.length !== 3){
              throw invalidLengthException('=', 2);
            }else if(!isItem(argsMapped[0])
              ||!isItem(argsMapped[1])){
              throw new Error("Either 1st or 2nd arg of '=' is not a item.")
            }else{
              return {
                type:ItemType.Bool,
                bool:otherEq(argsMapped[0], argsMapped[1]),
              };
            }
          }
        }  else if (op.id === "!=") {
          if (
            ((argsMapped[0] as Item).type === ItemType.Flo &&
            (argsMapped[0] as Item).type ===  (argsMapped[1] as Item).type)||
          ((argsMapped[0] as Item).type === ItemType.Int) &&
          ((argsMapped[0] as Item).type === (argsMapped[1] as Item).type)){
            return interpBinaryBool(ne, argsMapped);
          }else{
            if (prog.length !== 3){
              throw invalidLengthException('!=', 2);
            }else if(!isItem(argsMapped[1])
              ||!isItem(argsMapped[2])){
              throw new Error("Either 1st or 2nd arg of '!=' is not a item.")
            }else{
              return {
                type:ItemType.Bool,
                bool:otherNe(argsMapped[0], argsMapped[1]),
              };
            }
          }
        } else if (op.id === "car") {
          const arg = argsMapped[0];
          if (prog.length !== 2){
            throw invalidLengthException('car', 1);
          }else if (!arg.hasOwnProperty('type') || (arg as Item).type !== ItemType.Ls){
            throw new Error("the arg of 'car' is not a list.")
          }else{
            return car((arg as List));
          }
        }
        else if (op.id === "cdr") {
          const arg = argsMapped[0];
          if (prog.length !== 2){
            throw invalidLengthException('cdr', 1);
          }else if (!arg.hasOwnProperty('type') || (arg as Item).type !== ItemType.Ls){
            throw new Error("the arg of 'cdr' is not a list.")
          }else{
            return cdr((arg as List));
          }
        }else if (op.id === "cons") {
          const arg = argsMapped;
          if (prog.length !== 3){
            throw invalidLengthException('cdr', 2);
          }else if (!arg[1].hasOwnProperty('type') || (arg[1] as Item).type !== ItemType.Ls){
            throw new Error("the 2nd arg of 'cons' is not a list.")
          }else{
            return cons(arg[0], (arg[1] as List));
          }
        }
        else if (op.id === "listRef"){
          const arg = argsMapped;
          if (prog.length !== 3){
            throw invalidLengthException('listRef', 2);
          }else if (!arg[0].hasOwnProperty('type') || (arg[0] as Item).type !== ItemType.Ls){
            throw new Error("the 1st arg of 'listRef' is not a list.")
          }else if (!arg[1].hasOwnProperty('type') || (arg[1] as Item).type !== ItemType.Int){
            throw new Error("the 2nd arg of 'listRef' is not a number.")
          }else{
            return listRef(arg[0] as List, arg[1] as ItemInt);
          }          
        }


        
        // string manipulations
        else if (op.id === "++") {
        const lhs = prog[1];
        const rhs = prog[2];
        if (prog.length !== 3){
          throw invalidLengthException('++', 2);
        }else if (!isItem(lhs) || !isItem(rhs)
        || lhs.type != ItemType.Str || rhs.type != ItemType.Str){
          throw new Error("at least one of the arg. of '++' is not a str.")
        }else{
          return concatString(lhs, rhs);
        }}
        else if (op.id === "subString") {
        const str = prog[1];
        const i = prog[2];
        if (prog.length !== 3 && prog.length !== 4){
          throw new Error(`the number of args for 'subString' should be 2 or 3.`);
        }else if (!isItem(str) ||  str.type != ItemType.Str ){
          throw new Error("the 1st item of the arg for 'subString' should be a string.")
        }else{
          if (prog.length == 3){
            // str.substring(i)
            return subString(str, i as ItemInt);}
          else{
            // str.substring(i,j)
            return subString(str, i as ItemInt, prog[3] as ItemInt);}
          }
        }

        // set manipulations
        else if (op.id === "set!") {
          const vari : ItemId = prog[1] as ItemId;
          const replacer = prog[2];
          if (prog.length !== 3){
            throw invalidLengthException('set!', 2);
          }else if (!isItem(vari) || !isItem(replacer)
          || (env[vari.id][0].value as Item).type !=  replacer.type ){
            throw new Error("the type of replace and variable should be the same.")
          }else{
            env[vari.id][0].value = prog[2];
            return {type:ItemType.Unit};
          }
        }
        // PDFManipulation
        else if (op.id === "addPDFPage"){
          if (prog.length !== 2){
            throw invalidLengthException('addPDFPage', 1);
          }else if(astToString(argsMapped[0]) !== "'()"){
            throw new Error("the arg of addPdfPage should be a empty string '()")
          }else{
            const page = pdfDoc.addPage();
            return {
              type:ItemType.Unit,
            }
          }
        }
        else if (op.id === "drawText"){
          if (prog.length !== 7){
            throw invalidLengthException('drawText', 6);
          }else{
            const fontFamily = (argsMapped[0] as ItemStr).str;
            const textSize = (argsMapped[1] as ItemInt).int;
            const color = (argsMapped[2] as ItemStr).str;
            const x = (argsMapped[3] as ItemFlo).flo;
            const y = (argsMapped[4] as ItemFlo).flo;
            const text = (argsMapped[5] as ItemStr).str;
            drawText(
              pdfDoc.getPageCount()-1,
              fontFamily,
              textSize,
              color,
              x,
              y,
              text);
            return {
              type:ItemType.Unit,
            }
          }
        }
        // procedures returning the last called command
        else if (op.id === "begin"){
          const rtn = argsMapped[argsMapped.length-1];
          return rtn;
      }
      
        
        // other named function call
        else {

          const caller = await interp(prog[0],env);


          const varArgs = ((caller as Closure).vars as ItemId[]);
          const varArgLen = varArgs.length;
          const argsMappedLen = argsMapped.length;
          if (argsMappedLen !== varArgLen){
            throw new Error("the number of the arguments of the caller is"
            +" not the same of that of the input vars.");
          }else{
            let newEnv = structuredClone((caller as Closure).env);


            // for recursion function usage
            /*for(const key in env){
              const currentKey = key;
              const currentValue = env[currentKey];
              if (currentValue[0].isRec !== undefined && currentValue[0].isRec === true){
                newEnv = extendEnv(newEnv, currentKey, true, currentValue[0].value);
              }
            }*/
            const fuBody = (caller as Closure).body;

            for(let i=0;i<argsMapped.length;i++){
              const varArg = varArgs[i];
              let varArgIsRec  = false;
              if (varArg.isRec !== undefined && varArg.isRec === true){
                varArgIsRec = true;
              }
              newEnv = extendEnv(newEnv, varArgs[i].id, varArgIsRec, argsMapped[i]);
            }

            return interp(fuBody, newEnv);
          }

        }}
      // the caller should not be a non-id constant
      } else {
        throw new Error("the caller shouldn't be number or string");
      }
    // the caller which is a higher-function call
    } else {
      const argsMapped = await Promise.all(prog.slice(1).map((x) => {
        return interp(x, env);
      }));
      const caller = await interp(prog[0], env);

      const varArgs = (caller as Closure).vars as ItemId[];
      const varArgLen = varArgs.length;
      const argsMappedLen = argsMapped.length;
      if (argsMappedLen !== varArgLen){
        throw new Error("the number of the arguments is"
        +" not the same of that of the input vars.");
      }


      else{

        const fuBody = (caller as Closure).body;
        let newEnv = structuredClone(env);

        // for recursion function usage
        for(let i=0;i<argsMapped.length;i++){
          let varArgIsRec = false;
          if (varArgs[i].isRec !== undefined && varArgs[i].isRec === true){
            varArgIsRec = true;
          }
          newEnv = extendEnv(newEnv, varArgs[i].id,varArgIsRec, argsMapped[i]);
        }

        return interp(fuBody, newEnv);
      }
    }
  } else {
    // constant
    if (prog.type !== ItemType.Id) {
      return prog;
    }
    // other variable
    else{
      const varName = prog.id;
      const isRecAndVal = env[varName][0];

      // for letrec's usage
      if (isRecAndVal.isRec === true){
        let value = isRecAndVal.value;
        if (isClosure(value)){
          for (const key in env){
            const valueOfKey = env[key][0];
            if (valueOfKey.isRec == true){
              value.env = extendEnv(value.env, key, true, valueOfKey.value);
            }
          }
          
          return value;
        }
      }
      return isRecAndVal.value;
    }
  }
}

async function evaluate(expr: string): Promise<string> {
  const input = expectSingleResult(expectEOF(LISP.parse(tokenizer.parse(expr))));
  const interped = await interp(input, emptyEnv);
  return astToString(interped);
}

// evaluate(`(main '((text 12)) [ 快狐跳懶狗\\\\\\\[\\\]\\\(\\\)(italic "fox and dog") (bold [OK])])`)
// evaluate("@(let (a 17) (+ a 10))@")

// eval print loop
import readline = require("node:readline");
import { exit } from "node:process";
import { spawnSync } from 'child_process';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


async function run(){
  pdfDoc = await PDFDocument.create();


  const prog = fs.readFileSync(filename, { encoding: 'utf8' });

  console.log(await evaluate(prog));

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filename+'.pdf', pdfBytes, 'binary');
  exit(0);
}

run();