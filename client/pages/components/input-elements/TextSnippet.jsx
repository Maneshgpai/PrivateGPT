import { useState } from "react";
import React from "react";
import { useUser } from "@clerk/nextjs";
    
function TextSnippet({ result, Olddata, streamResponse, setStreamResponse, clearAllContent,completeText, setCompleteText,setCompleteStream, completeStream }) {
  const [text, setText] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // var selectedCodeset = process.env.NEXT_PUBLIC_DEFAULT_CODESET
  // var selectedPhysicianType = process.env.NEXT_PUBLIC_DEFAULT_PHYSICIAN_TYPE
  const { user } = useUser();

  const handleSubmit = async (e) => {
    setError(false);
    event.preventDefault();
    if (!text) {
      return null;
    }
    setIsLoading(true);
    setCompleteText(false)

    try {
      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      
      // if (localStorage.getItem("selectedCodeset") !== null && localStorage.getItem("selectedCodeset") !== undefined) {
      //   selectedCodeset = JSON.parse(localStorage.getItem("selectedCodeset")).name;
      // }
      
      // if (localStorage.getItem("selectedPhysicianType") !== null && localStorage.getItem("selectedPhysicianType") !== undefined) {
      //   selectedPhysicianType = JSON.parse(localStorage.getItem("selectedPhysicianType")).name;
      // }
      
      // console.log("selectedCodeset:",selectedCodeset)
      // console.log("selectedPhysicianType:",selectedPhysicianType)

      const queryParams = new URLSearchParams();
      queryParams.append("uid", user.id);

      // const response = await fetch(
      //   `${
      //     process.env.NEXT_PUBLIC_API_URL
      //   }/api/summarise-text?${queryParams.toString()}`,
      //   {
      //     mode: "cors",
      //     method: "POST",
      //     body: JSON.stringify({ text: text }),
      //     headers,
      //   }
      // );

      // if (response.status === 200) {
      //   const data = await response.json();
      //   var data1 = data
      //   console.log("In TextSnippet.jsx > data:",data1[0].summary);
      //   console.log("In TextSnippet.jsx > data2:",data1[0].summary.replace(/\\n/g, '\n'));
      //   setIsLoading(false);
      //   result(data);
      // } else {
      //   const responseText = await response.text();
      //   const data = JSON.parse(responseText);
      //   setIsLoading(false);
      //   setError(data.message);
      // }


      const response = await fetch(`${
            process.env.NEXT_PUBLIC_API_URL
          }/api/summarise-text?${queryParams.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
            });

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

      }
    } catch (e) {
      setIsLoading(false);
      setError(e.message);
    }
  };

  const handleOnChange = (e) => {
    setText(e.target.value);
    setError("");
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-4/5">
        <div className="mx-auto">
          <form
            onSubmit={handleSubmit}
            className="mt-2 flex flex-col justify-center align-middle"
          >
            <textarea
              id="text-snippet"
              name="text-snippet"
              type="input"
              placeholder="Paste relevant text from medical note"
              rows="12"
              value={text}
              className="rounded-md border border-gray-700 bg-gray-800 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => handleOnChange(e)}
            />
            <div className="mt-4 text-center gap-4 flex justify-center">
              <button
                type="submit"
                disabled={!text}
                className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
              >
                {!isLoading ? "Submit" : "Wait"}
              </button>
              <button
        type="button"
        onClick={()=>{
          clearAllContent()
          setText("")
          setStreamResponse("")
          setCompleteText(false)
          setCompleteStream("")

        }}
        className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
        >
        Clear All
      </button>
              {completeStream &&<button
        type="submit"
        
        className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
        >
       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
</svg>

      </button>}
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
