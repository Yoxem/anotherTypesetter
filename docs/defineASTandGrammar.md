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
Language ::= PrintTxt | Exprs

PrintTxt ::= (('\' '@')| 非@字元)+ //「我是一隻貓」或是「www\@example.com」

Exprs ::= @ Expr* @ // *表示前面的重複0次以上（包含不出現）

Expr ::= (Letting | Setting | Lambda | Apply | Var| Const) | "(" Expr ")"

Letting ::= "let" Var "=" Expr "in" Expr // let foo = 12 in ...

Setting ::= Var ":=" Expr "in"  Expr // foo := a in ...

Lambda ::= "fn" Var "->" Expr // fn x -> 12

Apply ::= Expr Expr // foo 3 即foo(3)

Var ::= ID

Const ::= String | Float | Int

ID ::=  ("_" | [a-z] |  [A-Z])  ("_" | [0-9] | [a-z] |  [A-Z])+

Integer ::= [0-9]+

Float ::= [0-9]+ "." [0-9]+

String ::= '"' (不是「"」的任一字元|('\' '"'))   '"'
```

## 用ParserCombinator進行tokenize
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

假設我們要將字串`s`的前3個字的match 0~9呢？如果會高階函數的話，引入一個`then`函數，然後把`match0to9`傳進去，這樣寫起來比較簡潔，行數可以比較少：

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
我們可以製作一個小的tokenizer。但是因為自己寫parser combinator太累了，所以我們就用nom來幫我們代勞。


安裝nom可以用：`cargo run nom`。

假設我們要match 0-9任意次以上（就是integer），我們可以這樣寫：

```

// import all the parser unit for string
use nom::character::complete::*;
// for the return type
use nom::IResult;

// integer ::= [0-9]+
pub fn integer(input: &str) -> IResult<&str, &str> {
    return digit1(input) ; // [0-9]+
}

// test parser
#[cfg(test)]
mod tests {
    // import the functions ouside mod tests
    use super::*;

    // test integer
    #[test]
    fn test_integer() {
    //if no error is shown, the function passes the test
    assert_eq!(integer("12345"), Ok(("", "12345")));
    assert_eq!(integer("0"), Ok(("", "0")));
    }
}


```

用`cargo run`可以順利通過：

```
running 1 test
test tests::test_integer ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

我們做第二個tokenizer，`float`：

其中的`recognize`蒐集所有包在裡面的`parsers`的string。
```
// collect matched strings of all the parsers,
use nom::combinator::recognize;
// given 2 parser and gets the result as (1st_matched, 2nd_matched),
use nom::sequence::pair;
// exact matching characters
use nom::bytes::complete::tag;

// float ::= [0-9]+ "." [0-9]+
pub fn float(input: &str) -> IResult<&str, &str>{
    // [0-9]+ "." [0-9]+
    // "12.345" returns Ok((else, (("12", '.'), "345"))), then recgonize them as
    // Ok("12.345")
    let a = 
        recognize(pair(pair(digit1, tag(".")), digit1))(input);
    return a;

}

```

parser `identifier`（引用的函數的名稱空間略）。使用`fold_may0`和新的空vector來儲存match多次的parser的符合結果：
```
pub fn identifier(input : &str) -> IResult<&str, &str>{
    return recognize(pair(
        // 1st character is a-z, A-Z or _
        satisfy(|c| (is_alphabetic(c as u8) || c == '_')),
        // the tail characters (0+ times matched) storing in a vector
    fold_many0(
        // a-z, A-Z, 0-9, _ 
        satisfy(|c| (is_alphanumeric(c as u8) || c == '_')),
        // initial vector
        Vec::new,
        // once it matches, append the matched item to the vector.
        |mut acc: Vec<_>, item| {
          acc.push(item);
          acc
        }
      )))(input);
    
}


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
