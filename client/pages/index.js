import { useEffect, useState} from "react"

export default function Home() {
  const [data, setData] = useState("Loading")

  useEffect(()=>{
    fetch("http://localhost:8080/api").then(
      response => response.json()
    ).then(
      data => setData(data.message)
    )
  })
  return (
    <main>
      {data}
    </main>
  )
}
