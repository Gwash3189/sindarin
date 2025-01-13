(ns List
  (defn count
    (list count)
    (if (Core/null? count)
      (List/count list 0)
      (if (Core/null? (List/head list))
        count
        (List/count (List/tail list) (+ count 1))
      )
    )
  )
  (defn reduce
    (list func acc)
    (begin
      (if (= (List/count list) 0)
        acc
        (reduce
          (List/tail list)
          func
          (func
            (List/head list)
            acc
          )
        )
      )
    )
  )
  (defn sum
    (list)
    (reduce list (fn (x y) (+ x y)) 0)
  )
  (defn every?
    (list pred)
    (begin
      (if (= (List/count list) 0)
        false
        (List/reduce
          list
          (fn (acc current)
            (and
              true
              (pred acc)
            )
          )
        )
      )
    )
  )
  (defn some?
    (list pred)
    (begin
      (if (= (List/count list) 0)
        false
        (Boolean/cast
          (List/reduce
            list
            (fn (acc current)
              (or acc (pred current))
            )
            (List/head list)
          )
        )
      )
    )
  )
)
