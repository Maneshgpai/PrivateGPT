import React from 'react';

const TableComponent = ({ completeStream }) => {
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
    <div className="w-full rounded-md border border-gray-700 bg-gray-800 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
      <table className="w-full border-collapse border border-gray-500">
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
    </div>
  );
};

export default TableComponent;
