(ns Range
  (defn create
    (start end)
    (begin
      (defn -range
        (start end list)
        (if (= end 0)
          list
          (-range
            start
            (- end 1)
            (List/concat
              (List/create
                  end
              )
              list
            )
          )
        )
      )
      (-range start end (List/create))
    )
  )
)
