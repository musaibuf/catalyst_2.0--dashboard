import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import participantFile from './data/participants.csv';
import {
  Box, Container, Typography, Paper, Grid, Select, MenuItem, FormControl, InputLabel, Slider
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// --- REGISTER CHART.JS COMPONENTS ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

// --- COLORS --- 
const COLORS = ['#0039a6', '#e31e24', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];

export default function DemographicsComparison() {
  const [data, setData] = useState([]);
  
  // --- FILTERS STATE ---
  const [filters, setFilters] = useState({
    region: 'All',
    dealership: 'All',
    gender: 'All',
    education: 'All',
    // FIXED: Min Age 0 to include the participant aged 15
    ageRange: [0, 80], 
    expRange: [0, 60]   
  });

  // 1. LOAD DATA
  useEffect(() => {
    Papa.parse(participantFile, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => setData(results.data),
    });
  }, []);

  // 2. EXTRACT FILTER OPTIONS
  const regions = useMemo(() => ['All', ...new Set(data.map(d => d.region).filter(Boolean))].sort(), [data]);
  const dealerships = useMemo(() => ['All', ...new Set(data.map(d => d.dealership).filter(Boolean))].sort(), [data]);
  const degrees = useMemo(() => ['All', ...new Set(data.map(d => d.degree?.trim()).filter(Boolean))].sort(), [data]);

  // 3. PROCESS DATA FOR CHARTS
  const chartData = useMemo(() => {
    const filtered = data.filter(row => {
      const age = parseFloat(row.age) || 0;
      const exp = parseFloat(row['Years of Experience at Pak Suzuki']) || 0;
      const gender = row.gender ? row.gender.trim().toLowerCase() : '';
      const degree = row.degree ? row.degree.trim() : '';

      const regionMatch = filters.region === 'All' || row.region === filters.region;
      const dealerMatch = filters.dealership === 'All' || row.dealership === filters.dealership;
      const genderMatch = filters.gender === 'All' || gender === filters.gender.toLowerCase();
      const eduMatch = filters.education === 'All' || degree === filters.education;
      
      // Range Checks
      const ageMatch = age >= filters.ageRange[0] && age <= filters.ageRange[1];
      const expMatch = exp >= filters.expRange[0] && exp <= filters.expRange[1];

      return regionMatch && dealerMatch && genderMatch && eduMatch && ageMatch && expMatch;
    });

    // A. Education Breakdown (Donut)
    const eduCounts = {};
    filtered.forEach(d => {
      const deg = d.degree?.trim() || 'Unknown';
      eduCounts[deg] = (eduCounts[deg] || 0) + 1;
    });
    
    // B. Experience Breakdown (Horizontal Bar)
    const expBuckets = { '0-5 Years': 0, '6-10 Years': 0, '11-15 Years': 0, '16-20 Years': 0, '20+ Years': 0 };
    filtered.forEach(d => {
      const exp = parseFloat(d['Years of Experience at Pak Suzuki']);
      if (!isNaN(exp)) {
        if (exp <= 5) expBuckets['0-5 Years']++;
        else if (exp <= 10) expBuckets['6-10 Years']++;
        else if (exp <= 15) expBuckets['11-15 Years']++;
        else if (exp <= 20) expBuckets['16-20 Years']++;
        else expBuckets['20+ Years']++;
      }
    });

    // C. Participants by Region (Vertical Bar)
    const regionCounts = {};
    filtered.forEach(d => {
      const reg = d.region || 'Unknown';
      regionCounts[reg] = (regionCounts[reg] || 0) + 1;
    });
    const sortedRegions = Object.keys(regionCounts).sort();

    // D. Education Distribution by Region (Stacked Bar)
    const regionEduMap = {};
    const allDegrees = new Set();
    filtered.forEach(d => {
      const reg = d.region || 'Unknown';
      const deg = d.degree?.trim() || 'Unknown';
      allDegrees.add(deg);
      if (!regionEduMap[reg]) regionEduMap[reg] = {};
      regionEduMap[reg][deg] = (regionEduMap[reg][deg] || 0) + 1;
    });
    const degreeKeys = Array.from(allDegrees);

    // E. Age Distribution (Bar)
    const ageBuckets = { 'Under 30': 0, '30-39': 0, '40-49': 0, '50+': 0 };
    filtered.forEach(d => {
      const age = parseFloat(d.age);
      if (!isNaN(age)) {
        if (age < 30) ageBuckets['Under 30']++;
        else if (age < 40) ageBuckets['30-39']++;
        else if (age < 50) ageBuckets['40-49']++;
        else ageBuckets['50+']++;
      }
    });

    // F. Gender Distribution (Donut)
    const genderCounts = { Male: 0, Female: 0 };
    filtered.forEach(d => {
      const g = d.gender ? d.gender.toLowerCase().trim() : '';
      if (g === 'male') genderCounts.Male++;
      else if (g === 'female') genderCounts.Female++;
    });

    return {
      eduCounts,
      expBuckets,
      regionCounts,
      sortedRegions,
      regionEduMap,
      degreeKeys,
      ageBuckets,
      genderCounts,
      total: filtered.length,
    };
  }, [data, filters]);

  // --- CHART CONFIGURATIONS ---

  const educationChartData = {
    labels: Object.keys(chartData.eduCounts),
    datasets: [{
      data: Object.values(chartData.eduCounts),
      backgroundColor: COLORS,
      borderColor: '#fff',
      borderWidth: 2,
    }],
  };

  const experienceChartData = {
    labels: Object.keys(chartData.expBuckets),
    datasets: [{
      label: 'Participants',
      data: Object.values(chartData.expBuckets),
      backgroundColor: '#e31e24',
    }],
  };

  const regionChartData = {
    labels: chartData.sortedRegions,
    datasets: [{
      label: 'Participants',
      data: chartData.sortedRegions.map(r => chartData.regionCounts[r]),
      backgroundColor: '#0039a6',
    }],
  };

  const stackedChartData = {
    labels: chartData.sortedRegions,
    datasets: chartData.degreeKeys.map((degree, index) => ({
      label: degree,
      data: chartData.sortedRegions.map(region => chartData.regionEduMap[region]?.[degree] || 0),
      backgroundColor: COLORS[index % COLORS.length],
    })),
  };

  const ageChartData = {
    labels: Object.keys(chartData.ageBuckets),
    datasets: [{
      label: 'Participants',
      data: Object.values(chartData.ageBuckets),
      backgroundColor: '#4caf50',
    }],
  };

  const genderChartData = {
    labels: ['Male', 'Female'],
    datasets: [{
      data: [chartData.genderCounts.Male, chartData.genderCounts.Female],
      backgroundColor: ['#0039a6', '#e91e63'],
      borderColor: '#fff',
      borderWidth: 2,
    }],
  };

  // --- OPTIONS ---
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      datalabels: { display: false }
    },
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { position: 'bottom' },
      datalabels: {
        display: true,
        color: '#fff',
        font: { weight: 'bold', size: 14 },
        formatter: (value) => value > 0 ? value : ''
      }
    },
  };

  return (
    <Container maxWidth={false} sx={{ pb: 5, px: 4 }}>
      
      {/* 1. TITLE */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0039a6' }}>
          Catalyst 2.0 Demographics
        </Typography>
      </Box>

      {/* 2. ADVANCED FILTER STRIP */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          bgcolor: '#e3f2fd', 
          border: '1px solid #bbdefb',
          borderRadius: 2
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0039a6', mb: 2 }}>
          FILTERS:
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          {/* Row 1: Dropdowns (Wider - 2 per row) */}
          <Grid item xs={12} md={6}>
            <FormControl size="small" fullWidth sx={{ bgcolor: 'white' }}>
              <InputLabel>Region</InputLabel>
              <Select
                value={filters.region}
                label="Region"
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              >
                {regions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl size="small" fullWidth sx={{ bgcolor: 'white' }}>
              <InputLabel>Dealership</InputLabel>
              <Select
                value={filters.dealership}
                label="Dealership"
                onChange={(e) => setFilters({ ...filters, dealership: e.target.value })}
              >
                {dealerships.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Row 2: Dropdowns */}
          <Grid item xs={12} md={6}>
            <FormControl size="small" fullWidth sx={{ bgcolor: 'white' }}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={filters.gender}
                label="Gender"
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl size="small" fullWidth sx={{ bgcolor: 'white' }}>
              <InputLabel>Education</InputLabel>
              <Select
                value={filters.education}
                label="Education"
                onChange={(e) => setFilters({ ...filters, education: e.target.value })}
              >
                {degrees.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Row 3: Sliders */}
          <Grid item xs={12} md={6}>
            <Typography variant="caption" gutterBottom sx={{ fontWeight: 'bold', color: '#0039a6' }}>
              Age Range: {filters.ageRange[0]} - {filters.ageRange[1]}
            </Typography>
            <Slider
              value={filters.ageRange}
              onChange={(e, newValue) => setFilters({ ...filters, ageRange: newValue })}
              valueLabelDisplay="auto"
              min={0} // FIXED: Starts at 0 to include everyone
              max={80}
              sx={{ color: '#0039a6', mt: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" gutterBottom sx={{ fontWeight: 'bold', color: '#e31e24' }}>
              Experience (Yrs): {filters.expRange[0]} - {filters.expRange[1]}
            </Typography>
            <Slider
              value={filters.expRange}
              onChange={(e, newValue) => setFilters({ ...filters, expRange: newValue })}
              valueLabelDisplay="auto"
              min={0}
              max={60}
              sx={{ color: '#e31e24', mt: 1 }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 3. TOTAL PARTICIPANTS */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderLeft: '6px solid #0039a6', width: 'fit-content' }}>
        <Typography variant="h6" color="textSecondary">Total Participants</Typography>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#0039a6' }}>
          {chartData.total}
        </Typography>
      </Paper>

      {/* 4. GRAPHS GRID (2 Columns) */}
      <Grid container spacing={4}>
        
        {/* Row 1 */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 500 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
              Education Breakdown
            </Typography>
            <Box sx={{ height: '400px', position: 'relative' }}>
              <Doughnut data={educationChartData} options={donutOptions} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 500 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
              Years of Experience
            </Typography>
            <Box sx={{ height: '400px', position: 'relative' }}>
              <Bar 
                data={experienceChartData} 
                options={{
                  ...barOptions,
                  indexAxis: 'y',
                  plugins: { ...barOptions.plugins, legend: { display: false } },
                  scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
                }} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* Row 2 */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 500 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
              Participants by Region
            </Typography>
            <Box sx={{ height: '400px', position: 'relative' }}>
              <Bar 
                data={regionChartData} 
                options={{
                  ...barOptions,
                  plugins: { ...barOptions.plugins, legend: { display: false } },
                  scales: { x: { grid: { display: false } }, y: { grid: { display: true } } }
                }} 
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 500 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
              Education Distribution by Region
            </Typography>
            <Box sx={{ height: '400px', position: 'relative' }}>
              <Bar 
                data={stackedChartData} 
                options={{
                  ...barOptions,
                  scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true } }
                }} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* Row 3: Age & Gender */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 500 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
              Age Distribution
            </Typography>
            <Box sx={{ height: '400px', position: 'relative' }}>
              <Bar 
                data={ageChartData} 
                options={{
                  ...barOptions,
                  plugins: { ...barOptions.plugins, legend: { display: false } },
                  scales: { x: { grid: { display: false } }, y: { grid: { display: true } } }
                }} 
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 500 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
              Gender Distribution
            </Typography>
            <Box sx={{ height: '400px', position: 'relative' }}>
              <Doughnut data={genderChartData} options={donutOptions} />
            </Box>
          </Paper> 
        </Grid>

      </Grid>
    </Container>
  );
}