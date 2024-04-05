import { validateHeaderName } from "http";
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
}

type Item = ItemStr | ItemInt | ItemId | ItemFlo | ItemBool | Closure | List;

interface ItemStr {
  type: ItemType.Str;
  str: string;
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
  [true, /^\d+/g, TokenKind.Int],
  [true, /^\d+\.\d+/g, TokenKind.Flo],
  [true, /^true/g, TokenKind.Bool],
  [true, /^false/g, TokenKind.Bool],
  [true, /^([+\-*/a-zA-Z_][0-9+\-*/a-zA-Z_]*|[<>]=?|==)/g, TokenKind.Id],
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

function astToString(ast: AST): string {
  if (Array.isArray(ast)) {
    const ast2 = ast.map(astToString);
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
    }else if (ast.type === ItemType.Clos){
        const binding = astToString(ast.vars);
        const body = astToString(ast.body);
        return `<closure; binding : ${binding}, body : ${body}>`;
    }else if (ast.type === ItemType.Ls){
      const body = astToString(ast.list);
      return "'"+body;
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
      throw new Error("the type of add should be (int, int) or (flo, flo)");
    }
  } else {
    throw new Error("the number of args should be 2.");
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
      throw new Error("the type of add should be (int, int) or (flo, flo)");
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
function ge(x: number, y: number): boolean {
  return x >= y;
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


function interp(prog: AST, env: Env): AST {
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
                            const data = interp(binding[1], env);
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
              const cond = interp(prog[1], env);
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

        const argsMapped = prog.slice(1).map((x) => {
          return interp(x, env);
        });
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
        } else if (op.id === "==") {
          return interpBinaryBool(eq, argsMapped);
        } else if (op.id === "car") {
          const arg = argsMapped[0];
          if (prog.length !== 2){
            throw invalidLengthException('car', 1);
          }else if (!arg.hasOwnProperty('type') || (arg as Item).type !== ItemType.Ls){
            throw new Error("the arg of 'car' is not a list.")
          }else{
            return car((arg as List));
          }
        // other named function call
        } else {

          const caller = interp(prog[0],env);


          const varArgs = ((caller as Closure).vars as ItemId[]);
          const varArgLen = varArgs.length;
          const argsMappedLen = argsMapped.length;
          if (argsMappedLen !== varArgLen){
            throw new Error("the number of the arguments is"
            +" not the same of that of the input vars.");
          }else{
            let newEnv = structuredClone((caller as Closure).env);


            // for recursion function usage
            for(const key in env){
              const currentKey = key;
              const currentValue = env[currentKey];
              if (currentValue[0].isRec !== undefined && currentValue[0].isRec === true){
                newEnv = extendEnv(newEnv, currentKey, true, currentValue[0].value);
              }
            }
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
      const argsMapped = prog.slice(1).map((x) => {
        return interp(x, env);
      });
      const caller = interp(prog[0], env);

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
      return isRecAndVal.value;
    }
  }
}

function evaluate(expr: string): string {
  const input = expectSingleResult(expectEOF(LISP.parse(tokenizer.parse(expr))));
  const interped = interp(input, emptyEnv);
  return astToString(interped);
}

// evaluate(`(main '((text 12)) [ 快狐跳懶狗\\\\\\\[\\\]\\\(\\\)(italic "fox and dog") (bold [OK])])`)
// evaluate("@(let (a 17) (+ a 10))@")

// eval print loop
import readline = require("node:readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`What's your program?`, (prog: string) => {
  console.log(evaluate(prog));
  rl.close();
});
