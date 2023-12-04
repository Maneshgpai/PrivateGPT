import { useState } from "react";
import React from "react";
import Loading from "../Loader";
import { useUser } from "@clerk/nextjs";

function FileUpload({ result, Olddata, streamResponse, setStreamResponse, clearAllContent,completeText, setCompleteText,setCompleteStream, completeStream }) {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const { user } = useUser();

  const handleSubmit = async (e) => {
    setError(false);
    event.preventDefault();
    if (files.length < 1) {
      return null;
    }
    setIsLoading(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const headers = new Headers();
      const queryParams = new URLSearchParams();
      queryParams.append("uid", user.id);
      
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/upload-file?${queryParams.toString()}`,
        {
          mode: "cors",
          method: "POST",
          body: formData,
          headers,
        }
      );
      
      if (response.status === 200) {
        const reader = response.body.getReader();
        setStreamResponse("")
        const processStream = async () =>{
          while(true){
            const {done, value} = await reader.read();

            if(done){
              // console.log("Stream complete")
              setIsLoading(false);
              result([{
                summary: streamResponse.replace(/\\n/g, '\n')
              
              }])
              setCompleteText(true)
              break;
            }
            let chunk = new TextDecoder("utf-8").decode(value);
            // console.log("Stream value:",chunk)
            result([{}])
            setStreamResponse((prev) => prev + chunk)
            // let chunk = 

                
          }
        }
        processStream().catch(error => {
          console.log(error);
        });

      } else {
        setIsLoading(false);
        const data = JSON.parse(responseText);
        setError(data.message);
      }
    } catch (error) {
      setIsLoading(false);
      console.log(error)
      setError("Something went wrong");
    }
  };

  const handleOnChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      setFiles(Array.from(selectedFiles));
      setError("");
    } else {
      setFiles([]);
      setError("No files selected.");
    }
  };

  const handleDeleteFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div className=" w-4/5">
        <div className="mx-auto">
          <div className="mt-2 flex justify-between align-center rounded-lg border border-dashed border-gray-900/25 px-6 py-6"
          
          style={{
            backgroundColor: "#ebeef4",
            color: "#000"
          
          
          }}>
            <div className="flex flex-row">
              <div className="mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="#E0E0E0"
                  className="w-12 h-12"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold text-gray-300" style={{
              backgroundColor: "#ebeef4",
              color: "#000"
            
            
            }}>
                  Upload PDF File(s)
                </p>
                <p className="text-xs leading-5 text-gray-600">
                  PDF up to 10MB
                </p>
              </div>
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col justify-between align-middle"
            >
              {getFileUploadComponent()}
            </form>
          </div>
          {files.length ? getFileComponent() : <></>}
          {error ? (
            <div className="flex justify-center align-middle text-red-700 mt-6">
              {" "}
              <p>{error}</p>{" "}
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );

  function getFileUploadComponent() {
    return (
      <div className="text-center">
        <div className="flex text-sm leading-6 text-gray-600">
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer rounded-md font-semibold text-gray-300 hover:text-indigo-500"
          >
            <span className="px-4 py-2 rounded-md  hover:text-white" style={{
              backgroundColor: "#2E85FF",
              color: "#000"
            
            
            }}>
              Browse Files
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              onChange={(e) => handleOnChange(e)}
              multiple
            />
          </label>
        </div>
      </div>
    );
  }

  function getFileComponent() {
    return (
      <div className="text-center">
        <div className="mt-4 flex flex-col text-sm leading-6 text-gray-600">
          {files.map((file, index) => (
            <div
              key={index}
              className="w-full py-2 flex flex-row justify-between text-lg relative cursor-pointer rounded-md font-bold text-gray-300 hover:text-gray-300"
            >
              <div className="flex flex-row">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="#000"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                <span className="ml-1" style={{
              backgroundColor: "#ebeef4",
              color: "#000"
            
            
            }}>{file.name}</span>
              </div>
              <div>
                <button onClick={() => handleDeleteFile(index)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 gap-4 flex justify-center items-center" >
          <button
            type="submit"
            onClick={
              files
                ? (e) => {
                    handleSubmit(e);
                  }
                : () => setError("Please upload a file")
            }
            className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"

            style={{
              backgroundColor: "#2E85FF",
              color: "#000"
            
            
            }}
          >
            {isLoading ? "Uploading.." : "Upload"}
          </button>
          <button
            type="submit"
            onClick={
              files
                ? (e) => {
                    handleSubmit(e);
                  }
                : () => setError("Please upload a file")
            }
            className="bg-white ml-5 inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
</svg>

          </button>
        </div>
      </div>
    );
  }
}

export default FileUpload;
