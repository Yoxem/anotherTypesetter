[ Clo: another typesetter]{align="center"} [[
一個排版器的實作心得]{.box}]{align="center"} []{.box} [[
陳建町]{.box}]{align="center"}

版權聲明

\(c\) 2023 陳建町 (Tan, Kian-ting)

本書內容非經許可，禁止複製、分發、商業使用等違反著作權法之行為。

然書中之程式碼，採用
[MIT許可證](https://opensource.org/license/mit/)授權。

序言

以前從國中時候試用Linux以及架站以後，就開始想用LaTeX排版些自己所寫的東西，其中包含覺得LaTeX的語法不好想要重造輪子。就算後來大學沒有走上資訊工程這條路，還是希望有天至少能夠完成個能用的雛形。

但是這是涉及字體檔案的處理、PDF的處理、語法分析，後來自己因為不知道如何開發，所以一直停擺。不是遇到很多蟲，就是效能問題有缺失。因為時間繁忙很少更不消說了。甚至買了Knuth教授的
*Digital
Typography*，想要瞭解斷行演算法，結果粗估五、六十頁，所以幾乎沒有讀。

另外筆者一個分支興趣是編譯器的相關知識，所以開始讀和王垠的編譯器思想系出同門的Jeremy
G. Siek所著作之_Essential of Complication: An Incremental Approach in
Racket
