(letrec ((
    map (lambda (f l)
        (if (!= l '())
            (cons (f (car l)) (map f (cdr l)))
            '()))
))
(begin
(addPDFPage '())
(addPDFPage '())
(map (lambda (x) (+ x 2)) '(8 9 10))

))