(letrec (
    (defaultFontFormat
        '(("fontFamily" "Gentium")

          ("color" "#000000")
          ("size" 12)        
        )
    )
    (map (lambda (f l)
        (if (!= l '())
            (cons (f (car l)) (map f (cdr l)))
            '())))
    (emptyDict '())
    (extendDict (lambda (dict var data) (cons (cons var (cons data '())) dict)))
    (dictRef (lambda (dict key)
        (if (= dict '()) false 
            (if (= key (car (car dict))) (car (cdr (car dict))) (dictRef (cdr dict) key))
        )))
    )

(begin
(addPDFPage '())
(drawText
    (dictRef defaultFontFormat "fontFamily")
    (dictRef defaultFontFormat "size")
    (dictRef defaultFontFormat "color")
    40.0
    50.0
    "blah"
)
(addPDFPage '())

(map (lambda (x) (+ x 2)) '(8 9 10))
(let ((dict emptyDict))
    (let ((dictExtended 
        (extendDict
        (extendDict emptyDict 1 2)  2 4)))
        (dictRef dictExtended 2)
))))