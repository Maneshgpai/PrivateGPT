import { useState } from "react";
import React from "react";

function TextSnippet({ result, Olddata, streamResponse, setStreamResponse }) {
  const [text, setText] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  var selectedCodeset = process.env.NEXT_PUBLIC_DEFAULT_CODESET
  var selectedPhysicianType = process.env.NEXT_PUBLIC_DEFAULT_PHYSICIAN_TYPE

  const handleSubmit = async (e) => {
    setError(false);
    event.preventDefault();
    if (!text) {
      return null;
    }
    setIsLoading(true);

    try {
      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      
      if (localStorage.getItem("selectedCodeset") !== null && localStorage.getItem("selectedCodeset") !== undefined) {
        selectedCodeset = JSON.parse(localStorage.getItem("selectedCodeset")).name;
      }
      
      if (localStorage.getItem("selectedPhysicianType") !== null && localStorage.getItem("selectedPhysicianType") !== undefined) {
        selectedPhysicianType = JSON.parse(localStorage.getItem("selectedPhysicianType")).name;
      }
      
      // console.log("selectedCodeset:",selectedCodeset)
      // console.log("selectedPhysicianType:",selectedPhysicianType)

      const queryParams = new URLSearchParams();
      queryParams.append("selectedCodeset", selectedCodeset);
      queryParams.append("selectedPhysicianType", selectedCodeset);

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
      //   // console.log("In TextSnippet.jsx > data:",data1[0].summary);
      //   // console.log("In TextSnippet.jsx > data2:",data1[0].summary.replace(/\\n/g, '\n'));
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
              console.log("Stream complete")
              setIsLoading(false);
              result([{
                summary: streamResponse.replace(/\\n/g, '\n')
              
              }])
              break;
            }
            let chunk = new TextDecoder("utf-8").decode(value);
            console.log("Stream value:",chunk)
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
              className="rounded-md border border-gray-700 bg-gray-800 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => handleOnChange(e)}
            />
            <div className="mt-4 text-center">
              <button
                type="submit"
                disabled={!text}
                className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
              >
                {!isLoading ? "Submit" : "Loading.."}
              </button>
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
