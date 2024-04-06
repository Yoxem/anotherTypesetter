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
    TokenKind[TokenKind["Bool"] = 4] = "Bool";
    TokenKind[TokenKind["LParen"] = 5] = "LParen";
    TokenKind[TokenKind["RParen"] = 6] = "RParen";
    TokenKind[TokenKind["LBrack"] = 7] = "LBrack";
    TokenKind[TokenKind["RBrack"] = 8] = "RBrack";
    TokenKind[TokenKind["SpaceNL"] = 9] = "SpaceNL";
    TokenKind[TokenKind["BSlash"] = 10] = "BSlash";
    TokenKind[TokenKind["Apos"] = 11] = "Apos";
    TokenKind[TokenKind["Other"] = 12] = "Other";
})(TokenKind || (TokenKind = {}));
var ItemType;
(function (ItemType) {
    ItemType[ItemType["Int"] = 0] = "Int";
    ItemType[ItemType["Flo"] = 1] = "Flo";
    ItemType[ItemType["Id"] = 2] = "Id";
    ItemType[ItemType["Str"] = 3] = "Str";
    ItemType[ItemType["Bool"] = 4] = "Bool";
    ItemType[ItemType["Clos"] = 5] = "Clos";
    ItemType[ItemType["Ls"] = 6] = "Ls";
})(ItemType || (ItemType = {}));
const tokenizer = (0, typescript_parsec_1.buildLexer)([
    [true, /^\d+/g, TokenKind.Int],
    [true, /^\d+\.\d+/g, TokenKind.Flo],
    [true, /^true/g, TokenKind.Bool],
    [true, /^false/g, TokenKind.Bool],
    [true, /^([+\-*/a-zA-Z_][0-9+\-*/a-zA-Z_]*|[<>]=?|!?=)/g, TokenKind.Id],
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
const SINGLE = (0, typescript_parsec_1.rule)();
const LISPS = (0, typescript_parsec_1.rule)();
const LISP = (0, typescript_parsec_1.rule)();
const CON_STR = (0, typescript_parsec_1.rule)();
const CON_STR_INNER = (0, typescript_parsec_1.rule)();
function tokenToStr(value) {
    return {
        type: ItemType.Str,
        str: value.text,
    };
}
function bSlashTokenToStr(value) {
    return {
        type: ItemType.Str,
        str: value.text,
    };
}
function applyId(value) {
    return {
        type: ItemType.Id,
        id: value.text,
    };
}
function applyInt(value) {
    return {
        type: ItemType.Int,
        int: +value.text,
    };
}
function applyFlo(value) {
    return {
        type: ItemType.Flo,
        flo: +value.text,
    };
}
function applyStr(value) {
    return {
        type: ItemType.Str,
        str: value.text.slice(1, value.text.length - 1),
    };
}
function applyBool(value) {
    if (value.text === "true") {
        return {
            type: ItemType.Bool,
            bool: true,
        };
    }
    else {
        return {
            type: ItemType.Bool,
            bool: false,
        };
    }
}
function applyList(value) {
    return value;
}
function applyQuoted(value) {
    const head = { type: ItemType.Id, id: "quote" };
    const merged = [head, value];
    return merged;
}
function applyStrings(value) {
    const head = [{ type: ItemType.Id, id: "%concat" }];
    const merged = head.concat(value);
    return merged;
}
/** for convinence to omit the spaces and newlines */
const __ = (0, typescript_parsec_2.opt)((0, typescript_parsec_2.tok)(TokenKind.SpaceNL));
LISP.setPattern((0, typescript_parsec_2.alt)((0, typescript_parsec_2.kleft)(SINGLE, __), (0, typescript_parsec_2.kleft)(LISPS, __), (0, typescript_parsec_2.kleft)(CON_STR, __)));
SINGLE.setPattern((0, typescript_parsec_2.alt)((0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Id), applyId), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Int), applyInt), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Flo), applyFlo), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Str), applyStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Bool), applyBool)));
LISPS.setPattern((0, typescript_parsec_2.alt)((0, typescript_parsec_2.apply)((0, typescript_parsec_2.kmid)((0, typescript_parsec_2.seq)((0, typescript_parsec_2.str)("("), __), (0, typescript_parsec_2.rep_sc)(LISP), (0, typescript_parsec_2.str)(")")), applyList), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.str)("'"), (0, typescript_parsec_2.kmid)((0, typescript_parsec_2.seq)((0, typescript_parsec_2.str)("("), __), (0, typescript_parsec_2.rep_sc)(LISP), (0, typescript_parsec_2.str)(")"))), applyQuoted)));
CON_STR_INNER.setPattern((0, typescript_parsec_2.alt)((0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Id), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Int), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Flo), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Str), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Other), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.SpaceNL), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.tok)(TokenKind.BSlash), (0, typescript_parsec_2.tok)(TokenKind.LParen)), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.tok)(TokenKind.BSlash), (0, typescript_parsec_2.tok)(TokenKind.RParen)), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.tok)(TokenKind.BSlash), (0, typescript_parsec_2.tok)(TokenKind.LBrack)), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.tok)(TokenKind.BSlash), (0, typescript_parsec_2.tok)(TokenKind.RBrack)), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.tok)(TokenKind.BSlash), (0, typescript_parsec_2.tok)(TokenKind.Apos)), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.tok)(TokenKind.BSlash), (0, typescript_parsec_2.tok)(TokenKind.BSlash)), bSlashTokenToStr), LISPS));
CON_STR.setPattern((0, typescript_parsec_2.apply)((0, typescript_parsec_2.kmid)((0, typescript_parsec_2.str)("["), (0, typescript_parsec_2.rep_sc)(CON_STR_INNER), (0, typescript_parsec_2.str)("]")), applyStrings));
function astToString(ast, isInQuoted) {
    if (Array.isArray(ast)) {
        const ast2 = ast.map((x) => astToString(x, isInQuoted));
        return "(" + ast2.join(" ") + ")";
    }
    else {
        if (ast.type === ItemType.Str) {
            return "`" + ast.str + "`";
        }
        else if (ast.type === ItemType.Id) {
            return ast.id;
        }
        else if (ast.type === ItemType.Flo) {
            return ast.flo.toString();
        }
        else if (ast.type === ItemType.Bool) {
            return ast.bool.toString();
        }
        else if (ast.type === ItemType.Clos) {
            const binding = astToString(ast.vars);
            const body = astToString(ast.body);
            return `<closure; binding : ${binding}, body : ${body}>`;
        }
        else if (ast.type === ItemType.Ls) {
            const body = astToString(ast.list, true);
            if (isInQuoted) {
                return body;
            }
            else {
                return "'" + body;
            }
        }
        else {
            return ast.int.toString();
        }
    }
}
function isItem(x) {
    return !Array.isArray(x);
}
function interpBinary(op, argsMapped) {
    const fst = argsMapped[0];
    const snd = argsMapped[1];
    if (argsMapped.length === 2 && isItem(fst) && isItem(snd)) {
        if (fst.type === ItemType.Flo && snd.type === ItemType.Flo) {
            return {
                type: ItemType.Flo,
                flo: op(fst.flo, snd.flo),
            };
        }
        else if (fst.type === ItemType.Int && snd.type === ItemType.Int) {
            return {
                type: ItemType.Int,
                int: op(fst.int, snd.int),
            };
        }
        else {
            throw new Error("the type of add should be (int, int) or (flo, flo)");
        }
    }
    else {
        throw new Error(`the number of args of ${op} should be 2, but it's ${argsMapped}`);
    }
}
function interpBinaryBool(op, argsMapped) {
    const fst = argsMapped[0];
    const snd = argsMapped[1];
    if (argsMapped.length === 2 && isItem(fst) && isItem(snd)) {
        if (fst.type === ItemType.Flo && snd.type === ItemType.Flo) {
            return {
                type: ItemType.Bool,
                bool: op(fst.flo, snd.flo),
            };
        }
        else if (fst.type === ItemType.Int && snd.type === ItemType.Int) {
            return {
                type: ItemType.Bool,
                bool: op(fst.int, snd.int),
            };
        }
        else {
            throw new Error("the type of add should be (int, int) or (flo, flo)");
        }
    }
    else {
        throw new Error("the number of args should be 2.");
    }
}
function add(x, y) {
    return x + y;
}
function sub(x, y) {
    return x - y;
}
function mul(x, y) {
    return x * y;
}
function div(x, y) {
    return x / y;
}
function lt(x, y) {
    return x < y;
}
function gt(x, y) {
    return x > y;
}
function eq(x, y) {
    return x === y;
}
function le(x, y) {
    return x <= y;
}
function ne(x, y) {
    return x !== y;
}
function ge(x, y) {
    return x >= y;
}
function concatString(l, r) {
    const rtn = {
        type: ItemType.Str,
        str: l.str + r.str,
    };
    return rtn;
}
/** list manipulation */
function car(x) {
    const fst = x.list[0];
    if (Array.isArray(fst)) {
        const rtnList = {
            type: ItemType.Ls,
            list: fst,
        };
        return rtnList;
    }
    else {
        return fst;
    }
}
function cdr(x) {
    if (x.list.length == 0) {
        throw new Error("the argument of 'cdr' can't be a empty list.");
    }
    const remained = x.list.slice(1);
    const rtnList = {
        type: ItemType.Ls,
        list: remained,
    };
    return rtnList;
}
function cons(h, t) {
    const inner = [h].concat(t.list);
    const rtnList = {
        type: ItemType.Ls,
        list: inner,
    };
    return rtnList;
}
function extendEnv(env, vari, isRec, data) {
    // add var
    if (!(vari in env)) {
        env[vari] = [{ isRec, value: data }];
        // update
    }
    else {
        env[vari] = [{ isRec, value: data }].concat(env[vari]);
    }
    return env;
}
const emptyEnv = {};
/**
 * @throws {Error}
 */
function invalidLengthException(id, no) {
    return new Error(`the number of args for ${id} should be ${no}.`);
}
function isItemArray(x) {
    return x[0].hasOwnProperty('type');
}
function isItemId(x) {
    return x.hasOwnProperty('type') && x.hasOwnProperty('id');
}
function isClosure(x) {
    return x.hasOwnProperty('type') && x.hasOwnProperty('vars');
}
function interp(prog, env) {
    if (Array.isArray(prog)) {
        if (!Array.isArray(prog[0])) {
            const op = prog[0];
            if (op.type === ItemType.Id) {
                // a list
                if (op.id === "quote") {
                    const body = prog[1];
                    if (!Array.isArray(body)) {
                        throw new Error("the argument of quote, aka: " + body + ", is not a list.");
                    }
                    else {
                        return {
                            type: ItemType.Ls,
                            list: body,
                        };
                    }
                }
                /* lambda */
                else if (op.id === "lambda") {
                    const vars = prog[1];
                    if (prog.length !== 3) {
                        throw invalidLengthException('lambda', 2);
                    }
                    else if (!isItemArray(vars)) {
                        throw new Error("the vars of lambda should be a list of items");
                    }
                    else {
                        return {
                            type: ItemType.Clos,
                            env,
                            vars,
                            body: prog[2],
                        };
                    }
                }
                /** let function */
                else if (op.id === "let" || op.id === "letrec") {
                    const bindings = prog[1];
                    if (prog.length !== 3) {
                        if (op.id === "let") {
                            throw invalidLengthException('let', 2);
                        }
                        else {
                            throw invalidLengthException('letrec', 2);
                        }
                    }
                    else if (!Array.isArray(bindings)) {
                        throw new Error("the bindings should be array");
                    }
                    else {
                        let newEnv = structuredClone(env);
                        for (let i = 0; i < bindings.length; i++) {
                            const binding = bindings[i];
                            if (!Array.isArray(binding)
                                || binding.length !== 2) {
                                if (op.id === "let") {
                                    throw new Error("malformed of let.");
                                }
                                else {
                                    throw new Error("malformed of letrec.");
                                }
                            }
                            else {
                                const vari = binding[0];
                                if (vari.hasOwnProperty("id")) {
                                    const variName = vari.id;
                                    const data = interp(binding[1], env);
                                    if (op.id === "letrec") {
                                        newEnv = extendEnv(newEnv, variName, true, data);
                                    }
                                    else {
                                        newEnv = extendEnv(newEnv, variName, false, data);
                                    }
                                }
                            }
                        }
                        const body = prog[2];
                        return interp(body, newEnv);
                    }
                }
                // end of let
                else if (op.id === "if") {
                    if (prog.length !== 4) {
                        throw invalidLengthException('if', 3);
                    }
                    else {
                        const cond = interp(prog[1], env);
                        if (Array.isArray(cond)) {
                            throw new Error("cond can't be reduced to a constant");
                        }
                        else if (cond.type !== ItemType.Bool) {
                            throw new Error("type error of cond, not a bool");
                        }
                        else if (cond.bool === true) {
                            return interp(prog[2], env);
                            // if cond is false
                        }
                        else {
                            return interp(prog[3], env);
                        }
                    }
                }
                else {
                    const argsMapped = prog.slice(1).map((x) => {
                        return interp(x, env);
                    });
                    // binary basic operator
                    if (op.id === "+") {
                        return interpBinary(add, argsMapped);
                    }
                    else if (op.id === "-") {
                        return interpBinary(sub, argsMapped);
                    }
                    else if (op.id === "*") {
                        return interpBinary(mul, argsMapped);
                    }
                    else if (op.id === "/") {
                        return interpBinary(div, argsMapped);
                        // bool calculation
                    }
                    else if (op.id === ">") {
                        return interpBinaryBool(gt, argsMapped);
                    }
                    else if (op.id === "<") {
                        return interpBinaryBool(lt, argsMapped);
                    }
                    else if (op.id === ">=") {
                        return interpBinaryBool(ge, argsMapped);
                    }
                    else if (op.id === "<=") {
                        return interpBinaryBool(le, argsMapped);
                    }
                    else if (op.id === "=") {
                        return interpBinaryBool(eq, argsMapped);
                    }
                    else if (op.id === "!=") {
                        return interpBinaryBool(ne, argsMapped);
                    }
                    else if (op.id === "car") {
                        const arg = argsMapped[0];
                        if (prog.length !== 2) {
                            throw invalidLengthException('car', 1);
                        }
                        else if (!arg.hasOwnProperty('type') || arg.type !== ItemType.Ls) {
                            throw new Error("the arg of 'car' is not a list.");
                        }
                        else {
                            return car(arg);
                        }
                    }
                    else if (op.id === "cdr") {
                        const arg = argsMapped[0];
                        if (prog.length !== 2) {
                            throw invalidLengthException('cdr', 1);
                        }
                        else if (!arg.hasOwnProperty('type') || arg.type !== ItemType.Ls) {
                            throw new Error("the arg of 'cdr' is not a list.");
                        }
                        else {
                            return cdr(arg);
                        }
                    }
                    else if (op.id === "cons") {
                        const arg = argsMapped;
                        if (prog.length !== 3) {
                            throw invalidLengthException('cdr', 2);
                        }
                        else if (!arg[1].hasOwnProperty('type') || arg[1].type !== ItemType.Ls) {
                            throw new Error("the 2nd arg of 'cons' is not a list.");
                        }
                        else {
                            return cons(arg[0], arg[1]);
                        }
                    } // string manipulations
                    else if (op.id === "++") {
                        const lhs = prog[1];
                        const rhs = prog[2];
                        if (prog.length !== 3) {
                            throw invalidLengthException('++', 2);
                        }
                        else if (!isItem(lhs) || !isItem(rhs)
                            || lhs.type != ItemType.Str || rhs.type != ItemType.Str) {
                            throw new Error("at least one of the arg. of '++' is not a str.");
                        }
                        else {
                            return concatString(lhs, rhs);
                        }
                    }
                    // other named function call
                    else {
                        const caller = interp(prog[0], env);
                        const varArgs = caller.vars;
                        const varArgLen = varArgs.length;
                        const argsMappedLen = argsMapped.length;
                        if (argsMappedLen !== varArgLen) {
                            throw new Error("the number of the arguments is"
                                + " not the same of that of the input vars.");
                        }
                        else {
                            let newEnv = structuredClone(caller.env);
                            // for recursion function usage
                            /*for(const key in env){
                              const currentKey = key;
                              const currentValue = env[currentKey];
                              if (currentValue[0].isRec !== undefined && currentValue[0].isRec === true){
                                newEnv = extendEnv(newEnv, currentKey, true, currentValue[0].value);
                              }
                            }*/
                            const fuBody = caller.body;
                            for (let i = 0; i < argsMapped.length; i++) {
                                const varArg = varArgs[i];
                                let varArgIsRec = false;
                                if (varArg.isRec !== undefined && varArg.isRec === true) {
                                    varArgIsRec = true;
                                }
                                newEnv = extendEnv(newEnv, varArgs[i].id, varArgIsRec, argsMapped[i]);
                            }
                            return interp(fuBody, newEnv);
                        }
                    }
                }
                // the caller should not be a non-id constant
            }
            else {
                throw new Error("the caller shouldn't be number or string");
            }
            // the caller which is a higher-function call
        }
        else {
            const argsMapped = prog.slice(1).map((x) => {
                return interp(x, env);
            });
            const caller = interp(prog[0], env);
            const varArgs = caller.vars;
            const varArgLen = varArgs.length;
            const argsMappedLen = argsMapped.length;
            if (argsMappedLen !== varArgLen) {
                throw new Error("the number of the arguments is"
                    + " not the same of that of the input vars.");
            }
            else {
                const fuBody = caller.body;
                let newEnv = structuredClone(env);
                // for recursion function usage
                for (let i = 0; i < argsMapped.length; i++) {
                    let varArgIsRec = false;
                    if (varArgs[i].isRec !== undefined && varArgs[i].isRec === true) {
                        varArgIsRec = true;
                    }
                    newEnv = extendEnv(newEnv, varArgs[i].id, varArgIsRec, argsMapped[i]);
                }
                return interp(fuBody, newEnv);
            }
        }
    }
    else {
        // constant
        if (prog.type !== ItemType.Id) {
            return prog;
        }
        // other variable
        else {
            const varName = prog.id;
            const isRecAndVal = env[varName][0];
            // for letrec's usage
            if (isRecAndVal.isRec === true) {
                let value = isRecAndVal.value;
                if (isClosure(value)) {
                    for (const key in env) {
                        const valueOfKey = env[key][0];
                        if (valueOfKey.isRec == true) {
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
function evaluate(expr) {
    const input = (0, typescript_parsec_1.expectSingleResult)((0, typescript_parsec_1.expectEOF)(LISP.parse(tokenizer.parse(expr))));
    const interped = interp(input, emptyEnv);
    return astToString(interped);
}
// evaluate(`(main '((text 12)) [ 快狐跳懶狗\\\\\\\[\\\]\\\(\\\)(italic "fox and dog") (bold [OK])])`)
// evaluate("@(let (a 17) (+ a 10))@")
// eval print loop
const readline = require("node:readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
rl.question(`What's your program?`, (prog) => {
    console.log(evaluate(prog));
    rl.close();
});
