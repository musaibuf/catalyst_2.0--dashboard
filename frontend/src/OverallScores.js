import React, { useState, useEffect, useMemo } from 'react';
import { processData } from './utils/dataProcessing';
import {
  Box, Container, Typography, Paper, Grid, Select, MenuItem, FormControl, InputLabel, Divider, Slider
} from '@mui/material';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement, Filler, ChartDataLabels
);

const CLUSTERS = {
  cognitive: {
    label: "Cognitive Skills", color: "#0039a6",
    keys: [
      { id: 'c_problem_solving', label: 'Problem Solving' },
      { id: 'c_asking_questions', label: 'Asking the Right Questions' },
      { id: 'c_listening', label: 'Listening Skills' },
      { id: 'c_decision_making', label: 'Decision Making' },
      { id: 'c_strategic_sales', label: 'Strategic Sales' },
      { id: 'c_social_media', label: 'Social Media' }
    ]
  },
  selfLeadership: {
    label: "Self-Leadership", color: "#e31e24",
    keys: [
      { id: 'sl_leadership', label: 'Leadership & Conflict Management' },
      { id: 'sl_resilience', label: 'Resilience' },
      { id: 'sl_time_mgmt', label: 'Personal Effectiveness & Time Management' }
    ]
  },
  interpersonal: {
    label: "Interpersonal Skills", color: "#4caf50",
    keys: [
      { id: 'i_communication', label: 'Communication Skills' },
      { id: 'i_positive_env', label: 'Building a Positive Environment' },
      { id: 'i_org_skills', label: 'Organization Skills & Team Management' }
    ]
  },
  ocean: {
    label: "Big 5 Personality",
    keys: [
      { id: 'ocean_o', label: 'Openness' },
      { id: 'ocean_c', label: 'Conscientiousness' },
      { id: 'ocean_e', label: 'Extraversion' },
      { id: 'ocean_a', label: 'Agreeableness' },
      { id: 'ocean_n', label: 'Neuroticism' }
    ]
  }
};

const COLORS = ['#0039a6', '#e31e24', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];

export default function OverallScores() {
  const [rawData, setRawData] = useState([]);
  const [stats, setStats] = useState(null);
  
  // --- FILTERS STATE ---
  const [filters, setFilters] = useState({
    region: 'All',
    dealership: 'All',
    gender: 'All',
    education: 'All',
    ageRange: [0, 80],
    expRange: [0, 60]
  });

  useEffect(() => {
    processData((data) => {
      setRawData(data);
    });
  }, []);

  // --- EXTRACT FILTER OPTIONS ---
  const regions = useMemo(() => ['All', ...new Set(rawData.map(d => d['Region']).filter(Boolean))].sort(), [rawData]);
  const dealerships = useMemo(() => ['All', ...new Set(rawData.map(d => d['Dealership Name']).filter(Boolean))].sort(), [rawData]);
  const degrees = useMemo(() => ['All', ...new Set(rawData.map(d => d['Last Degree']?.trim()).filter(Boolean))].sort(), [rawData]);

  useEffect(() => {
    if (rawData.length === 0) return;

    // --- UPDATED FILTER LOGIC ---
    const filtered = rawData.filter(row => {
      // 1. EXCLUDE ABSENT PARTICIPANTS AUTOMATICALLY
      if (row['Attendance'] !== 'Present') return false;

      const age = parseFloat(row['Age']) || 0;
      const exp = parseFloat(row['years of experience at pak suzuki']) || 0;
      const gender = row['Gender'] ? row['Gender'].trim().toLowerCase() : '';
      const degree = row['Last Degree'] ? row['Last Degree'].trim() : '';

      const regionMatch = filters.region === 'All' || row['Region'] === filters.region;
      const dealerMatch = filters.dealership === 'All' || row['Dealership Name'] === filters.dealership;
      const genderMatch = filters.gender === 'All' || gender === filters.gender.toLowerCase();
      const eduMatch = filters.education === 'All' || degree === filters.education;
      const ageMatch = age >= filters.ageRange[0] && age <= filters.ageRange[1];
      const expMatch = exp >= filters.expRange[0] && exp <= filters.expRange[1];

      return regionMatch && dealerMatch && genderMatch && eduMatch && ageMatch && expMatch;
    });

    if (filtered.length === 0) {
      setStats(null);
      return;
    }

    const sums = {};
    const counts = {};
    
    // Initialize sums/counts for Competencies
    Object.values(CLUSTERS).forEach(group => {
      group.keys.forEach(k => { sums[k.id] = 0; counts[k.id] = 0; });
    });

    const demo = {
      gender: { Male: 0, Female: 0 },
      age: { 'Under 30': 0, '30-39': 0, '40-49': 0, '50+': 0 },
      education: {}
    };

    filtered.forEach(p => {
      // 1. Aggregate Competency Scores
      const scores = p.scores || {};
      Object.keys(sums).forEach(key => {
        // Skip OCEAN keys here, handle them separately
        if (!key.startsWith('ocean_') && scores[key] !== undefined) {
          sums[key] += scores[key];
          counts[key]++;
        }
      });

      // 2. Aggregate Demographics
      const g = p['Gender'] ? p['Gender'].trim().toLowerCase() : '';
      if (g === 'male') demo.gender.Male++;
      else if (g === 'female') demo.gender.Female++;

      const age = parseFloat(p['Age']);
      if (!isNaN(age)) {
        if (age < 30) demo.age['Under 30']++;
        else if (age < 40) demo.age['30-39']++;
        else if (age < 50) demo.age['40-49']++;
        else demo.age['50+']++;
      }

      const deg = p['Last Degree'] ? p['Last Degree'].trim() : 'Unknown';
      demo.education[deg] = (demo.education[deg] || 0) + 1;
    });

    const averages = {};
    
    // Calculate Competency Averages
    ['cognitive', 'selfLeadership', 'interpersonal'].forEach(clusterKey => {
      let clusterSum = 0;
      let clusterItems = 0;
      CLUSTERS[clusterKey].keys.forEach(k => {
        const avgPct = counts[k.id] > 0 ? sums[k.id] / counts[k.id] : 0;
        averages[k.id] = avgPct;
        
        if (avgPct > 0) { 
          clusterSum += avgPct; 
          clusterItems++; 
        }
      });
      averages[`${clusterKey}_overall`] = clusterItems > 0 ? clusterSum / clusterItems : 0;
    });

    // Calculate Big 5 Averages (From calculated.ocean which is 1-5 scale)
    const oceanSums = { O:0, C:0, E:0, A:0, N:0 };
    const oceanCounts = { O:0, C:0, E:0, A:0, N:0 };

    filtered.forEach(p => {
        const o = p.calculated.ocean; // { O: 3.5, C: 4.0 ... }
        Object.keys(o).forEach(key => {
            if(o[key] > 0) {
                oceanSums[key] += o[key];
                oceanCounts[key]++;
            }
        });
    });

    // Map back to ocean_o, ocean_c keys for the chart
    CLUSTERS.ocean.keys.forEach(k => {
        const keyChar = k.id.split('_')[1].toUpperCase(); // 'ocean_o' -> 'O'
        const rawAvg = oceanCounts[keyChar] > 0 ? oceanSums[keyChar] / oceanCounts[keyChar] : 0;
        averages[k.id] = rawAvg; 
    });

    averages.grand_overall = (averages.cognitive_overall + averages.selfLeadership_overall + averages.interpersonal_overall) / 3;

    setStats({ averages, demo, count: filtered.length });

  }, [rawData, filters]);

  // --- CHART DATA HELPERS ---

  const createBarChartData = (clusterKey) => {
    if (!stats) return { labels: [], datasets: [] };
    const cluster = CLUSTERS[clusterKey];
    return {
      labels: cluster.keys.map(k => k.label),
      datasets: [{
        label: 'Score %',
        data: cluster.keys.map(k => stats.averages[k.id]),
        backgroundColor: cluster.color,
        barPercentage: 0.6,
      }]
    };
  };

  const createDonutData = (dataObj, colors) => ({
    labels: Object.keys(dataObj),
    datasets: [{
      data: Object.values(dataObj),
      backgroundColor: colors || COLORS,
      borderColor: '#fff',
      borderWidth: 2,
    }]
  });

  // Big 5 Donut (Normalized for visualization)
  const createBig5Donut = () => {
    if (!stats) return { labels: [], datasets: [] };
    
    // Get raw averages (1-5 scale)
    const rawValues = CLUSTERS.ocean.keys.map(k => stats.averages[k.id]);
    
    // Normalize to percentage of total for the donut slice size
    const totalSum = rawValues.reduce((a, b) => a + b, 0);
    const normalizedData = rawValues.map(val => (totalSum > 0 ? (val / totalSum) * 100 : 0));

    return {
      labels: CLUSTERS.ocean.keys.map(k => k.label),
      datasets: [{
        data: normalizedData,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        borderColor: '#fff',
        borderWidth: 2,
      }]
    };
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#fff',
        anchor: 'end',
        align: 'start',
        formatter: (val) => Math.round(val) + '%',
        font: { weight: 'bold' }
      }
    },
    scales: {
      y: { max: 100, beginAtZero: true, grid: { color: '#f0f0f0' } },
      x: { 
        grid: { display: false },
        ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 10 } } 
      }
    }
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { position: 'bottom' },
      datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: (val) => val > 0 ? Math.round(val) + '%' : '' }
    }
  };

  if (!stats) return <Container maxWidth="xl" sx={{ mt: 4 }}><Typography>Loading data...</Typography></Container>;

  return (
    <Container maxWidth="xl" sx={{ pb: 5 }}>
      <Box sx={{ mb: 2 }}><Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0039a6' }}>Overall Scores & Demographics</Typography></Box>

      {/* --- FILTERS SECTION --- */}
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
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0039a6', mb: 2 }}>FILTERS:</Typography>
        
        <Grid container spacing={3} alignItems="center">
          {/* Row 1: Dropdowns */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={{ bgcolor: 'white', minWidth: '140px' }}>
              <InputLabel sx={{ fontSize: '1.1rem' }}>Region</InputLabel>
              <Select value={filters.region} label="Region" onChange={(e) => setFilters({...filters, region: e.target.value})} sx={{ fontSize: '1.1rem', py: 0.5 }}>
                {regions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={{ bgcolor: 'white', minWidth: '140px' }}>
              <InputLabel sx={{ fontSize: '1.1rem' }}>Dealership</InputLabel>
              <Select value={filters.dealership} label="Dealership" onChange={(e) => setFilters({...filters, dealership: e.target.value})} sx={{ fontSize: '1.1rem', py: 0.5 }}>
                {dealerships.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={{ bgcolor: 'white', minWidth: '140px' }}>
              <InputLabel sx={{ fontSize: '1.1rem' }}>Gender</InputLabel>
              <Select value={filters.gender} label="Gender" onChange={(e) => setFilters({...filters, gender: e.target.value})} sx={{ fontSize: '1.1rem', py: 0.5 }}>
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={{ bgcolor: 'white', minWidth: '140px' }}>
              <InputLabel sx={{ fontSize: '1.1rem' }}>Education</InputLabel>
              <Select value={filters.education} label="Education" onChange={(e) => setFilters({...filters, education: e.target.value})} sx={{ fontSize: '1.1rem', py: 0.5 }}>
                {degrees.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Row 2: Sliders */}
          <Grid item xs={12} md={6}>
            <Typography variant="caption" gutterBottom sx={{ fontWeight: 'bold', color: '#0039a6', fontSize: '1rem' }}>Age Range: {filters.ageRange[0]} - {filters.ageRange[1]}</Typography>
            <Slider 
              value={filters.ageRange} 
              onChange={(e, newValue) => setFilters({ ...filters, ageRange: newValue })} 
              valueLabelDisplay="auto" 
              min={0} max={80} 
              sx={{ color: '#0039a6', height: 10, '& .MuiSlider-thumb': { width: 24, height: 24 }, mt: 1 }} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" gutterBottom sx={{ fontWeight: 'bold', color: '#e31e24', fontSize: '1rem' }}>Experience (Yrs): {filters.expRange[0]} - {filters.expRange[1]}</Typography>
            <Slider 
              value={filters.expRange} 
              onChange={(e, newValue) => setFilters({ ...filters, expRange: newValue })} 
              valueLabelDisplay="auto" 
              min={0} max={60} 
              sx={{ color: '#e31e24', height: 10, '& .MuiSlider-thumb': { width: 24, height: 24 }, mt: 1 }} 
            />
          </Grid>
        </Grid>
      </Paper>

      {/* --- SUMMARY CARDS --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={2.4}>
          <Paper elevation={3} sx={{ p: 3, bgcolor: '#fff', borderLeft: '6px solid #333', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#333' }}>{stats.count}</Typography>
            <Typography variant="subtitle2" color="textSecondary">Total Participants (Present)</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Paper elevation={3} sx={{ p: 3, bgcolor: '#0039a6', color: 'white', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{stats.averages.grand_overall.toFixed(2)}%</Typography>
            <Typography variant="subtitle1">Grand Overall Score</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Paper elevation={2} sx={{ p: 3, borderTop: '4px solid #0039a6', textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0039a6' }}>{stats.averages.cognitive_overall.toFixed(2)}%</Typography>
            <Typography variant="body2" color="textSecondary">Cognitive Skills</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Paper elevation={2} sx={{ p: 3, borderTop: '4px solid #e31e24', textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#e31e24' }}>{stats.averages.selfLeadership_overall.toFixed(2)}%</Typography>
            <Typography variant="body2" color="textSecondary">Self-Leadership</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Paper elevation={2} sx={{ p: 3, borderTop: '4px solid #4caf50', textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>{stats.averages.interpersonal_overall.toFixed(2)}%</Typography>
            <Typography variant="body2" color="textSecondary">Interpersonal Skills</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* --- CLUSTER BREAKDOWN CHARTS --- */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 450 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#0039a6' }}>Cognitive Breakdown</Typography>
            <Box sx={{ height: 350 }}><Bar data={createBarChartData('cognitive')} options={commonOptions} /></Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 450 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#e31e24' }}>Self-Leadership Breakdown</Typography>
            <Box sx={{ height: 350 }}><Bar data={createBarChartData('selfLeadership')} options={commonOptions} /></Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 450 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#4caf50' }}>Interpersonal Breakdown</Typography>
            <Box sx={{ height: 350 }}><Bar data={createBarChartData('interpersonal')} options={commonOptions} /></Box>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 6 }} />

      {/* --- DEMOGRAPHICS & PERSONALITY --- */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
        Demographics & Personality Profile
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>Big 5 Personality (Avg)</Typography>
            <Box sx={{ height: 320, position: 'relative' }}>
              <Doughnut data={createBig5Donut()} options={donutOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>Gender Distribution</Typography>
            <Box sx={{ height: 320, position: 'relative' }}>
              <Doughnut data={createDonutData(stats.demo.gender, ['#0039a6', '#e91e63'])} options={donutOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>Education Breakdown</Typography>
            <Box sx={{ height: 320, position: 'relative' }}>
              <Doughnut data={createDonutData(stats.demo.education)} options={donutOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>Age Distribution</Typography>
            <Box sx={{ height: 320 }}>
              <Bar 
                data={{
                  labels: Object.keys(stats.demo.age),
                  datasets: [{
                    label: 'Participants',
                    data: Object.values(stats.demo.age),
                    backgroundColor: '#4caf50',
                  }]
                }} 
                options={{
                  ...commonOptions,
                  plugins: { legend: { display: false }, datalabels: { color: '#fff', formatter: (val) => val } },
                  scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}