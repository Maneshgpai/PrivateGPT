import { useState } from "react";
import OpenAIKeyForm from "./OpenAIKeyForm";
import FileUpload from "./FileUpload";
import TextSnippet from "./TextSnippet";

export default function Chat() {
  const [showChatBox, setShowChatBox] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileSummaries, setFileSummaries] = useState([]);
  const [textSummaries, setTextSummaries] = useState([]);
  const [activeTab, setActiveTab] = useState("file");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleOpenAIKeyResult = (result) => {
    setShowChatBox(result);
  };

  const handleFileUploadResult = (result) => {
    if (result) {
      setFileSummaries(result);
    }
  };

  const handleTextSnippetResult = (result) => {
    if (result) {
      setTextSummaries(result);
    }
  };

  return (
    <div
      className="container mx-auto bg-gray-900  flex flex-col"
      style={{ minHeight: `calc(100vh - ${3}rem)` }}
    >
      <div className="border-gray-100 dark:border-gray-600 shadow-none sticky top-0">
        <h1 className="text-center py-3 font-bold text-xl text-gray-300">
          {/* Chat with your PDF */}
        </h1>
      </div>
      {showChatBox ? (
        <>
          <div className="flex items-center justify-center mb-4">
            <div
              role="tablist"
              aria-orientation="horizontal"
              className="inline-flex h-10 items-center justify-center rounded-md bg-gray-800 p-1 text-gray-300"
              tabIndex="0"
              data-orientation="horizontal"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "file"}
                onClick={() => handleTabChange("file")}
                className={`${
                  activeTab === "file"
                    ? "bg-gray-900 text-foreground shadow-sm"
                    : ""
                } inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`}
                tabIndex="-1"
                data-orientation="horizontal"
                data-radix-collection-item=""
              >
                Upload PDF
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "text"}
                onClick={() => handleTabChange("text")}
                className={`${
                  activeTab === "text"
                    ? "bg-gray-900 text-foreground shadow-sm"
                    : ""
                } inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`}
                tabIndex="0"
                data-orientation="horizontal"
                data-radix-collection-item=""
              >
                Paste Snippet
              </button>
            </div>
          </div>

          {activeTab === "file" ? (
            <FileUpload result={handleFileUploadResult} />
          ) : (
            <TextSnippet result={handleTextSnippetResult} />
          )}
          {activeTab === "file" &&
            fileSummaries.map((summary, index) => (
              <div
                className="mt-4 flex w-full flex-col items-center"
                key={index}
              >
                <div className="w-4/5">
                  <div className="w-full py-2 flex flex-row justify-between text-sm relative cursor-pointer rounded-md font-bold text-gray-300 hover:text-gray-300">
                    <div className="flex flex-row">
                      <span className="ml-1">
                        {summary.filename ? summary.filename : ""}
                      </span>
                    </div>
                  </div>

                  <div className="w-full rounded-md border border-gray-700 bg-gray-800 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <span>{summary.summary}</span>
                  </div>
                </div>
              </div>
            ))}
          {activeTab === "text" &&
            textSummaries.map((summary, index) => (
              <div
                className="mt-4 flex w-full flex-col items-center"
                key={index}
              >
                <div className="w-4/5">
                  <div className="w-full py-2 flex flex-row justify-between text-sm relative cursor-pointer rounded-md font-bold text-gray-300 hover:text-gray-300">
                    <div className="flex flex-row">
                      <span className="ml-1">
                        {summary.filename ? summary.filename : ""}
                      </span>
                    </div>
                  </div>

                  <div className="w-full rounded-md border border-gray-700 bg-gray-800 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <span>{summary.summary}</span>
                  </div>
                </div>
              </div>
            ))}
        </>
      ) : (
        <OpenAIKeyForm result={handleOpenAIKeyResult} />
      )}
    </div>
  );
}
