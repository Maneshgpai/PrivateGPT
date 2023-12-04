import { useEffect, useState } from "react";
import FileUpload from "./input-elements/FileUpload";
import TextSnippet from "./input-elements/TextSnippet";
import * as XLSX from 'xlsx';
import TableComponent from "./TableComponent";
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export default function Chat({ pdfView = false }) {
  const [showChatBox, setShowChatBox] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileSummaries, setFileSummaries] = useState([]);
  const [textSummaries, setTextSummaries] = useState([]);
  const [activeTab, setActiveTab] = useState(pdfView ? "file" : "text");
  const [streamResponse, setStreamResponse] = useState("");
  const [completeText, setCompleteText] = useState(false);
  const [completeStream, setCompleteStream] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
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

  useEffect(() => {
    if (completeText) {
      setCompleteStream(streamResponse.replace(/\\n/g, '\n'))
    }
  }, [completeText]);


  const exportStreamToExcel = (streamData) => {
    const jsonData = JSON.parse(streamData.replace(/\\n/g, "").replace(/\\/g, ""));
    const ws = XLSX.utils.json_to_sheet(jsonData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, 'streamData.xlsx');
  };




  const clearAllContent = () => {
    setFileSummaries([]);
    setTextSummaries([]);
    setStreamResponse("");
  };

  return (
    <div
      className="container mx-auto  flex flex-col"
      style={{ minHeight: `calc(100vh - ${3}rem)`,
        backgroundColor: "#ebeef4",
        color: "#000"
      
      
      }}
    >
      <div className="border-gray-100  shadow-none sticky top-0" style={{
              backgroundColor: "#ebeef4",
              color: "#000"
            
            
            }}>
        <h1 className="text-center py-3 font-bold text-xl text-gray-300">
          {/* Chat with your PDF */}
        </h1>
      </div>
      {/* {showChatBox ? ( */}
      <>
        <div className="flex items-center justify-center mb-4">
          <div
            role="tablist"
            aria-orientation="horizontal"
            className="inline-flex h-10 items-center justify-center rounded-md p-1 text-gray-300"
            tabIndex="0"
            data-orientation="horizontal"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "text"}
              onClick={() => handleTabChange("text")}
              className={`${activeTab === "text"
                  ? " text-foreground shadow-sm"
                  : ""
                } inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`}
              tabIndex="0"
              data-orientation="horizontal"
              data-radix-collection-item=""
              
            >
              {
                pdfView ? "Upload PDF" : "Paste your note!"
              }
            </button>
            {/* <button
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
                Upload File
              </button> */}
          </div>
        </div>

        {activeTab === "file" ? (
          <FileUpload result={handleFileUploadResult} Olddata={textSummaries} streamResponse={streamResponse} setStreamResponse={setStreamResponse} clearAllContent={clearAllContent}
          completeText={completeText}
          setCompleteText={setCompleteText}
          setCompleteStream={setCompleteStream}
          completeStream={completeStream}
          
          />
        ) : (
          <TextSnippet result={handleTextSnippetResult} Olddata={textSummaries} streamResponse={streamResponse} setStreamResponse={setStreamResponse} clearAllContent={clearAllContent}
            completeText={completeText}
            setCompleteText={setCompleteText}
            setCompleteStream={setCompleteStream}
            completeStream={completeStream}
          />
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

                <div className="w-full rounded-md border border-gray-700 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{
                  backgroundColor: "#2E85FF",
                  color: "#000"
                
                
                }}>
                <button
                    className="w-full rounded-md border border-gray-600 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex justify-center"
                    onClick={toggleDropdown}
                    style={{
                      backgroundColor: "#2E85FF",
                      color: "#000"
                    
                    
                    }}
                  >
                    {
                      isOpen ? "Hide" : "Show" 
                    } raw data
                    {
                      isOpen ? 
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
</svg>
:
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>

                    }
                  </button>
                  {isOpen && (

                    <div className="w-full  text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{
                      backgroundColor: "#2E85FF",
                      color: "#000"
                    
                    

                    }}>
                    <span>{summary?.summary || streamResponse}</span>
                  </div>
                  )}
                </div>
                {completeStream && <TableComponent completeStream={completeStream} />}
                
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

                <div className="w-full rounded-md border border-gray-800 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{
                  backgroundColor: "#2E85FF",
                  color: "#000"
                
                
                }}>
                  <button
                    className="w-full rounded-md border border-gray-600 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex justify-center"
                    onClick={toggleDropdown}
                    style={{
                      backgroundColor: "#2E85FF",
                      color: "#000"
                    
                    
                    }}
                  >
                    {
                      isOpen ? "Hide" : "Show" 
                    } raw data
                    {
                      isOpen ? 
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
</svg>
:
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>

                    }
                  </button>
                  {isOpen && (
                    <div className="w-full  text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{
                      backgroundColor: "#2E85FF",
                      color: "#000"
                    
                    

                    }}>
                    <span>{summary?.summary || streamResponse}</span>
                  </div>
                  )}
                </div>
                {completeStream && <TableComponent completeStream={completeStream} />}
              </div>
              <button
                type="button"
                onClick={() => exportStreamToExcel(summary?.summary || streamResponse)}
                className="bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-5 mb-5 m-5"
                style={{
                  backgroundColor: "#2E85FF",
  color: "#000"


}}
              >
                <FileDownloadIcon/>
                Download codes
              </button>
            </div>
          ))}

      </>
    </div>
  );
}
