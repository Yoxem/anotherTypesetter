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
/**
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
    if (value.text == "true") {
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
    let head = { type: ItemType.Id, id: "quote" };
    let merged = [head, value];
    return merged;
}
function applyStrings(value) {
    let head = [{ type: ItemType.Id, id: "%concat" }];
    let merged = head.concat(value);
    return merged;
}
/** for convinence to omit the spaces and newlines */
let __ = (0, typescript_parsec_2.opt)((0, typescript_parsec_2.tok)(TokenKind.SpaceNL));
LISP.setPattern((0, typescript_parsec_2.alt)((0, typescript_parsec_2.kleft)(SINGLE, __), (0, typescript_parsec_2.kleft)(LISPS, __), (0, typescript_parsec_2.kleft)(CON_STR, __)));
SINGLE.setPattern((0, typescript_parsec_2.alt)((0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Id), applyId), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Int), applyInt), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Flo), applyFlo), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Str), applyStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Bool), applyBool)));
LISPS.setPattern((0, typescript_parsec_2.alt)((0, typescript_parsec_2.apply)((0, typescript_parsec_2.kmid)((0, typescript_parsec_2.seq)((0, typescript_parsec_2.str)("("), __), (0, typescript_parsec_2.rep_sc)(LISP), (0, typescript_parsec_2.str)(")")), applyList), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.str)("'"), (0, typescript_parsec_2.kmid)((0, typescript_parsec_2.seq)((0, typescript_parsec_2.str)("("), __), (0, typescript_parsec_2.rep_sc)(LISP), (0, typescript_parsec_2.str)(")"))), applyQuoted)));
CON_STR_INNER.setPattern((0, typescript_parsec_2.alt)((0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Id), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Int), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Flo), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Str), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.Other), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.tok)(TokenKind.SpaceNL), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.tok)(TokenKind.BSlash), (0, typescript_parsec_2.tok)(TokenKind.LParen)), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.tok)(TokenKind.BSlash), (0, typescript_parsec_2.tok)(TokenKind.RParen)), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.tok)(TokenKind.BSlash), (0, typescript_parsec_2.tok)(TokenKind.LBrack)), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.tok)(TokenKind.BSlash), (0, typescript_parsec_2.tok)(TokenKind.RBrack)), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.tok)(TokenKind.BSlash), (0, typescript_parsec_2.tok)(TokenKind.Apos)), tokenToStr), (0, typescript_parsec_2.apply)((0, typescript_parsec_2.kright)((0, typescript_parsec_2.tok)(TokenKind.BSlash), (0, typescript_parsec_2.tok)(TokenKind.BSlash)), bSlashTokenToStr), LISPS));
CON_STR.setPattern((0, typescript_parsec_2.apply)((0, typescript_parsec_2.kmid)((0, typescript_parsec_2.str)("["), (0, typescript_parsec_2.rep_sc)(CON_STR_INNER), (0, typescript_parsec_2.str)("]")), applyStrings));
function astToString(ast) {
    if (Array.isArray(ast)) {
        let ast2 = ast.map(astToString);
        return "(" + ast2.join(" ") + ")";
    }
    else {
        if (ast.type == ItemType.Str) {
            return "`" + ast.str + "`";
        }
        else if (ast.type == ItemType.Id) {
            return ast.id;
        }
        else if (ast.type == ItemType.Flo) {
            return ast.flo.toString();
        }
        else if (ast.type == ItemType.Bool) {
            return ast.bool.toString();
        }
        else if (ast.type == ItemType.Clos) {
            let binding = astToString(ast.vars);
            let body = astToString(ast.body);
            return `<closure; binding : ${binding}, body : ${body}>`;
        }
        else if (ast.type == ItemType.Ls) {
            let body = astToString(ast.list);
            return "'" + body;
        }
        else {
            return ast.int.toString();
        }
    }
}
function isItem(x) {
    return !Array.isArray(x);
}
function interpBinary(op, argsMapped, isBool) {
    let fst = argsMapped[0];
    let snd = argsMapped[1];
    if (argsMapped.length == 2 && isItem(fst) && isItem(snd)) {
        if (fst.type == ItemType.Flo && snd.type == ItemType.Flo) {
            if (isBool == true) {
                return {
                    type: ItemType.Bool,
                    bool: op(fst.flo, snd.flo),
                };
            }
            return {
                type: ItemType.Flo,
                flo: op(fst.flo, snd.flo),
            };
        }
        else if (fst.type == ItemType.Int && snd.type == ItemType.Int) {
            if (isBool == true) {
                return {
                    type: ItemType.Bool,
                    bool: op(fst.int, snd.int),
                };
            }
            return {
                type: ItemType.Int,
                int: op(fst.int, snd.int),
            };
        }
        else {
            throw new Error("the type of add should be (int, int) or (flo, flo");
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
    return x == y;
}
function le(x, y) {
    return x <= y;
}
function ge(x, y) {
    return x >= y;
}
/** list manipulation */
function car(x) {
    let fst = x.list[0];
    if (Array.isArray(fst)) {
        let rtnList = {
            type: ItemType.Ls,
            list: fst,
        };
        return rtnList;
    }
    else {
        return fst;
    }
}
function extendEnv(env, vari, data) {
    // add var
    if (!(vari in env)) {
        env[vari] = [data];
        // update
    }
    else {
        env[vari] = [data].concat(env[vari]);
    }
    return env;
}
var emptyEnv = {};
/**
 * @throws {Error}
 */
function invalidLengthException(id, no) {
    return new Error(`the number of args for ${id} should be ${no}.`);
}
function isItemArray(x) {
    return x[0].hasOwnProperty('type');
}
function interp(prog, env) {
    console.log(astToString(prog));
    if (Array.isArray(prog)) {
        if (!Array.isArray(prog[0])) {
            let op = prog[0];
            if (op.type == ItemType.Id) {
                // a list
                if (op.id == "quote") {
                    let body = prog[1];
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
                else if (op.id == "lambda") {
                    let vars = prog[1];
                    if (prog.length != 3) {
                        throw invalidLengthException('lambda', 2);
                    }
                    else if (!isItemArray(vars)) {
                        throw new Error("the vars of lambda should be a list of items");
                    }
                    else {
                        return {
                            type: ItemType.Clos,
                            vars: vars,
                            body: prog[2],
                        };
                    }
                }
                else if (op.id == "let") {
                    let bindings = prog[1];
                    if (prog.length != 3) {
                        throw invalidLengthException('let', 2);
                    }
                    else if (!Array.isArray(bindings)) {
                        throw new Error("the bindings should be array");
                    }
                    else {
                        var newEnv = env;
                        for (var i = 0; i < bindings.length; i++) {
                            let binding = bindings[i];
                            if (!Array.isArray(binding)
                                || (binding).length != 2) {
                                throw new Error("malformed of let.");
                            }
                            else {
                                let vari = binding[0];
                                if (vari.hasOwnProperty("id")) {
                                    let variName = vari.id;
                                    newEnv = extendEnv(newEnv, variName, interp(binding[1], env));
                                }
                            }
                        }
                        let body = prog[2];
                        return interp(body, newEnv);
                    }
                }
                else if (op.id == "if") {
                    if (prog.length != 4) {
                        throw invalidLengthException('if', 3);
                    }
                    else {
                        let cond = interp(prog[1], env);
                        if (Array.isArray(cond)) {
                            throw new Error("cond can't be reduced to a constant");
                        }
                        else if (cond.type != ItemType.Bool) {
                            throw new Error("type error of cond, not a bool");
                        }
                        else if (cond.bool == true) {
                            return interp(prog[2], env);
                            // if cond is false
                        }
                        else {
                            return interp(prog[3], env);
                        }
                    }
                }
                else {
                    let argsMapped = prog.slice(1).map((x) => {
                        return interp(x, env);
                    });
                    // binary basic operator
                    if (op.id == "+") {
                        return interpBinary(add, argsMapped);
                    }
                    else if (op.id == "-") {
                        return interpBinary(sub, argsMapped);
                    }
                    else if (op.id == "*") {
                        return interpBinary(mul, argsMapped);
                    }
                    else if (op.id == "/") {
                        return interpBinary(div, argsMapped);
                        // bool calculation
                    }
                    else if (op.id == ">") {
                        return interpBinary(gt, argsMapped, true);
                    }
                    else if (op.id == "<") {
                        return interpBinary(lt, argsMapped, true);
                    }
                    else if (op.id == ">=") {
                        return interpBinary(ge, argsMapped, true);
                    }
                    else if (op.id == "<=") {
                        return interpBinary(le, argsMapped, true);
                    }
                    else if (op.id == "==") {
                        return interpBinary(eq, argsMapped, true);
                    }
                    else if (op.id == "car") {
                        let arg = argsMapped[0];
                        if (prog.length != 2) {
                            throw invalidLengthException('car', 1);
                        }
                        else if (!arg.hasOwnProperty('type') || arg.type != ItemType.Ls) {
                            throw new Error("the arg of 'car' is not a list.");
                        }
                        else {
                            return car(arg);
                        }
                        // other named function call
                    }
                    else {
                        let caller = interp(prog[0], env);
                        let varArgs = caller.vars;
                        let varArgLen = varArgs.length;
                        let argsMappedLen = argsMapped.length;
                        if (argsMappedLen != varArgLen) {
                            throw new Error("the number of the arguments is"
                                + " not the same of that of the input vars.");
                        }
                        else {
                            var newEnv = env;
                            var fuBody = caller.body;
                            for (var i = 0; i < argsMapped.length; i++) {
                                newEnv = extendEnv(env, varArgs[i].id, argsMapped[i]);
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
            throw new Error("todo for ((lambda arg ) arg)");
        }
    }
    else {
        // constant
        if (prog.type != ItemType.Id) {
            return prog;
            // variable
        }
        else {
            let varName = prog.id;
            let value = env[varName][0];
            return value;
        }
    }
}
function evaluate(expr) {
    let input = (0, typescript_parsec_1.expectSingleResult)((0, typescript_parsec_1.expectEOF)(LISP.parse(tokenizer.parse(expr))));
    let interped = interp(input, emptyEnv);
    return astToString(interped);
}
//evaluate(`(main '((text 12)) [ 快狐跳懶狗\\\\\\\[\\\]\\\(\\\)(italic "fox and dog") (bold [OK])])`)
//evaluate("@(let (a 17) (+ a 10))@")
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
