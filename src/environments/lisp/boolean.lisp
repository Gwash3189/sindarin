(ns Boolean
  (defn cast
    (item)
    (if (or (= item null) (= item false))
      false
      true
    )
  )
  (defn truthy?
    (item)
    (if (= (Boolean/cast item) true)
      true
      false
    )
  )
  (defn falsey?
    (item)
    (if (= (Boolean/cast item) false)
      false
      false
    )
  )
)
