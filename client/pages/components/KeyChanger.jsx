import { useState, useEffect } from "react";
import React from "react";
import Loading from "./Loader";

function KeyChanger() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [openAIKey, setOpenAIKey] = useState(null);
  const [showKey, setShowKey] = useState(false);

  const handleApiKeyChange = (event) => {
    const newApiKey = event.target.value;
    setOpenAIKey(newApiKey);
  };

  const toggleKeyVisibility = () => {
    setShowKey(!showKey);
  };

  const handleDeleteOpenAIKey = () => {
    setOpenAIKey(null);
    localStorage.removeItem("openAIKey");
    window.dispatchEvent(new Event("openAIKeyUpdate"));
  };

  useEffect(() => {
    if (localStorage.getItem("openAIKey")) {
      setOpenAIKey(localStorage.getItem("openAIKey"));
    }

    const handleOpenAIKeyChange = () => {
      const updatedValue = localStorage.getItem("openAIKey");
      setOpenAIKey(updatedValue);
    };

    window.addEventListener("openAIKeyUpdate", handleOpenAIKeyChange);

    return () => {
      window.removeEventListener("openAIKeyChanged", handleOpenAIKeyChange);
    };
  }, []);

  const handleSubmit = (e) => {
    console.log(e.target.files[0]);
    setFile(e.target.files[0]);
    setError("");
  };

  return (
    <div className="">
      {isLoading ? (
        <>
          <Loading />
          <p className="text-xs leading-5 text-white mt-2">Uploading..</p>
        </>
      ) : openAIKey ? (
        <div className="relative isolate">
          <div className="mx-auto max-w-2xl">
            {getShowKeyComponent()}

            <div className="flex justify-center align-middle text-red-700 mt-6">
              {" "}
              <p>{error}</p>{" "}
            </div>
          </div>
        </div>
      ) : (
        getInsertKeyComponent()
      )}
    </div>
  );

  function getShowKeyComponent() {
    return (
      <div className="text-center">
        <div className="text-sm leading-6 text-gray-900">
          <label
            htmlFor="api-key"
            className="relative cursor-pointer rounded-md font-semibold text-white"
          >
            <div className="flex justify-between">
              <span>API Key</span>
              <div className="flex justify-end">
                <span
                  className="cursor-pointer py-2"
                  onClick={toggleKeyVisibility}
                >
                  {showKey ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  )}
                </span>
                <span className="py-2 ml-2" onClick={handleDeleteOpenAIKey}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </span>
              </div>
            </div>
            <input
              id="api-key"
              name="api-key"
              type={showKey ? "text" : "password"}
              className="rounded-md border border-gray-700 bg-gray-800 text-gray-300 px-2 py-2 text-sm mt-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={openAIKey}
              onChange={handleApiKeyChange}
            />
          </label>
        </div>
      </div>
    );
  }

  function getInsertKeyComponent() {
    return (
      //   <div className="text-center">
      //     <div className="mt-4 flex text-sm leading-6 text-gray-700">
      //       <p className="text-lg relative cursor-pointer rounded-md font-bold text-white hover:text-indigo-500">
      //         <span>{file.name}</span>
      //       </p>
      //     </div>
      //     <div className="mt-4">
      //       <button
      //         type="submit"
      //         onClick={
      //           file ? () => setError("") : () => setError("Please upload a file")
      //         }
      //         className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-full"
      //       >
      //         Upload
      //       </button>
      //     </div>
      //   </div>
      <></>
    );
  }
}

export default KeyChanger;
