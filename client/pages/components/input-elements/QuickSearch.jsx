import { useState } from "react";
import React from "react";
import { useUser } from "@clerk/nextjs";
import { TextareaAutosize as BaseTextareaAutosize } from '@mui/base/TextareaAutosize';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import Tooltip from '@mui/material/Tooltip';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import ReplayIcon from '@mui/icons-material/Replay';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import Box from '@mui/material/Box';
import AddToDriveOutlinedIcon from '@mui/icons-material/AddToDriveOutlined';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import ContentPasteSearchRoundedIcon from '@mui/icons-material/ContentPasteSearchRounded';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded';


function QuickSearch({ result, Olddata, streamResponse, setStreamResponse, clearAllContent, completeText, setCompleteText, setCompleteStream, completeStream }) {
    const [text, setText] = useState(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { user } = useUser();
    const [files, setFiles] = useState([]);
    const [value, setValue] = React.useState(2);
    const [activeTab1, setActiveTab1] = useState("qiksearch");
  
    const Item = styled(Paper)(({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
        ...theme.typography.body2,
        padding: theme.spacing(1),
        textAlign: 'center',
        color: theme.palette.text.secondary,
      }));
      
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

    const handleTextSubmit = async (e) => {
        setError(false);
        event.preventDefault();
        if (!text) {
            return null;
        }
        setIsLoading(true);
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
                body: JSON.stringify({ text: text })
            });

            if (response.status === 200) {
                const reader = response.body.getReader();
                setStreamResponse("")
                const processStream = async () => {
                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
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

    const handleFileSubmit = async (e) => {
        setError(false);
        event.preventDefault();
        if (!text) {
            return null;
        }
        setIsLoading(true);
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
                body: JSON.stringify({ text: text })
            });

            if (response.status === 200) {
                const reader = response.body.getReader();
                setStreamResponse("")
                const processStream = async () => {
                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
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
        <div className="container mx-auto  flex flex-col"
            // style={{ minHeight: `calc(100vh - ${3}rem)`, backgroundColor: "#ebeef4", color: "#000" }}
            >

            <>

                <div className="flex w-full flex-col mt-10 items-center">
                    <div className="w-3/5">
                        <div className="mx-auto">

                            <Box sx={{ flexGrow: 1 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={8}>
                                        <Item>
                                            {/* TEXT AREA */}
                                            <form onSubmit={handleTextSubmit}
                                                className="flex flex-col justify-center align-middle">
                                                <div className="text-sm text-gray-500 py-2" >
                                                    You can type or paste the content here
                                                </div>
                                                <BaseTextareaAutosize
                                                    id="text-snippet"
                                                    name="text-snippet"
                                                    type="input"
                                                    minRows={3}
                                                    // placeholder="Paste text from medical note to generate ICD10, CPT and HCPCS codes"
                                                    rows="30"
                                                    value={text}
                                                    className="rounded-md border border-gray-700 text-black-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-grey-500"
                                                    onChange={(e) => handleOnChange(e)}
                                                />
                                            </form>
                                        </Item>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Item>
                                            <form onSubmit={handleFileSubmit}
                                                className="flex flex-col justify-center align-middle items-center w-full">
                                                <div className="text-sm text-gray-500 py-2" >
                                                    or upload a PDF
                                                </div>
                                                <div className="flex mt-4">
                                                <Button component="label" size="large" variant="text" disableElevation startIcon={<UploadFileIcon />}
                                                    onChange={(e) => handleOnChange(e)}><VisuallyHiddenInput type="file" multiple accept="application/pdf" />
                                                </Button>
                                                <Button component="label" size="large" disabled variant="text" disableElevation startIcon={<AddToDriveOutlinedIcon />}
                                                    onChange={(e) => handleOnChange(e)}><VisuallyHiddenInput type="file" multiple accept="application/pdf" />
                                                </Button>
                                                </div>
                                                <div className="text-sm text-gray-500 py-2" >
                                                </div>
                                            </form>
                                        </Item>
                                    </Grid>
                                </Grid>
                            </Box>



                            {/* UPLOAD AREA */}
                            {/* <form
                                onSubmit={handleSubmit}
                                className="mt-3 flex flex-col justify-center align-middle items-center w-full">
                                <Button component="label" variant="contained" disableElevation startIcon={<CloudUploadIcon />}
                                    onChange={(e) => handleOnChange(e)}>Browse files<VisuallyHiddenInput type="file" multiple accept="application/pdf" />
                                </Button>
                                <Tooltip title="Upload file">
                                    <LoadingButton
                                        loading={isLoading}
                                        variant="contained"
                                        disableElevation
                                        onClick={files ? (e) => { handleSubmit(e); } : () => setError("Please upload a file")}
                                        className="mt-6  bg-white inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 mt-2"
                                    ><FileUploadOutlinedIcon /></LoadingButton></Tooltip>
                                <div className="text-sm text-gray-500 py-2" >
                                    Upload PDFs only, file-fiesta!
                                </div>
                            </form> */}

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
            </>
        </div>
    );

}

export default QuickSearch;
