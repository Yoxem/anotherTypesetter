# Ch1 定義抽象語法樹和語法

## 抽象語法樹

C語言、Python語言就算有許多的關鍵字、操作符、符號或是常數變數，在編譯器分析語法以後，最後會轉成編譯器可以操作的樹結構，然後再轉成我們想要的另一個語言的樹，最後輸出另一個語言的程式碼。

但是什麼叫做抽象語法樹呢？我們先從一點句法知識來談。

學過中學國文文法的課程，會背一堆類似「主詞+動詞+受詞」、「主詞+(有/無)+受詞」的結構。可以換個說法，是句子=「主詞+動詞+受詞」或是「主詞+(有/無)+賓詞」的形式。我們將「=」寫成「::=」，「/」（或是）寫成「|」，「動詞」擴充變成「動詞片語」，就變成：

```
  句子 ::= (主詞 動詞片語 受詞) | (主詞 (有 | 無) 受詞)...

```

為了易讀所以寫成：

```
句子 ::= 主詞 動詞片語 受詞
         | 主詞 (有 | 無) 受詞
         | ...

```

用這種形式表示的語言句法，叫做「BNF文法」。這種句法看起來很語言學，但是我們想：受詞和主詞可以為名詞、專有名詞或是「形容詞+名詞」；動詞片語可以為動詞或是「副詞+動詞」。因此這樣之規則，就可以生成許多句子，比如「我有筆」、「張三養貓」、「小芳慢慢移動檯燈」等等的句子。然後句子可以用上述規則，分析成語法的樹狀結構，如下圖把「我曾旅居新竹」寫成語法樹。

<figure markdown>
  ![「我曾旅居新竹」的語法樹](syntaxtree.svg "")
  <figcaption>「我曾旅居新竹」的語法樹</figcaption>
</figure>




同理，程式語言通常也有更嚴謹的這樣生成文法，可以用幾個簡單規則生出繁多的程式碼，而且合乎語法規定。這種生成文法也可檢查輸入的程式碼有沒有符合句法的規定。而這種語法生成的程式碼，去掉不需要的逗號等等符號，當然也可以做成語法樹，就是抽象語法樹 (abstract syntax tree, AST)，如下圖所示。
<figure markdown>
  ![「(2+2) == 4」的語法樹。注意括號已經刪除。](syntaxtree2.svg "")
  <figcaption>「(2+2) == 4」的語法樹。注意括號已經刪除。</figcaption>
</figure>


而上文的抽象語法樹，可以是我們把程式經過編譯器分析之後，用「樹」儲存的資料結構。而樹形結構我們可以使用Lisp語言的S表達式(S-expressiom; S-exp)來表示，本文採用這樣的表示方法。所以上文的`(2+2)==4`即`(== (+ 2 2) 4)`；`let baz = foo("bar")`，若是把foo("bar")這種函數套用(apply)寫成`(APPLY foo "bar")`，則其S-exp語法樹可寫為`(let baz(APPLY foo "bar"))`。

## 決定語法
那我們要如何制定這個語言的語法，這樣我們才能夠寫出符合這個語法的函數，然後再用tokenizer和parser轉成AST樹。

不考慮` + - * /`這種運算子，以及向量的表示子，函數可以用`ID(arg1, arg2, ...)`這種方式來表示，其中`arg_x`是引數，`ID`是識別子（identifier，可以把它想成變函數的名字）。

變數可以是`ID`，`arg_n`可以是`ID`或常數（量）。

常數（量）的表示法可以是下列任一：

  - 浮點數如0.0, 36.8，BNF風格的表達法為：`[0-9]+ '.' [0-9]+`。`'c'`指c這個文字，`+`表示前面的重複1次以上；`[0-9]`表示數字0到9。

  - 整數如22、0：`[0-9]+`

  - 字串：`'"' (不是「"」的任一字元|('\' '"'))   '"'`（`.`表示任何一個字元）

然而我們還是需要綁定變數`let x = var in boby`（在`body`裡面，`x`指代`var`）、`set x = var`（改變變數值）、lambda`lambda (x)=>{body}`。另外為了要區別要在PDF印上去的一般字元，在這個檔案的常數、變數、函數、關鍵字等前後需要加@表示（但是函數、lambda裡面的變數不用）。比如`@foo(a, b)@`、`@lambda(x)@`、`@"IAmAString"@`、`@2.2@`、`@3@`（後三者應該很少用到）可是若需在PDF印`@`時怎辦？那就用`\@`。比如`foo\@example.com`。

所以我們可以定義以下的BNF風文法：

```
Language ::= MainTxt | Exprs | Comment

Comment ::= '/*' (不含'*/'的任何字元組合)* '*/'


MainTxt ::= (('\' '@')| 非@非空白字元)+ //顯示的文字。「我是一隻貓」或是「www\@example.com」

// Exprs 表示一群定義變數、常數、函數、函數套用的表達式
Exprs ::= @ Expr* @ // *表示前面的重複0次以上（包含不出現）

// Comment also included
// "(" and ")" only for applying function
Expr ::= (Letting | Setting | Lambda |  | Var| Const) | "(" Applying ")" | Comment

Letting ::= "let" Var "=" Expr "in" Expr // let foo = 12 in ...

Setting ::= Var ":=" Expr "in"  Expr // foo := a in ...

// we force every function have at least 1 argument.
Lambda ::= "fn" LambdaArgs "->" Expr // fn x y -> 12

LambdaArgs ::= Var | Var LambdaArgs

Applying ::= Expr ExprArgs   // foo 3 9 即foo(3, 9)

ExprArgs ::= Expr | (Expr ExprArgs)

Var ::= ID

Const ::= String | Float | Integer

ID ::=  ("_" | [a-z] |  [A-Z])  ("_" | [0-9] | [a-z] |  [A-Z])+

Integer ::= [0-9]+

Float ::= [0-9]+ "." [0-9]+

String ::= '"' (不是「"」的任一字元|('\' '"'))   '"'
```

而上述的item可以被1個以上半形空白或tab（`\t`）以及1個「`\n`或`\r\n`」（換行符號）隔開。而為求簡化這些符號在MainTxt均指代一個半形空白。也就是空一個半形空白、兩個半形空白、一個tab、一個換行符號等等都會顯示如一個半形符號。而在Expr表達式區，把它忽略掉。另外兩個換行符號設定為換行指令，而這在Expr區會被忽略。所以要加另外兩條：

```
Space = (' ' | '\t')* | '\n' | '\r\n'
NewPara = = ('\n' |'\r' '\n' ) ('\n' |'\r' '\n' )
```

## 用ts-parsec和regexp進行tokenize
Parser combinator（分析器組合子）是一種利用高階函數來簡化分析器撰寫的辦法。這講到頭來會涉及「遞歸下降分析」以及其他編譯理論的東西，但太難了（聽說可以讀編譯理論的「龍書我們可以製作一個小的tokenizer。但是因為自己寫parser combinator太累了，所以我們就用nom來幫我們代勞。
」）。講一個簡單的案例吧：

假設我們想要將字串的開頭match 0~9 之中的其中一個，我們可以寫一個函數match0to9如下：

```
function match0to9(string){
if (string[0] in 0,1,..,9){
    let rest = string[1:];
    let matched = string[0];
    return {type: "OK", rest : rest, matched : matched};
}
else{
    return {type : "Nothing"};
    }
}
```

假設我們要將字串`s`的前3個字的match 0~9呢？如果會高階函數的話，引入一個`then`函數，然後把`match0to9`傳進去，這樣寫起來比較不會太糾結，比較好維護：

```
function thenDo(input, fun){
    if (input.type != "Nothing"{
        
        middle =  fun(input.rest);
        if (middle.type != "Nothing"){
            // add the matched character of input to the head of the result
            middle.matched = input.matched + middle.matched
            return middle;
         }else{
             return middle; // return nothing
         }
    }else{
        input; // return nothing
    }

}

// "s" should be wrapped in a object
let sWrapped = {type : "OK", rest : s, matched : ""};

// match0~9 3 times
thenDo(thenDo(thenDo(sWrapped, match0to9), match0to9), match0to9)
```
我們可以製作一個小的tokenizer。但是因為自己寫parser combinator太累了，所以我們就用`ts-parsec`來幫我們代勞。


安裝`ts-parsec`可以用：`npm install -g typescript-parsec`。底下的程式使用的函數的詳細說明可以參考[官方文件](https://github.com/microsoft/ts-parsec/blob/master/doc/ParserCombinators.md)。

因為這個軟體在 tokenize 的時候使用regex，所以我們就用這個東西來處理。

我們編輯Node.js的進入點程式（假設為src/index.js`），底下為定義tokenizer的型別和regex pattern：

```typescript
/** the type of token  */
enum TokenKind {
    Int, // 3
    Flo, // 3.1416
    Id, // foo, _123, etc
    At, // @
    Comt, // comment /*
    Str, /** "foo" */
    Assign, /** = */
    Set, /** := */
    Keyword, /** let, in */
    LParen, /** ( */
    RParen, /** ) */
    Space, /** semi-width space tab, \r\n? */
    NewPara, /** breaking paragraph, (\r\n?){2} */
    MainTxt, /** used in main text */
}


// tokenizer
const tokenizer = parsec.buildLexer([
    [true, /^\d+/g, TokenKind.Int],
    [true, /^\d+\.\d+/g, TokenKind.Flo],
    [true, /^(let|in)/g, TokenKind.Keyword], // let and in
    [true, /^[_a-zA-Z][_0-9a-zA-Z]*/g, TokenKind.Id],
    [true, /^\@/g, TokenKind.At],
    /* inside comment, only accept 1. non / character
    or  2. "/ + non * character" */
    [true, /^\/\*(\/[^*]|[^\\]?)*\*\//g, TokenKind.Comt],
    [true, /^\"(\\\"|[^\"]?)*\"/g, TokenKind.Str],
    [true, /^\:\=/g, TokenKind.Set],
    [true, /^\=/g, TokenKind.Assign],
    [true, /^\(/g, TokenKind.LParen],
    [true, /^\)/g, TokenKind.RParen],
    [true, /^([ \t]+|\n)/g, TokenKind.Space],
    [true, /^(\r?\n){2}/g, TokenKind.NewPara],
    [true, /^(\\\@|[^@\s])+/g, TokenKind.MainTxt],
]);
```

### 常數parsing

增加儲存實際變數值的`ASTNode`型別

```typescript
// add "actualValue" in the parsed Token
export interface ASTNode extends parsec.Token<TokenKind>{
    // number is for float number;
    //it's optional. since keyword has no value
    actualValue? : bigint | number | string;
}
```

增加處理常數的parser。`...value`有擴充object的意思。
```typescript
function applyInteger(value: parsec.Token<TokenKind.Int>): ASTNode {
    // extend value to ASTNode
    const newNode : ASTNode  = {
        actualValue : BigInt(value.text) ,
        ...value};
    return newNode;
}

function applyFloat(value: parsec.Token<TokenKind.Flo>): ASTNode {
    // extend value to ASTNode
    const newNode : ASTNode  = {
        actualValue : parseFloat(value.text) ,
        ...value};
    return newNode;
}

function applyString(value: parsec.Token<TokenKind.Str>): ASTNode {
    // extend value to ASTNode
    const newNode : ASTNode  = {
        // get only text[1,2,...,the second last char]
        actualValue : value.text.slice(1,value.text.length-1).replace(/\\\"/g, "\"") ,
        ...value};
    return newNode;
}
```


製作`CONST`這個parser，然後再加上rule：

```typescript
const CONST = parsec.rule<TokenKind, ASTNode>();
/*
CONST ::=  INT | FLOAT | STRING
*/
CONST.setPattern(
    parsec.alt(
        parsec.apply(parsec.tok(TokenKind.Int), applyInteger),
        parsec.apply(parsec.tok(TokenKind.Flo), applyFloat),
        parsec.apply(parsec.tok(TokenKind.Str), applyString),
    )
);
```

最後包起來進行測試：


```typescript
function mainParse(inputStr : string){
    return parsec.expectSingleResult(parsec.expectEOF(
        CONST.parse(tokenizer.parse(inputStr))));
}


// test
function main(){
    // bigint has suffix `n`
    assert.strictEqual(mainParse('123455667').actualValue, 123455667n);
    assert.strictEqual(mainParse('000').actualValue, 0n);
    assert.strictEqual(mainParse('1.22').actualValue, 1.22);
    assert.strictEqual(mainParse('0.0').actualValue, 0.0);
    assert.strictEqual(mainParse(`""`).actualValue, "");
    assert.strictEqual(mainParse(`"the little town"`).actualValue, `the little town`);
    assert.strictEqual(mainParse(`"\\\"Alice\\\""`).actualValue, `"Alice"`);


};
```


### 表達式
定義`AST型別`：

```type AST = AST[] | ASTNode;
```



## 平面操作

### 基本函數與直譯器
我們藉由以上的概念，可以定義一個將文字、線條等形狀排列到2D平面的語法，畢竟不論輸出PDF、SVG等等，粗略而言，就是一種2D平面安放文字的語言。另外PDF的格式相當晦澀，就算_PDF Explained_的PDF教學，也還是要輔助使用其他的工具，沒辦法看了就自己手刻PDF，所以還是用`printpdf`來教學吧。

現在我們初始化一個專案目錄，然後將需要的S-exp函式庫和pdf函數庫指定為相依函式庫：

```
cargo init; 

cargo add rsexp printpdf;
```

我們可以定義一些表達式（包含函數、資料結構，S-exp形式）的說明如下。`'()`表示空列表(empty list)，因為都要表達是函數的引用，所有的函數寫成形式`(Func "函數名稱" (引數1 引數2 ....))`。Float指64位元浮點數：

``` 
(px Float) ; px表達pixel單位，儲存浮點數
(pt Float) ; pt表達point單位，儲存浮點數
(style (str pt)) ; 文字樣式。String表示字型的路徑[fontPath]，Float表示字型大小(in Pt) (fontSize)
(str String) ; 儲存字串
(func "createPDF" '()) ;新增PDF
(func "createPage" '()) ;新增頁面
(func "writePdf" '(str)) ;寫入PDF頁面，String是PATH

(func "putchar" '(str style x y)) ; x 軸向右，y 軸向下，str 表示字元(char)，style 表示文字樣式
```

`main.rs`先引用函式庫：
`use printpdf::*;`


其中 `px`、`pt`是單位，所以可以在`main.rs`這樣定義：

```
enum Measure{
    Pt(f64),
    Px(f64)
}
```

最後一次定義expression：
```
enum Expr{
    Mea(Measure), // wrapper for measure
    Str(&str),
    Style{font_path : Measure, size : Measure},
    Func(&str, Vec<Expr>),
    Void // return nothing
}
```

然後我們可以這樣定義一個處理輸入輸出的interpreter於`interp`，並修改`main.rs`如下，縱使我們準時：
```
fn interp(exp : Expr)->(){
    // the function will be extended.
      match exp {
      Expr::Mea(Measure::Pt(x)) => println!("{:?} pt", x),
      Expr::Mea(Measure::Px(x)) => println!("{:?} px", x),
      
        _ => println!("not found expression"),
    };
}

// exexute interpreter
fn main() {
    interp(Expr::Mea(Measure::Pt(2.2)));
    interp(Expr::Flo(2.2));
}
```
