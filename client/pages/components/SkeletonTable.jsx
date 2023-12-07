import React from 'react';
import { Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const SkeletonTable = () => {
  const columns = [
    { id: 'col1', label: 'Diagnosis/Procedure', width: '100px' },
    { id: 'col2', label: 'Excerpt' },
    { id: 'col3', label: 'Code' },
    { id: 'col4', label: 'Description' },
    { id: 'col5', label: 'Wider Column', width: '500px' },
  ];

  const rows = 3;

  return (
    <TableContainer component={Paper}>
      <Table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                style={{ borderBottom: '2px solid #ddd', borderRight: '1px solid #ddd', padding: '10px', width: column.width }}
              >
                <Skeleton animation="wave" />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {[...Array(rows)].map((_, rowIndex) => (
            <TableRow key={rowIndex} style={{ borderBottom: '2px solid #ddd' }}>
              {columns.map((column, colIndex) => (
                <TableCell
                  key={column.id}
                  style={{ borderBottom: '1px solid #ddd', borderRight: '1px solid #ddd', padding: '10px' }}
                >
                  <Skeleton animation="wave" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SkeletonTable;
