(begin
(define defaultFontFormat
    '(("fontFamily" "Noto Sans CJK TC")
      ("color" "#ff0000")
      ("fontSize" 12.0)        
    )
)


(define map (lambda (f l)
    (if (!= l '())
        (cons (f (car l)) (map f (cdr l)))
        '())))
(define emptyDict '())
(define extendDict (lambda (dict var data) (cons (cons var (cons data '())) dict)))
(define dictRef (lambda (dict key)
    (if (= dict '()) false 
        (if (= key (car (car dict))) (car (cdr (car dict))) (dictRef (cdr dict) key))
    )))
(define setDictItem (lambda (dict key data)
    (if (= (dictRef dict key) false)
      false
        (setDictItemAux dict '() key data)
)))

(define addDictItem (lambda (dict key data)
    (if (= (dictRef dict key) false)
        (extendDict dict key data)
        dict
    )
))

(define setDictItemAux (lambda (oldDict newDict key data)
(if (= oldDict '()) newDict
(if (= (car(car oldDict)) key)
    (setDictItemAux (cdr oldDict) (cons (cons key (cons data '())) newDict)  key data)
    (setDictItemAux (cdr oldDict) (cons (car oldDict) newDict) key data)
))))


(addPDFPage '())
(addPDFPage '())
(define text2boxAux2 (lambda (format text)
    (if (isList text)
        // set font size
        (if (= (listRef text 0) "fontSize")
            (let ((newFormat (setDictItem format "fontSize" (listRef text 1)))) (text2boxAux1 newFormat (listRef text 2)))
            text)
        (cons (cons "content" (cons text '())) format)
    )
))

(define text2boxAux1 (lambda (format txt) 
(if (isList txt)
(map (lambda (x) (text2boxAux2 format x)) txt)
(cons  (cons "content" (cons txt '())) format)
)))

// (measureWidthPx "1314abc" "Gentium" 12.0)

(define measureBoxItem (lambda (boxList) (map measureBoxItemAux boxList)))
(define measureBoxItemAux (lambda (boxDict)
   (let 
    ((fontFamily (dictRef boxDict "fontFamily"))
    (fontSize (dictRef boxDict "fontSize"))
    (content (dictRef boxDict "content")))
        (let
            ((measuredWidthPx (measureWidthPx content fontFamily fontSize)))
            (addDictItem boxDict "widthPx" measuredWidthPx)
        )
)))

(define text2box (lambda (txt)
    (let ((tmp1 (text2boxAux1 defaultFontFormat txt)))
    (let ((res (measureBoxItem tmp1))) res)
)))





//(drawText
//(dictRef defaultFontFormat "fontFamily")
//(dictRef defaultFontFormat "fontSize")
//(dictRef defaultFontFormat "color")
//40.0
//50.0
//"blah"
//)
(define x 0.0)

(define text '("abracabra" ("fontSize" 18.0 "貓") "foo"))

(define putOnChar (lambda (boxDict x)
(let
    ((content (dictRef boxDict "content"))
    (fontFamily (dictRef boxDict "fontFamily"))
    (fontSize (dictRef boxDict "fontSize"))
    (color (dictRef boxDict "color"))
    (widthPx (dictRef boxDict "widthPx"))
    )
    (begin
    (drawText fontFamily fontSize color x 100.0 content)
    (+ x widthPx)) // return an updated x

)))

(define putOnChars (lambda (ls x)
                    (if (= ls '())
                        '()
                        (let 
                        ((newX (putOnChar (car ls) x)))
                        (putOnChars (cdr ls) newX))                
                                ))
)

(let ((boxOfText (text2box text)))
    (putOnChars boxOfText 0.0)
)



 (text2box text)
// (measureWidthPx "1314abc" "Gentium" 12.0)
)