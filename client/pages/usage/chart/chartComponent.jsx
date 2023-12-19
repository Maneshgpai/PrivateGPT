import React from 'react';
import { Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import styles from './chartComponent.module.css'
import { CategoryScale } from 'react-chartjs-2';
const ChartComponent = ({ data }) => {
  const labels = data.map(item => item.label);
  const values = data.map(item => item.value);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Dollar per Day',
        data: values,
        backgroundColor: ['#1cdf95'],
      },
    ],
  };

  const options = {
    responsive: true,
    tooltips: {
      enabled: false,
    }
  };

  return (
    <>
    
      <div className={`${styles.usageBox}`}>
        <div className={`${styles.hContainer}`}>
          <h1><b>Usage</b></h1>
          <h1 className='d-block'> <b>Daily Cost :</b> <i>1.12$</i> </h1>
        </div>
        <div className={`${styles.btnContainer}`}>
          <button className={`${styles.btnCost}`}>Cost</button>
          <button className={`${styles.btnActivity}`}>Activity</button>
          
        </div>
        <main className={`${styles.chart}`}>
          <Bar data={chartData} options={options} />
          
        </main>
      </div>
    </>
  )
};

export default ChartComponent;
