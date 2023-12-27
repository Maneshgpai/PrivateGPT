import React from 'react';
import ChartComponent from './chart/chartComponent.jsx';

import { SignedIn, SignedOut } from "@clerk/nextjs";
import Layout from "../components/Layout";
import Hero from "../components/Hero";

const usage = () => {

  const data = [
    { label: 'Monday', value: 20 },
    { label: 'Tuesday', value: 35 },
    { label: 'wednesday', value: 15 },
    { label: 'Thursday', value: 20},
    { label: 'friday', value: 22},
    { label: 'Saturday', value: 25},
    { label: 'Sunday', value: 17}
  ];

  return (

    <>
      <SignedIn>
        <Layout>
          <ChartComponent data={data} />
        </Layout>
      </SignedIn>
      <SignedOut>
        <div>
          <Hero />
        </div>
      </SignedOut>
    </>
  );
};

export default usage;
