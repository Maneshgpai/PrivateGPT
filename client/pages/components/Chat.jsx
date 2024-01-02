import * as React from 'react';
import { useEffect, useState } from "react";
import FileUpload from "./input-elements/FileUpload";
import TextSnippet from "./input-elements/TextSnippet";
import QuickSearch from "./input-elements/QuickSearch";
import QuickSearchText from "./input-elements/QuickSearchText";
import QuickSearchFile from "./input-elements/QuickSearchFile";
// import NewIntegration from "../integrations";
import * as XLSX from 'xlsx';
import Box from '@mui/material/Box';
import TableComponent from "./TableComponent";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
// import Tooltip from '@mui/material/Tooltip';
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
import Modal from './paymentModel';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe('pk_test_51OOr9eSIBy1LWCne9SUX35MhWIZ64m2jFPi0hV66xYOZvY2YuVW8bbcdXtK0eqVNNJ95zCYTRwnJnMK6nrQfImzH00Q2KA2DId');


export default function Chat() {
  const [fileSummaries, setFileSummaries] = useState([]);
  const [textSummaries, setTextSummaries] = useState([]);
  const [activeTab, setActiveTab] = useState("text");
  const [streamResponse, setStreamResponse] = useState("");
  const [fileStreamResponse, setFileStreamResponse] = useState("");
  const [textStreamResponse] = useState("");/////////
  const [completeText, setCompleteText] = useState(false);
  const [completeFile, setCompleteFile] = useState(false);
  const [completeStream, setCompleteStream] = useState(false);
  const [completeFileStream, setCompleteFileStream] = useState(false);
  const [textCompleteStream] = useState(false);/////////
  const [isOpen, setIsOpen] = useState(true);
  const [pdfView, setPdfView] = useState(false)
  const [value, setValue] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const [userData, setUserData] = useState();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const checkUserStatus =async ()=>{
    console.log("userStatus", user.id)
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/check-user-status`, { id: user.id });
      if (response.data.status === 'signup') {
        setOpen(true);
      } else {
        setOpen(false);
      }

      const userResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/get-user-data`,{ id: user.id } )
      if (userResponse.status === 200){
        setUserData(userResponse?.data)
      }
      else{
        setUserData(null)
      }
    } catch (error) {
      console.error(error);
    }  }

  useEffect(()=>{
    checkUserStatus()
  }, [])

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
      // setCompleteStream(textStreamResponse.replace(/\\n/g, '\n'))///////////
      setCompleteStream(streamResponse.replace(/\\n/g, '\n'))
      setIsOpen(false)
    }
  }, [completeText]);
  useEffect(() => {
    if (completeFile) {
      // setCompleteStream(textStreamResponse.replace(/\\n/g, '\n'))///////////
      setCompleteFileStream(fileStreamResponse.replace(/\\n/g, '\n'))
      setIsOpen(false)
    }
  }, [completeFile]);


  const exportStreamToExcel = (streamData) => {
    const jsonData = JSON.parse(streamData.replace(/\\n/g, "").replace(/\\/g, ""));
    // console.log(jsonData)
    const data = []
    jsonData.forEach((item) => {

      let fileName = item.filename
      delete item.fileName
      // console.log("filename:",fileName)

      data.push({
        // fileName,  //item.fileName
        ...item,
      })
    })
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, 'response.xlsx');
  };

  const clearAllContent = () => {
    setTextSummaries([]);
    setStreamResponse("");
  };
  const clearAllFileContent = () => {
    setFileSummaries([]);
  };

  return (
    <div className="container mx-auto  flex flex-col"
      style={{ minHeight: `calc(100vh - ${3}rem)`, backgroundColor: "#ebeef4", color: "#000" }}>
        <Elements stripe={stripePromise}>

        <Modal isOpen={open} setOpen={setOpen} userData={userData} />
        </Elements>

      <div className="border-gray-100  shadow-none sticky top-0" style={{ backgroundColor: "#ebeef4", color: "#000" }}>
      <h1 className="text-center py-3 font-bold lg:text-xl md:text-lg sm:text-lg text-gray-600">
                  Generate medical codes in a snap!
        </h1>
      </div>
      <>
        <div className='flex justify-center align-middle'>
        <Box sx={{ width: 500, }}>
            <BottomNavigation
              showLabels
              value={value}
              onChange={(event, newValue) => {
                setValue(newValue);
              }
              }
            >
              {/* <Tooltip title="Paste medical content"> */}
              <BottomNavigationAction
                sm={{width: '5px'}}
                aria-selected={activeTab === "text"}
                label="Paste text"
                icon={<ContentPasteSearchRoundedIcon />}
                onClick={() => {
                  handleTabChange("text")
                  setPdfView(false)
                }} />
              {/* </Tooltip> */}

              {/* <Tooltip title="Upload medical note as PDF"> */}
              <BottomNavigationAction
                sm={{width: '5px'}}
                aria-selected={activeTab === "file"}
                onClick={() => {
                  handleTabChange("file")
                  setPdfView(true)
                }}
                label="Upload notes"
                icon={<UploadFileIcon />} />
              {/* </Tooltip> */}

              {/* <Tooltip title="Quick Search medical codes"> */}
              <BottomNavigationAction
                sm={{width: '5px'}}
                aria-selected={activeTab === "qiksearch"}
                label="Quick search"
                icon={<ContentPasteSearchRoundedIcon sm={{width: '5px'}}/>}
                disabled
                onClick={() => {
                  handleTabChange("qiksearch")
                  // setPdfView(false)
                }} />
              {/* </Tooltip> */}

              {/* <Tooltip title="Connect to your favourite EHR or EMR"> */}
              <BottomNavigationAction
                aria-selected={activeTab === "newemr"}
                disabled
                onClick={() => {
                  handleTabChange("newemr")
                  setPdfView(true)
                }}
                label="Connect EMR" icon={<LocalHospitalRoundedIcon />} />
              {/* </Tooltip> */}
            </BottomNavigation>
          </Box>
        </div>

        {activeTab === "file" && (
          <FileUpload result={handleFileUploadResult} Olddata={fileSummaries} streamResponse={fileStreamResponse} setStreamResponse={setFileStreamResponse} clearAllContent={clearAllFileContent}
            completeText={completeFile}
            setCompleteText={setCompleteFile}
            setCompleteStream={setCompleteFileStream}
            completeStream={completeFileStream} />
        )}

        {activeTab === "text" && (
          <TextSnippet
            result={handleTextSnippetResult}
            Olddata={textSummaries}
            streamResponse={streamResponse} //{textStreamResponse}//////////
            setStreamResponse={setStreamResponse}
            clearAllContent={clearAllContent}
            completeText={completeText}
            setCompleteText={setCompleteText}
            setCompleteStream={setCompleteStream}
            completeStream={completeStream} //textCompleteStream}//////////
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
                        {completeFileStream ? (<Typography><span className="text-sm text-gray-600 py-5" >Response generated.</span></Typography>) : (<Typography><span className="text-sm text-gray-600 py-5" >Response is generating! Click to view progress.</span></Typography>)}
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography><span className="text-sm text-gray-600 py-5" >{summary?.summary || fileStreamResponse}</span></Typography>
                      </AccordionDetails>
                    </Accordion>
                  </div>
                </div>

                {/* TABLE COMPONENT FOR FILE UPLOAD */}
                {/* {completeStream && <TableComponent completeStream={completeStream} />} */}
                {completeFileStream ? (<TableComponent completeStream={completeFileStream} />) : (
                  <div className="items-center">
                    <Stack spacing={1}>
                      <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                      <SkeletonTable />
                      <div className="mt-4 flex align-center justify-center"><Skeleton variant="rounded" width={120} height={30} /></div>
                    </Stack>
                  </div>
                )}

              </div>
              {/* DOWNLOAD COMPONENT FOR FILE UPLOAD */}
              <div className="mt-4 flex w-full flex-col items-center">
                <span>
                  {completeFileStream &&
                    <Button component="label" variant="contained" disableElevation startIcon={<FileDownloadIcon />}
                      onClick={() => exportStreamToExcel(summary?.summary || fileStreamResponse)}>Download</Button>
                  }
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
                      {completeStream ? (<Typography><span className="text-sm text-gray-600 py-5" >Response generated.</span></Typography>) : (<Typography><span className="text-sm text-gray-600 py-5" >Response is generating! Click to view progress.</span></Typography>)}
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography><span className="text-sm text-gray-600 py-5" >{summary?.summary || streamResponse //textStreamResponse//////////
                      }</span></Typography>
                    </AccordionDetails>
                  </Accordion>
                </div>

                {/* TABLE COMPONENT FOR TEXT PASTE */}
                {/* {completeStream && <TableComponent completeStream={completeStream} />} */}
                {completeStream ? (<TableComponent completeStream={completeStream //textCompleteStream///////////
                } />) : (
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
                  {completeStream &&
                    // <Tooltip title="Download codes in a neat excel file!">
                    <Button component="label" variant="contained" disableElevation startIcon={<FileDownloadIcon />}
                      onClick={() => exportStreamToExcel(summary?.summary || completeStream //textCompleteStream/////////
                      )}>Download</Button>
                    // </Tooltip>
                  }
                </span>
              </div>
            </div>
          ))}
      </>
    </div>
  );
}
