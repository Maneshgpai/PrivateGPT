import { useState } from "react";
import React from "react";
import { useUser } from "@clerk/nextjs";
import { colors } from "@/constant/colors";
import { TextareaAutosize as BaseTextareaAutosize } from '@mui/base/TextareaAutosize';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
// import Tooltip from '@mui/material/Tooltip';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import ReplayIcon from '@mui/icons-material/Replay';
import axios from "axios";

function TextSnippet({ result, Olddata, streamResponse, setStreamResponse, clearAllContent, completeText, setCompleteText, setCompleteStream, completeStream, setOpen }) {
  const [text, setText] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useUser();


  const checkUserStatus =async ()=>{
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/check-user-status`, { id: user.id });
      if (response.data.status !== 'payment_method_added') {
        setOpen(true);
        return false
      } else {
        setOpen(false);
        return true
      }

    }
    catch (e) {
      console.log(e)
    }
  }

  const handleSubmit = async (e) => {
    setError(false);
    event.preventDefault();
    if (!text) {
      return null;
    }
    setIsLoading(true);
    
    const userStatus = await checkUserStatus()
    if (!userStatus){
      setIsLoading(false);
      return 
    }
    setCompleteText(false)
    setCompleteStream(false)

    try {
      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      const queryParams = new URLSearchParams();
      queryParams.append("uid", user.id);


      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL
        }/api/summarise-text?${queryParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text, userId : user?.id })
      });
    

      if (response.status === 200) {
        // if (response)
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

      }
      
    } catch (e) {
      setIsLoading(false);
      if (e.message === "Payment Issue"){
        setOpen(true)

      }
      setError(e.message);
    }
  };

  const handleOnChange = (e) => {
    setText(e.target.value);
    setError("");
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-3/5">
        <div className="mx-auto">
          <form onSubmit={handleSubmit}
            className="mt-10 flex flex-col justify-center align-middle">
            <div className="text-sm text-gray-800 py-2" >
              You can input any ailment, condition, procedure, medication or even paste the content of an entire clinical note, the system will respond with correponding ICD-10, CPT or HCPCS codes.
            </div>
            {/* TEXT AREA */}

            <BaseTextareaAutosize
              id="text-snippet"
              name="text-snippet"
              type="input"
              placeholder="Paste text from medical note to generate ICD10, CPT and HCPCS codes"
              rows="30"
              value={text}
              className="rounded-md border border-gray-700 text-black-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-grey-500"
              onChange={(e) => handleOnChange(e)}
            />
            <div className="mt-6 text-center gap-4 flex justify-center">
              {/* SUBMIT BUTTON */}
              {/* <Tooltip title="Submit query"> */}
                <LoadingButton
                  loading={isLoading}
                  variant="contained"
                  disableElevation
                  onClick={handleSubmit}
                  className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
                ><SearchRoundedIcon /></LoadingButton>
                {/* </Tooltip> */}

              {/* REGENERATE BUTTON */}
              {completeStream &&
                // <Tooltip title="Regenerate response">
                  <Button
                    loading={isLoading}
                    variant="contained"
                    disableElevation
                    onClick={handleSubmit}
                    className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
                  ><ReplayIcon /></Button>
                  // </Tooltip>
              }

              {!(completeStream) &&
                <Button
                    disabled
                    variant="outlined"
                    disableElevation
                    className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
                  ><ReplayIcon /></Button>
              }

              {/* CLEAR BUTTON */}
              {!(completeStream) &&
                <Button
                    disabled
                    variant="outlined"
                    disableElevation
                    className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
                  ><ClearRoundedIcon /></Button>}
              {completeStream &&
                // <Tooltip title="Clear response">
                  <Button
                    loading={isLoading}
                    variant="outlined"
                    onClick={() => {
                      clearAllContent()
                      setText("")
                      setStreamResponse("")
                      setCompleteText(false)
                      setCompleteStream("")
                    }}
                    className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
                  ><ClearRoundedIcon /></Button>
                  // </Tooltip>
                }

            </div>
          </form>
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
  );
}

export default TextSnippet;
