import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import salesFile from './data/Dealership wise sales data (2024 & 2025).csv';
import evaluationFile from './data/Evaluation Results.csv';

const KEY_ALIASES = {
  rajanur:              'rajanpur',
  airportonlysales:     'airport',
  gujranwalla:          'gujranwala',
  moderntownship:       'township',
  bahawalpurderawar:    'bahawalpur',
  bahawalnagarsahiwal:  'bahawalnagar',
  crownsmc:             'crown',
  suzkukibhakkar:       'bhakkar',
  bhakkarsuzuki:        'bhakkar',
  adilzafar:            'zafar',
  muzzafarabad:         'muzaffarabad',
  gujjarkhansuzuki:     'gujjarkhan',
  suzukigujjarkhan:     'gujjarkhan',
};

export default function DealershipSalesComparison() {
  const [salesData,  setSalesData]  = useState([]);
  const [evalData,   setEvalData]   = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Papa.parse(salesFile, {
      download: true, header: true, skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => setSalesData(res.data),
    });
    Papa.parse(evaluationFile, {
      download: true, header: true, skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => setEvalData(res.data),
    });
  }, []);

  const getMatchKey = (name) => {
    if (!name) return 'unknown';
    let s = String(name).toLowerCase();

    s = s.replace(/\babbotabad\b/g,    'abbottabad');
    s = s.replace(/\brajanur\b/g,      'rajanpur');
    s = s.replace(/\bgujranwalla\b/g,  'gujranwala');
    s = s.replace(/\bsuzkuki\b/g,      'suzuki');
    s = s.replace(/\bmuzzafarabad\b/g, 'muzaffarabad');
    s = s.replace(/\badil\s+zafar\b/g, 'zafar');
    s = s.replace(/\bi\.g\.\b/g,       'ig');

    s = s.replace(/\(.*?\)/g, '');

    const noise = [
      'suzuki', 'motors', 'motor', 'autos', 'auto',
      'pvt', 'ltd', 'company', 'co', 'branch',
      'dealership', 'agencies', 'agency', 'center', 'centre',
      'engineers', 'corporation', 'automobiles', 'modern', 'only', 'sales',
    ];
    noise.forEach((w) => {
      s = s.replace(new RegExp(`\\b${w}\\b`, 'g'), '');
    });

    const raw = s.replace(/[^a-z0-9]/g, '');
    return KEY_ALIASES[raw] ?? raw;
  };

  const mergedData = useMemo(() => {
    if (!salesData.length && !evalData.length) return [];

    const dealerMap = {};

    salesData.forEach((row) => {
      const rawName = String(row['Dealer Name (Revised)'] || '').trim();
      if (!rawName) return;

      const key    = getMatchKey(rawName);
      const year   = String(row['Year'] || '').trim();
      const qty    = parseInt(String(row['Total Sales'] || '0').replace(/,/g, ''), 10) || 0;
      const region = String(row['Region Office Name'] || '').trim();

      if (!dealerMap[key]) {
        dealerMap[key] = { id: key, displayName: rawName, region, sales2024: 0, sales2025: 0, managers: [] };
      }
      if (year === '2024') dealerMap[key].sales2024 += qty;
      if (year === '2025') dealerMap[key].sales2025 += qty;
    });

    evalData.forEach((row) => {
      const designation = String(row['Designation'] || '').toUpperCase().trim();
      if (designation !== 'SALES MANAGER') return;

      const rawDealership = String(row['Dealership'] || '').trim();
      if (!rawDealership) return;

      const key = getMatchKey(rawDealership);

      if (!dealerMap[key]) {
        dealerMap[key] = {
          id: key, displayName: rawDealership, region: '',
          sales2024: 0, sales2025: 0, managers: [],
        };
      }

      dealerMap[key].managers.push({
        name:  String(row['Full Name']  || '').trim() || 'Unknown',
        cnic:  String(row['CNIC Final'] || '').trim() || 'N/A',
        score: String(row['Total']      || '').trim() || '-',
      });
    });

    return Object.values(dealerMap)
      .filter((d) => d.sales2024 > 0 || d.sales2025 > 0 || d.managers.length > 0)
      .sort((a, b) => {
        const aTotal = a.sales2025 + a.sales2024;
        const bTotal = b.sales2025 + b.sales2024;
        if (b.sales2025 !== a.sales2025) return b.sales2025 - a.sales2025;
        return bTotal - aTotal;
      });
  }, [salesData, evalData]);

  const filteredData = useMemo(
    () => mergedData.filter((d) =>
      d.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [mergedData, searchTerm]
  );

  const BLUE = '#0039a6';
  const RED  = '#e31e24';

  const hCell = (label, w, bg = BLUE) => (
    <TableCell sx={{ bgcolor: bg, color: 'white', fontWeight: 'bold', width: w, whiteSpace: 'nowrap' }}>
      {label}
    </TableCell>
  );

  return (
    <Container maxWidth={false} sx={{ pb: 5, px: 4 }}>

      <Box sx={{ mb: 3, mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: BLUE }}>
            Dealership Sales &amp; Manager Scores
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            2024 vs 2025 total sales · Sales Manager evaluation scores
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search dealership…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ bgcolor: 'white', width: 300 }}
        />
      </Box>

      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: '72vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {hCell('#',               '4%')}
                {hCell('Dealership Name', '26%')}
                {hCell('Region',          '7%')}
                {hCell('2024 Sales',      '9%')}
                {hCell('2025 Sales',      '9%')}
                {hCell('Sales Manager',   '25%', RED)}
                {hCell('CNIC',            '12%', RED)}
                {hCell('Total Score',     '8%',  RED)}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.map((row, idx) => (
                <TableRow hover key={row.id}>

                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                    {idx + 1}
                  </TableCell>

                  <TableCell sx={{ fontWeight: 'bold', color: '#222' }}>
                    {row.displayName}
                  </TableCell>

                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {row.region || '—'}
                  </TableCell>

                  <TableCell>{row.sales2024.toLocaleString()}</TableCell>

                  <TableCell sx={{ fontWeight: 'bold', color: row.sales2025 >= row.sales2024 ? '#00796b' : '#c62828' }}>
                    {row.sales2025.toLocaleString()}
                  </TableCell>

                  <TableCell>
                    {row.managers.length > 0
                      ? row.managers.map((m, i) => (
                          <Box key={i} sx={{ mb: row.managers.length > 1 ? 0.5 : 0, fontWeight: 500 }}>
                            {m.name}
                          </Box>
                        ))
                      : <Typography variant="body2" color="textSecondary">—</Typography>}
                  </TableCell>

                  <TableCell>
                    {row.managers.length > 0
                      ? row.managers.map((m, i) => (
                          <Box key={i} sx={{ mb: row.managers.length > 1 ? 0.5 : 0, fontSize: '0.82rem' }}>
                            {m.cnic}
                          </Box>
                        ))
                      : <Typography variant="body2" color="textSecondary">—</Typography>}
                  </TableCell>

                  <TableCell>
                    {row.managers.length > 0
                      ? row.managers.map((m, i) => (
                          <Box key={i} sx={{ mb: row.managers.length > 1 ? 0.5 : 0, fontWeight: 'bold', color: '#00796b' }}>
                            {m.score}
                          </Box>
                        ))
                      : <Typography variant="body2" color="textSecondary">—</Typography>}
                  </TableCell>

                </TableRow>
              ))}

              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography color="textSecondary">
                      {salesData.length === 0 ? 'Loading data…' : 'No dealerships match your search.'}
                    </Typography>
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