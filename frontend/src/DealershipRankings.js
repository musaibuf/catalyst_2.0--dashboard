import React, { useState, useEffect } from 'react';
import { processData, getTier } from './utils/dataProcessing';
import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip
} from '@mui/material';

export default function DealershipRankings() {
  const [dealerships, setDealerships] = useState([]);

  useEffect(() => {
    processData((data) => {
      // 1. FIRST: Filter out Absent participants completely.
      // This ensures they are NOT included in the count or the average.
      const presentParticipants = data.filter(p => p['Attendance'] === 'Present');

      // 2. Group by Dealership
      const grouped = {};
      
      presentParticipants.forEach(p => {
        const dealer = p['Dealership Name'];
        
        // Skip if dealership name is missing/undefined
        if (!dealer) return;

        if (!grouped[dealer]) {
          grouped[dealer] = { 
            name: dealer, 
            city: p['Region'], 
            totalScore: 0, 
            count: 0 
          };
        }

        // Add score of this PRESENT person
        grouped[dealer].totalScore += p.calculated.overall;
        // Increment count of PRESENT people
        grouped[dealer].count += 1;
      });

      // 3. Calculate Averages
      const dealerArray = Object.values(grouped).map(d => {
        // This divides Total Score by ONLY the count of Present people
        const avg = d.totalScore / d.count;
        
        return {
          ...d,
          average: avg,
          tier: getTier(avg) 
        };
      });

      // 4. Sort Descending (Highest Average First)
      dealerArray.sort((a, b) => b.average - a.average);
      setDealerships(dealerArray);
    });
  }, []);

  return (
    <Container maxWidth="xl" sx={{ pb: 5 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0039a6', mb: 3 }}>
        Dealership Rankings
      </Typography>

      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Rank</TableCell>
                <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Dealership Name</TableCell>
                <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>City</TableCell>
                <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Participants (Present)</TableCell>
                <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Avg Score (%)</TableCell>
                <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dealerships.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{row.name}</TableCell>
                  <TableCell>{row.city}</TableCell>
                  <TableCell>{row.count}</TableCell>
                  
                  {/* Shows 2 decimal places */}
                  <TableCell sx={{ fontWeight: 'bold', color: '#0039a6' }}>
                    {row.average.toFixed(2)}%
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={row.tier.label} 
                      sx={{ 
                        bgcolor: row.tier.color, 
                        color: '#333', 
                        fontWeight: 'bold',
                        minWidth: 80
                      }} 
                    />
                  </TableCell>
                </TableRow>
              ))}
              {dealerships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
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