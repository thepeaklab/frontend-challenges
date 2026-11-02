import { useEffect, useState } from 'react'

interface Counts {
  app: number
  first: number
  second: number
}

const increaseAll = (counts: Counts): Counts => ({
  app: counts.app + 1,
  first: counts.first + 1,
  second: counts.second + 1,
})

export default function App() {
  const [counts, setCounts] = useState<Counts>({ app: 0, first: 0, second: 0 })

  useEffect(() => {
    const id = setInterval(() => setCounts(increaseAll), 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <main>
      <h1>Make it Count!</h1>
      <button onClick={() => setCounts(increaseAll)}>app count is {counts.app}</button>
      <div className="row">
        <button onClick={() => setCounts((c) => ({ ...c, first: c.first + 1 }))}>count is {counts.first}</button>
        <button onClick={() => setCounts((c) => ({ ...c, second: c.second + 1 }))}>count is {counts.second}</button>
      </div>
    </main>
  )
}
