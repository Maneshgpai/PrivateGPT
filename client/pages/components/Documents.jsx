import { useState, useEffect } from 'react'
import Loading from './Loader'

function Documents() {
    const [data, setData] = useState([])
    const [isLoading, setLoading] = useState(false)
    const url = process.env.NEXT_PUBLIC_API_URL

    useEffect(()=>{
        setLoading(true)
        try{
        fetch(`${url}/api/getDocuments`, {
            mode: 'cors',
            method: 'GET',
        })
        .then((res)=> res.json())
        .then((data) => {
            setData(data)
            setLoading(false)
            // console.log(data)
        })}
        catch{
            setData(["Failed to fetch"])
            setLoading(false)
        }
    }, [])

    if(isLoading){
        // return <p className='text-center py-3 font-bold text-5xl'>Loading...</p>
        return <Loading/>
    }
    if(!data){
        return <p className='text-center py-3 font-bold text-5xl'>No documents uploaded</p>
    }

    return (
    <div>
        <div className=' flex flex-col justify-center items-center'>
            <h1 className='text-center py-3 font-bold text-5xl'>Uploaded Documents</h1>
            <ul className=' mt-6 text-lg'>
            {data.map((ele, index) => (
                    <li key={index}>{index+1}. {ele}</li>
            ))}
            </ul>
        </div>
    </div>
    )
}

export default Documents
