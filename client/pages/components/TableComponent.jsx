import React from 'react';

const TableComponent = ({ completeStream }) => {
  // Assuming completeStream is parsed JSON

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
            <tr>
              <td>Name:</td>
              <td>{item.Name}</td>
            </tr>
            <tr>
              <td>Excerpt:</td>
              <td>{item.Excerpt}</td>
            </tr>
            <tr>
              <td>Code:</td>
              <td>{item.Code}</td>
            </tr>
            <tr>
              <td>Description:</td>
              <td>{item.Description}</td>
            </tr>
            <tr>
              <td>Citation:</td>
              <td><a href={item.Citation} target="_blank" rel="noopener noreferrer">{item.Citation}</a></td>
            </tr>
          </tbody>
        ))}
      </table>
    </div>
  );
};

export default TableComponent;
