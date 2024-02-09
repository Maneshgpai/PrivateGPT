import { useState } from "react";
import React from "react";
import { useUser } from "@clerk/nextjs";
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LoadingButton from '@mui/lab/LoadingButton';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import ReplayIcon from '@mui/icons-material/Replay';
// import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddToDriveOutlinedIcon from '@mui/icons-material/AddToDriveOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import Box from '@mui/material/Box';
import axios from "axios";

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});


function FileUpload({ result, Olddata, streamResponse, setStreamResponse, clearAllContent, completeText, setCompleteText, setCompleteStream, completeStream, setOpen }) {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const { user } = useUser();

const checkUserStatus =async ()=>{
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/check-user-status`, { id: user.id });
      if (response.data.status == 'trialing' || response.data.status == 'active_and_payment_added') {
        setOpen(false);
        return true
      } else {
        setOpen(true);
        return false
      }

    }
    catch (e) {
      console.log(e)
    }
  }
  const handleSubmit = async (e) => {
    setError(false);
    event.preventDefault();
    if (files.length < 1) {
      return null;
    }
    setIsLoading(true);
    setCompleteText(false)
    setCompleteStream(false)
    setStreamResponse("")
    const userStatus = await checkUserStatus()
    if (!userStatus){
      setIsLoading(false);
      return 
    }
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setStreamResponse("")
      const headers = new Headers();
      const queryParams = new URLSearchParams();
      queryParams.append("uid", user.id);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL
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
        const processStream = async () => {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              setIsLoading(false);
              result([{
                summary: streamResponse.replace(/\\n/g, '\n')

              }])
              setCompleteText(true)
              setCompleteStream(streamResponse.replace(/\\n/g, '\n'))
              break;
            }
            let chunk = new TextDecoder("utf-8").decode(value);
            result([{}])
            setStreamResponse((prev) => prev + chunk)

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
        <div className="mt-10">
          <form
            onSubmit={handleSubmit}
            className="mt-3 flex flex-col justify-center align-middle items-center w-full">
            <div className="flex justify-center align-middle w-full" >
            {getFileUploadComponent()}
            </div>
            <div className="text-sm text-gray-500 py-2" >
              Upload PDF file only
            </div>
          </form>

          {files.length ? 
          
          <div className="text-xs mt-1 text-gray-500">
            {files.map((file, index) => (
              <div key={index} className="text-xs w-full flex flex-row border border-gray-300 justify-center align-middle text-gray-300 hover:text-gray-300">
                <span style={{ backgroundColor: "#ebeef4", color: "#000" }}>{file.name}
                  <IconButton aria-label="delete" size="small" onClick={() => handleDeleteFile(index)} >
                    <DeleteIcon />
                  </IconButton>
                </span>
              </div>
            ))}
          </div> : <></>}

          <div className="mt-4 gap-4 text-center flex justify-center">
            {/* UPLOAD BUTTON */}
            {/* <Tooltip title="Upload file"> */}
              <LoadingButton
                loading={isLoading}
                variant="contained"
                disableElevation
                onClick={files ? (e) => { handleSubmit(e); } : () => setError("Please upload a file")}
                className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
              ><FileUploadOutlinedIcon /></LoadingButton>
              {/* </Tooltip> */}

            {/* REGENERATE BUTTON */}
            {completeStream &&
              // <Tooltip title="Regenerate response">
                <Button
                  loading={isLoading}
                  variant="contained"
                  disableElevation
                  onClick={files ? (e) => { handleSubmit(e); } : () => setError("Please upload a file")}
                  className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
                ><ReplayIcon /></Button>
                // </Tooltip>
            }

            {/* CLEAR BUTTON */}
            {!(completeStream) &&
              // <span><Tooltip title="Regenerate response">
                <Button
                  disabled
                  variant="outlined"
                  disableElevation
                  className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
                ><ReplayIcon /></Button>
                // </Tooltip></span>
            }

            {!(completeStream) &&
              // <span><Tooltip title="Clear response">
                <Button
                  disabled
                  variant="outlined"
                  disableElevation
                  className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
                ><ClearRoundedIcon /></Button>
                // </Tooltip></span>
              }
            {completeStream &&
              // <Tooltip title="Clear response">
                <Button
                  loading={isLoading}
                  variant="outlined"
                  onClick={() => {
                    clearAllContent()
                    setStreamResponse("")
                    setCompleteText(false)
                    setCompleteStream("")
                    setFiles([])
                  }}
                  className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
                ><ClearRoundedIcon /></Button>
                // </Tooltip>
              }
          </div>

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
      <div className="flex flex-row lg:gap-4 sm:gap-2">
      <Button component="label" variant="contained" disableElevation 
        onChange={(e) => handleOnChange(e)}
        sx={{ textTransform: 'capitalize', fontSize: 12, mx: 1 }}><DevicesOutlinedIcon sx={{mr:1, size:"small" }}/>Browse file from computer<VisuallyHiddenInput type="file" single accept="application/pdf" />
      </Button>
      <Button component="label" variant="contained" disableElevation 
        onChange={(e) => handleOnChange(e)} disabled
        sx={{ textTransform: 'capitalize', fontSize: 13, mx: 'auto' }}><AddToDriveOutlinedIcon sx={{mr:1, size:"small" }}/>Browse file from Google Drive<VisuallyHiddenInput type="file" multiple accept="application/pdf" />
      </Button>
      </div>
    );
  }

  function getFileComponent() {
    return (
      <div className="mt-1 flex flex-col justify-center align-middle items-center  w-full text-sm leading-6 text-gray-500">
        {files.map((file, index) => (
          <div key={index} className="w-full py-1 flex flex-row border border-gray-300 justify-center align-middle cursor-pointer rounded-md text-gray-300 hover:text-gray-300">
            <span style={{ backgroundColor: "#ebeef4", color: "#000" }}>{file.name}
              <IconButton aria-label="delete" size="small" onClick={() => handleDeleteFile(index)} >
                <DeleteIcon />
              </IconButton>
            </span>
          </div>
        ))}
      </div>
    );
  }
}

export default FileUpload;
