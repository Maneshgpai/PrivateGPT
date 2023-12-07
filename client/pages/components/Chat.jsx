import * as React from 'react';
import { useEffect, useState } from "react";
import FileUpload from "./input-elements/FileUpload";
import TextSnippet from "./input-elements/TextSnippet";
import * as XLSX from 'xlsx';
import Box from '@mui/material/Box';
import TableComponent from "./TableComponent";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Tooltip from '@mui/material/Tooltip';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import ContentPasteSearchRoundedIcon from '@mui/icons-material/ContentPasteSearchRounded';
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import SkeletonTable from './SkeletonTable';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export default function Chat() {
  const [fileSummaries, setFileSummaries] = useState([]);
  const [textSummaries, setTextSummaries] = useState([]);
  const [activeTab, setActiveTab] = useState("text");
  const [streamResponse, setStreamResponse] = useState("");
  const [completeText, setCompleteText] = useState(false);
  const [completeStream, setCompleteStream] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [pdfView, setPdfView] = useState(false)
  const [value, setValue] = React.useState(0);

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
      setIsOpen(false)
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
    <div className="container mx-auto  flex flex-col"
      style={{ minHeight: `calc(100vh - ${3}rem)`, backgroundColor: "#ebeef4", color: "#000" }}>

      <div className="border-gray-100  shadow-none sticky top-0" style={{ backgroundColor: "#ebeef4", color: "#000" }}>
        <h1 className="text-center py-3 font-bold text-xl text-gray-600">
          Generate medical codes in a snap!
        </h1>
      </div>
      <>
        <div div className='flex justify-center align-middle'>
          <Box sx={{ width: 500 }}>
            <BottomNavigation
              showLabels
              value={value}
              onChange={(event, newValue) => {
                setValue(newValue);
              }
              }
            >
              <Tooltip title="Paste medical content"><BottomNavigationAction
                aria-selected={activeTab === "text"}
                label="Quick search"
                icon={<ContentPasteSearchRoundedIcon />}
                onClick={() => {
                  handleTabChange("text")
                  setPdfView(false)
                }} /></Tooltip>

              <Tooltip title="Upload medical note as PDF"><BottomNavigationAction
                aria-selected={activeTab === "file"}
                onClick={() => {
                  handleTabChange("file")
                  setPdfView(true)
                }}
                label="Upload notes"
                icon={<UploadFileIcon />} /></Tooltip>

              <Tooltip title="Connect to your favourite EHR or EMR"><BottomNavigationAction label="Connect EMR" icon={<LocalHospitalRoundedIcon />} /></Tooltip>
            </BottomNavigation>
          </Box>
        </div>

        {activeTab === "file" ? (
          <FileUpload result={handleFileUploadResult} Olddata={textSummaries} streamResponse={streamResponse} setStreamResponse={setStreamResponse} clearAllContent={clearAllContent}
            completeText={completeText}
            setCompleteText={setCompleteText}
            setCompleteStream={setCompleteStream}
            completeStream={completeStream} />
        ) : (
          <TextSnippet result={handleTextSnippetResult} Olddata={textSummaries} streamResponse={streamResponse} setStreamResponse={setStreamResponse} clearAllContent={clearAllContent}
            completeText={completeText}
            setCompleteText={setCompleteText}
            setCompleteStream={setCompleteStream}
            completeStream={completeStream}
          />
        )}
        {/*===================== START : FILE UPLOAD SECTION =====================*/}
        {activeTab === "file" &&
          fileSummaries.map((summary, index) => (
            <div
              className="mt-4 flex w-full flex-col items-center"
              key={index}>
              <div className="w-4/5">
                <div className="w-full py-2 flex flex-row justify-between text-sm relative cursor-pointer rounded-md font-bold text-gray-300 hover:text-gray-300">
                  <div className="flex flex-row">
                    <span className="ml-1">
                      {summary.filename ? summary.filename : ""}
                    </span>
                  </div>

                  {/* ACCORDION FOR FILE UPLOAD */}
                  <div className="text-sm text-gray-500 py-5" >
                    <Accordion>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header">
                        <Typography><span className="text-sm text-gray-600 py-5" >Data is loading! Click to see progress. A tidy table will appear soon for download...</span></Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography><span className="text-sm text-gray-600 py-5" >{summary?.summary || streamResponse}</span></Typography>
                      </AccordionDetails>
                    </Accordion>
                  </div>
                </div>

                {/* TABLE COMPONENT FOR FILE UPLOAD */}
                {/* {completeStream && <TableComponent completeStream={completeStream} />} */}
                {completeStream ? (<TableComponent completeStream={completeStream} />) : (
                  <div className="items-center">
                  <Stack spacing={1}>
                  <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                  <SkeletonTable />
                  <div className="mt-4 flex align-center justify-center"><Skeleton variant="rounded" width={120} height={30} /></div>
                  </Stack>
                  </div>
                )}

              </div>

              <div className="mt-4 flex w-full flex-col items-center">
                <span>
                  {completeStream && <Tooltip title="Download codes in a neat excel file!">
                    <Button component="label" variant="contained" disableElevation startIcon={<FileDownloadIcon />}
                      onClick={() => exportStreamToExcel(summary?.summary || streamResponse)}>Download</Button>
                  </Tooltip>}
                </span>
              </div>

            </div>
          ))}
        {/*========================================== START : TEXT PASTE SECTION ==========================================*/}
        {activeTab === "text" &&
          textSummaries.map((summary, index) => (
            <div
              className="mt-4 flex w-full flex-col items-center"
              key={index}>
              <div className="w-4/5">
                <div className="w-full py-2 flex flex-row justify-between text-sm relative cursor-pointer rounded-md font-bold text-gray-300 hover:text-gray-300">
                  <div className="flex flex-row">
                    <span className="ml-1">
                      {summary.filename ? summary.filename : ""}
                    </span>
                  </div>
                </div>

                {/* ACCORDION FOR TEXT PASTE */}
                <div className="text-sm text-gray-500 py-5" >
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel1a-content"
                      id="panel1a-header">
                      <Typography><span className="text-sm text-gray-600 py-5" >Data is loading! Click to see progress. A tidy table will appear soon for download...</span></Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography><span className="text-sm text-gray-600 py-5" >{summary?.summary || streamResponse}</span></Typography>
                    </AccordionDetails>
                  </Accordion>
                </div>

                {/* TABLE COMPONENT FOR TEXT PASTE */}
                {/* {completeStream && <TableComponent completeStream={completeStream} />} */}
                {completeStream ? (<TableComponent completeStream={completeStream} />) : (
                  <div className="items-center">
                  <Stack spacing={1}>
                  <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                  <SkeletonTable />
                  <div className="mt-4 flex align-center justify-center"><Skeleton variant="rounded" width={120} height={30} /></div>
                  </Stack>
                  </div>
                )}

              </div>

              {/* DOWNLOAD BUTTON FOR TEXT PASTE */}
              <div className="mt-4 flex w-full flex-col items-center">
                <span>
                  {completeStream && <Tooltip title="Download codes in a neat excel file!">
                    <Button component="label" variant="contained" disableElevation startIcon={<FileDownloadIcon />}
                      onClick={() => exportStreamToExcel(summary?.summary || completeStream)}>Download</Button>
                  </Tooltip>}
                </span>
              </div>
            </div>
          ))}
      </>
    </div>
  );
}
