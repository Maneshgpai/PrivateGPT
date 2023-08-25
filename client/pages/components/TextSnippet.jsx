import { useState } from "react";
import React from "react";
import Loading from "./Loader";

function TextSnippet({ result }) {
  const [text, setText] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    setError(false);
    event.preventDefault();
    if (!text) {
      return null;
    }
    setIsLoading(true);

    try {
      const headers = new Headers();
      headers.append("x-open-ai-key", localStorage.getItem("openAIKey"));
      headers.append("Content-Type", "application/json");

      const selectedModel = JSON.parse(localStorage.getItem("selectedModel"));
      const queryParams = new URLSearchParams();
      queryParams.append("model", selectedModel.name);

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/summarise-text?${queryParams.toString()}`,
        {
          mode: "cors",
          method: "POST",
          body: JSON.stringify({ text: text }),
          headers,
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        setIsLoading(false);
        result(data);
      } else {
        setIsLoading(false);
        const data = JSON.parse(responseText);
        setError(data.message);
      }
    } catch (e) {
      setIsLoading(false);
      setError("Something went wrong");
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
              placeholder="Enter text snippet"
              rows="4"
              className="rounded-md border border-gray-700 bg-gray-800 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => handleOnChange(e)}
            />
            <div className="mt-4 text-center">
              <button
                type="submit"
                disabled={!text}
                className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
              >
                {!isLoading ? "Submit" : "Submitting.."}
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
