import * as React from 'react';
import Box from '@mui/system/Box';
import Grid from '@mui/system/Unstable_Grid';
import styled from '@mui/system/styled';
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Layout from "../components/Layout";
import Hero from "../components/Hero";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const Item = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  border: '1px solid',
  borderColor: theme.palette.mode === 'dark' ? '#444d58' : '#ced7e0',
  padding: theme.spacing(1),
  borderRadius: '4px',
  textAlign: 'center',
}));

const logosPath= [
    "AdvancedMD",
    "AllScripts",
    "AthenaHealth",
    "Cerner",
    "eCW",
    "EPIC",
    "MDLand",
    "NexTech",
    "OpenEMR"
]

export default function ResponsiveGrid() {
  return (
    <>
      <SignedIn>
        <div >
          <Layout>
          <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 16 }} style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        width: "100%",
        height: "100%",
        padding: "0px",
        margin: "0px",
        overflow: "hidden",
        position: "relative",
        top: "0px",
        left: "0px",
        zIndex: "0",
        backgroundColor: "#fff",
        borderRadius: "4px",
        boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)",
        border: "1px solid #ccc",
        
      }}>
        {Array.from(Array(16)).map((_, index) => (
          <Grid xs={2} sm={4} key={index}>
            <Item>
                {
                    logosPath[index] ? (
                        <Card sx={{ maxWidth: 345 }}>
                            <CardContent>
                            <img src={`/EMR_logos/${logosPath[index]}.png`} alt={logosPath[index]}
                            style={{
                                width: "auto",
                                
                            }}
                            />
                            </CardContent>
                        
                        </Card>
                    ):(
                        <div style={{
                            minHeight: "100px",
                        }}>

                        </div>
                    )
                }
            </Item>
          </Grid>
        ))}
      </Grid>
    </Box>

          </Layout>
        </div>
      </SignedIn>
      <SignedOut>
        <div>
          <Hero />
        </div>
      </SignedOut>
    </>
  );
}