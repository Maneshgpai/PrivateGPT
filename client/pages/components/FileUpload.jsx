import { useState } from "react";
import React from 'react'
import Loading from "./Loading";

function FileUpload() {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    
      const handleSubmit = async (e) => {
        event.preventDefault()
        if(!file){
          return null
        }
        setIsLoading(true)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename_as_doc_id', 'true');
    
        try{
        const response = await fetch('http://localhost:8080/api/uploadFile', {
        mode: 'cors',
        method: 'POST',
        body: formData,
        });

        const responseText = await response.text();
        console.log(JSON.parse(responseText))
        if(response.status === 200){
            setIsLoading(false)
            window.location.href = '/chat'

        }
        else {
          setIsLoading(false)
          const data = JSON.parse(responseText)
          setError(data.message)
        }
        }

        catch{
        setIsLoading(false)
        setError("Something went wrong")
        }
      };
    
      const handleOnChange = e => {
        console.log(e.target.files[0]);
        setFile(e.target.files[0]);
        setError("")
      };
      return (
        <div className="h-screen min-w-full">
          <h1 className=" text-center py-3 font-bold text-5xl">Upload a PDF file</h1>
           <form onSubmit={handleSubmit} className="flex flex-col justify-center align-middle mt-20">
            { !isLoading && <div className=" text-center">
            <input type="file" onChange={(e) => handleOnChange(e)}/>
            <button type="submit" onClick={file ? () => setError("") : () => setError("Please upload a file")} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded">Submit</button>
            </div>}
            {
            isLoading && <Loading/>
            }
          </form>
          <div className="flex justify-center align-middle text-red-700 mt-6"> <p>{error}</p> </div>
          
        </div>
      )
}

export default FileUpload
