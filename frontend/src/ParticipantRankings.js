import React, { useState, useEffect } from 'react';
import { processData } from './utils/dataProcessing';
import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip
} from '@mui/material';

export default function ParticipantRankings() {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    processData((data) => {
      // Filter out absent participants
      const presentParticipants = data.filter(p => p['Attendance'] === 'Present');
      setRankings(presentParticipants);
    });
  }, []);

  return (
    <Container maxWidth="xl" sx={{ pb: 5 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0039a6', mb: 3 }}>
        Participant Rankings
      </Typography>

      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Rank</TableCell>
                <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>CNIC</TableCell>
                <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Dealership</TableCell>
                <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Score (%)</TableCell>
                <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rankings.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{row['Name']}</TableCell>
                  <TableCell>{row['CNIC'] || row['cnic']}</TableCell>
                  <TableCell>{row['Dealership Name']}</TableCell>
                  
                  {/* Shows 2 decimal places (e.g., 59.72%) */}
                  <TableCell sx={{ fontWeight: 'bold', color: '#0039a6' }}>
                    {row.calculated.overall.toFixed(2)}%
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={row.calculated.tier.label} 
                      sx={{ 
                        bgcolor: row.calculated.tier.color, 
                        color: '#333', 
                        fontWeight: 'bold',
                        minWidth: 80
                      }} 
                    />
                  </TableCell>
                </TableRow>
              ))}
              {rankings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    {/* If empty, it might mean loading or no present participants */}
                    Loading Data...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}