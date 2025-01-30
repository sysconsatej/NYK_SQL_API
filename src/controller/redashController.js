const { default: axios } = require('axios');

const options = {
  sortX: true,
  xAxis: {
    type: "-",
    labels: {
      enabled: true,
    },
  },
  yAxis: [
    { type: "linear" },
    { type: "linear", opposite: true },
  ],
  legend: {
    enabled: true,
    placement: "auto",
    traceorder: "normal",
  },
  series: [
    {
      data: [],
      name: "Data",
      dataLabels: {
        enabled: true,
      },
      showInLegend: true,
    },
  ],
  error_y: {
    type: "data",
    visible: true,
  },
  piesort: true,
  sizemode: "diameter",
  direction: {
    type: "counterclockwise",
  },
  enableLink: false,
  linkFormat: "",
  textFormat: "",
  coefficient: 1,
  swappedAxes: false,
  color_scheme: "Redash",
  numberFormat: "0,0[.]00000",
  columnMapping: {
    _id: "x",
    createdBy: "y",
  },
  percentFormat: "0[.]00%",
  seriesOptions: {},
  valuesOptions: {},
  dateTimeFormat: "DD/MM/YY HH:mm",
  linkOpenNewTab: true,
  showDataLabels: true,
  alignYAxesAtZero: false,
  globalSeriesType: "pie",
  missingValuesAsZero: true,
};



const sunBurstOptions = {
  chart: {
    type: 'sunburst',
  },
  title: {
    text: 'Sunburst Chart Example',
  },
  series: [
    {
      name: 'Data',
      data: [], // Add your data here
      dataLabels: {
        format: '{point.name}: {point.value}',
        enabled: true,
      },
      showInLegend: true,
    },
  ],
  tooltip: {
    pointFormat: '<b>{point.name}</b>: {point.value}',
  },
  plotOptions: {
    sunburst: {
      dataLabels: {
        format: '{point.name} ({point.value})',
      },
      allowDrillToNode: true,
      cursor: 'pointer',
    },
  },
  colors: [
    '#FF5733',
    '#33FF57',
    '#3357FF',
    '#FF33A1',
    '#FFD133',
    '#33FFD1',
  ],
};

async function generateRedashChart(req , res) {
    return '';
    // try  {

    //     const dyanmicQuery =  JSON.stringify({
    //         collection : 'tblUser',
    //         query : {
    //             status :  1
    //         }
    //     }) // will come from req.body


    //     const redashConfigs  =  {
    //         apiKey : 'Pj4mF0cqG7I2JX9msDPQSvhNvHc5FmkyXopmUkZ7',
    //         dyanmicQueryName : `query${Math.floor(Math.random() *10)}`,
    //         currentDateAndTime :  () => new Date().toISOString(),
    //     }

    //     const url =  `http://localhost:5001/api/queries?api_key=${redashConfigs.apiKey}`

    //     const data =  {
    //         query: dyanmicQuery,
    //         data_source_id:  1,
    //         name: redashConfigs.dyanmicQueryName,
    //         is_draft: false,
    //         user: {
    //           active_at : redashConfigs.currentDateAndTime,
    //         },
    //         last_modified_by_id: 1,
    //     }

    //     const generateQuery = await  axios.post(url, data)
    //     let link = '';
    //     const queryId =  generateQuery.data?.id

    //     const visualizationData = {
    //         name: 'My Chart',
    //         type: 'CHART', // Specify the type of chart
    //         options: sunBurstOptions,
    //         // options: {
    //         //   // Chart options go here
    //         //   xAxis: {
    //         //     type: 'linear',
    //         //     labels: { enabled: true },
    //         //   },
    //         //   yAxis: [{ type: 'linear' }],
    //         //   series: {
    //         //     error_y: { type: 'data', visible: true },
    //         //   },
    //         //   // Add other options as needed
    //         // },
    //         query_id: queryId,
    //       };

    //       const visualizationResponse = await axios.post(`http://localhost:5001/api/visualizations`, visualizationData, {
    //         headers: {
    //           Authorization: redashConfigs.apiKey,
    //         },
    //       });
          
    //       const chartId =  visualizationResponse?.data?.id;
    //       if(visualizationResponse.status === 200) {
    //         link = `http://localhost:5001/embed/query/${queryId}/visualization/${chartId}`
    //       }

    //       return res.json({ message: { status: 200, link }})

    // } catch (error) {
    //     return  res.json({ message :  error });
    // }
}

module.exports = { generateRedashChart };