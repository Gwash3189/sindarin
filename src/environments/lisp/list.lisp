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
      (def count (List/count list))
      (if (= count 0)
      false
      (begin
        (def result (= (pred (List/head list)) true))
        (if (= count 1)
          result
          (if (= result true)
            (every? (List/tail list) pred)
            (return false)
          )
        )
      )
    ))
  )
)
