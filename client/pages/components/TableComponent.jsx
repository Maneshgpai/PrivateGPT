import React from 'react';

const TableComponent = ({ completeStream }) => {
  // Safely parse the JSON
  const safeParseJson = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return null;
    }
  };

  const data = safeParseJson(completeStream);

  // Check if data is not null and is an array
  if (!data || !Array.isArray(data)) {
    return <div>Invalid data format</div>;
  }

  return (
    <div className="w-full rounded-md border border-gray-700 bg-gray-800 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
      <table className="w-full">
        {data.map((item, index) => (
          <tbody key={index}>
            {Object.entries(item).map(([key, value]) => (
              <tr key={key}>
                <td>{key.charAt(0).toUpperCase() + key.slice(1)}:</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
};

export default TableComponent;
