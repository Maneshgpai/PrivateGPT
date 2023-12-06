import React from 'react';

const TableComponent = ({ completeStream }) => {
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ]
  const safeParseJson = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return null;
    }
  };

  const data = safeParseJson(completeStream);

  if (!data || !Array.isArray(data)) {
    return <div>Invalid data format</div>;
  }

  // Extract all unique keys from the data array
  const allKeys = [...new Set(data.flatMap(Object.keys))];

  return (
    <div className="w-full rounded-md border border-gray-700 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    style={{
      backgroundColor: "#ebeef4",
      color: "#000"
    
    
    }}>
     {
     width > 768 ?
     <table className="w-full border-collapse border border-gray-500 tableClass" style={{
                      backgroundColor: "#2E85FF",
                      color: "#000"
    
    
    }}>
        <thead>
          <tr>
            {allKeys.map(key => (
              <th key={key} className="border border-gray-500 p-2">{key.charAt(0).toUpperCase() + key.slice(1)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {allKeys.map(key => (
                <td key={key} className="border border-gray-500 p-2">{item[key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      :
      <div className="w-full flex flex-col items-center justify-center">
        <div className="w-full rounded-md border  text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
      <table className="w-full" style={{
                      backgroundColor: "#2E85FF",
                      color: "#000"
    
    
    }}>
        {data.map((item, index) => (
          <tbody key={index}>
            {Object.entries(item).map(([key, value]) => (
              <tr key={key}>
                <td className="border border-gray-500 p-2">{key.charAt(0).toUpperCase() + key.slice(1)}:</td>
                <td className="border border-gray-500 p-2">{value}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
      </div>}
    </div>
  );
};

export default TableComponent;

// This is the CSS media query to switch between the two renderings

