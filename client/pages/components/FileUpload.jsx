import { useState } from "react";
import React from 'react'

function FileUpload() {
    const [file, setFile] = useState(null);
    
      const handleSubmit = async (e) => {
        event.preventDefault()
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename_as_doc_id', 'true');
    
        const response = await fetch('http://localhost:8080/api/uploadFile', {
        mode: 'cors',
        method: 'POST',
        body: formData,
        });
    
        const responseText = await response.text();
        console.log(JSON.parse(responseText))
        if(response.status === 200){
            window.location.href = '/chat'
        }
      };
    
      const handleOnChange = e => {
        console.log(e.target.files[0]);
        setFile(e.target.files[0]);
      };
      return (
        <div className="h-screen min-w-full">
          <h1 className=" text-center text-4xl font-semibold mt-3">Chat with your data</h1>
          {/* <DropZone className='p-16 mt-10 border border-neutral-200' /> */}
          <form onSubmit={handleSubmit} className="flex flex-col justify-center align-middle mt-10">
            <div className=" text-center">
            <input type="file" onChange={(e) => handleOnChange(e)}/>
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded">Submit</button>
            </div>
          </form>
        </div>
      )
}

export default FileUpload
