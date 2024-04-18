(begin
(define defaultFontFormat
    '(("fontFamily" "Gentium")
      ("color" "#ff0000")
      ("fontSize" 12)        
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
        (if (= (listRef text 0) "fontSize")
            (let ((newFormat (setDictItem format "fontSize" (listRef text 1)))) (text2boxAux1 newFormat (listRef text 2)))
            text)
        (cons format (cons text '())))
))

(define text2boxAux1 (lambda (format txt) 
(if (isList txt)
(map (lambda (x) (text2boxAux2 format x)) txt)
(cons format (cons txt '()))
)))

(define text2box (lambda (txt) (text2boxAux1 defaultFontFormat txt)))




(drawText
(dictRef defaultFontFormat "fontFamily")
(dictRef defaultFontFormat "fontSize")
(dictRef defaultFontFormat "color")
40.0
50.0
"blah"
)
(define text '("abracabra" ("fontSize" 18 "貓") "foo"))
(text2box text)
(measureWidthPx "1314abc" "Gentium" 12.0)
)