import React, { useState, useEffect } from 'react';
import { processData } from './utils/dataProcessing';
import {
  Box, Container, Typography, Paper, Grid, Select, MenuItem, FormControl, InputLabel,
  Chip, Divider, Card, CardContent
} from '@mui/material';
import {
  Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register ChartJS components
ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartDataLabels);

// --- CONFIGURATION ---
const CLUSTER_KEYS = {
  cognitive: [
    { id: 'c_problem_solving', label: 'Problem Solving' },
    { id: 'c_asking_questions', label: 'Asking the Right Questions' },
    { id: 'c_listening', label: 'Listening Skills' },
    { id: 'c_decision_making', label: 'Decision Making' },
    { id: 'c_strategic_sales', label: 'Strategic Sales' },
    { id: 'c_social_media', label: 'Social Media' }
  ],
  selfLeadership: [
    { id: 'sl_leadership', label: 'Leadership & Conflict' },
    { id: 'sl_resilience', label: 'Resilience' },
    { id: 'sl_time_mgmt', label: 'Time Management' }
  ],
  interpersonal: [
    { id: 'i_communication', label: 'Communication' },
    { id: 'i_positive_env', label: 'Positive Environment' },
    { id: 'i_org_skills', label: 'Org Skills' }
  ]
};

const BIG5_COLORS = {
  O: '#FF6384', // Pink
  C: '#36A2EB', // Blue
  E: '#FFCE56', // Yellow
  A: '#4BC0C0', // Teal
  N: '#9966FF'  // Purple
};

const BIG5_NAMES = {
  O: 'Openness',
  C: 'Conscientiousness',
  E: 'Extraversion',
  A: 'Agreeableness',
  N: 'Neuroticism'
};

export default function ParticipantBreakdown() {
  const [participants, setParticipants] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [currentData, setCurrentData] = useState(null);

  // Load Data on Mount
  useEffect(() => {
    processData((data) => {
      // 1. Filter: Only show Present participants
      // 2. Sort: Alphabetical order by Name
      const presentParticipants = data
        .filter(p => p['Attendance'] === 'Present')
        .sort((a, b) => a['Name'].localeCompare(b['Name']));
      
      setParticipants(presentParticipants);
      
      if (presentParticipants.length > 0) {
        // Default to the first participant (now alphabetically first)
        const first = presentParticipants[0];
        // Use CNIC or cnic depending on what's available in the row
        const id = first['CNIC'] || first['cnic'];
        setSelectedId(id);
        setCurrentData(first);
      } else {
        setCurrentData(null);
      }
    });
  }, []);

  // Handle Dropdown Change
  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    const found = participants.find(p => (p['CNIC'] || p['cnic']) === id);
    setCurrentData(found);
  };

  if (!currentData) return (
    <Container sx={{ mt: 10, textAlign: 'center' }}>
      <Typography variant="h5" color="textSecondary">
        {participants.length === 0 ? "No present participants found." : "Loading Participant Data..."}
      </Typography>
    </Container>
  );

  // --- CHART CONFIGURATIONS ---
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold' },
        formatter: (val) => val.toFixed(0) + '%',
        anchor: 'center',
        align: 'center'
      }
    },
    scales: {
      x: { max: 100, beginAtZero: true, grid: { color: '#f0f0f0' } },
      y: { grid: { display: false } }
    }
  };

  // 1. Cluster Summary Chart
  const clusterData = {
    labels: ['Cognitive', 'Self-Leadership', 'Interpersonal'],
    datasets: [{
      label: 'Score %',
      data: [
        currentData.calculated.cognitive, 
        currentData.calculated.selfLeadership, 
        currentData.calculated.interpersonal
      ],
      backgroundColor: ['#0039a6', '#e31e24', '#4caf50'],
      barPercentage: 0.6
    }]
  };

  // 2. Big 5 Chart
  // Map explicitly to ensure order matches colors
  const big5Keys = ['O', 'C', 'E', 'A', 'N'];
  const big5Data = {
    labels: big5Keys.map(k => BIG5_NAMES[k]),
    datasets: [{
      data: big5Keys.map(k => currentData.calculated.ocean[k]),
      backgroundColor: big5Keys.map(k => BIG5_COLORS[k]),
      borderWidth: 1
    }]
  };

  // 3. Helper for Breakdown Charts
  const createBreakdownData = (clusterType, color) => {
    const keys = CLUSTER_KEYS[clusterType];
    return {
      labels: keys.map(k => k.label),
      datasets: [{
        data: keys.map(k => currentData.scores[k.id] || 0),
        backgroundColor: color,
        barPercentage: 0.7
      }]
    };
  };

  return (
    <Container maxWidth="xl" sx={{ pb: 5 }}>
      
      {/* HEADER & SELECTOR */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0039a6' }}>
          Participant Breakdown
        </Typography>
        <FormControl size="small" sx={{ minWidth: 300, bgcolor: 'white' }}>
          <InputLabel>Select Participant</InputLabel>
          <Select value={selectedId} label="Select Participant" onChange={handleSelect}>
            {participants.map((p, idx) => {
               const id = p['CNIC'] || p['cnic'];
               return <MenuItem key={idx} value={id}>{p['Name']} ({id})</MenuItem>
            })}
          </Select>
        </FormControl>
      </Box>

      {/* PARTICIPANT INFO CARD */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderLeft: `6px solid ${currentData.calculated.tier.color}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{currentData['Name']}</Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {currentData['Dealership Name']} | {currentData['Region']}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={`Age: ${currentData['Age']}`} variant="outlined" />
              <Chip label={`Exp: ${currentData['years of experience at pak suzuki']} Yrs`} variant="outlined" />
              <Chip label={`Gender: ${currentData['Gender']}`} variant="outlined" sx={{ textTransform: 'capitalize' }} />
              <Chip 
                label={currentData['Attendance']} 
                color="success" 
                variant="filled" 
                size="small"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#0039a6' }}>
              {currentData.calculated.overall.toFixed(2)}%
            </Typography>
            <Chip 
              label={currentData.calculated.tier.label} 
              sx={{ 
                bgcolor: currentData.calculated.tier.color, 
                fontWeight: 'bold', 
                fontSize: '1.2rem', 
                px: 2, py: 2.5, mt: 1 
              }} 
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        {/* LEFT COLUMN: Charts */}
        <Grid item xs={12} md={7}>
          
          {/* Cluster Summary */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, height: 350 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Competency Clusters</Typography>
            <Box sx={{ height: 280 }}>
              <Bar 
                data={clusterData} 
                options={{
                  ...commonOptions,
                  indexAxis: 'x', 
                  scales: { y: { max: 100, beginAtZero: true }, x: { grid: { display: false } } }
                }} 
              />
            </Box>
          </Paper>

          {/* Detailed Breakdowns */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0039a6', mb: 1 }}>Cognitive Skills Breakdown</Typography>
            <Box sx={{ height: 300 }}>
              <Bar data={createBreakdownData('cognitive', '#0039a6')} options={commonOptions} />
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#e31e24', mb: 1 }}>Self-Leadership Breakdown</Typography>
            <Box sx={{ height: 200 }}>
              <Bar data={createBreakdownData('selfLeadership', '#e31e24')} options={commonOptions} />
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#4caf50', mb: 1 }}>Interpersonal Breakdown</Typography>
            <Box sx={{ height: 200 }}>
              <Bar data={createBreakdownData('interpersonal', '#4caf50')} options={commonOptions} />
            </Box>
          </Paper>

          {/* Big 5 Chart */}
          <Paper elevation={3} sx={{ p: 3, mt: 4, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Big 5 Personality (OCEAN)</Typography>
            <Box sx={{ height: 320, position: 'relative' }}>
              <Doughnut 
                data={big5Data} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  cutout: '60%',
                  plugins: {
                    legend: { position: 'bottom' },
                    datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: (val) => val }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: Feedback */}
        <Grid item xs={12} md={5}>
          
          {/* 1. Competency Feedback (Way Moving Forward) */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#fff3e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LightbulbIcon sx={{ color: '#f57c00', mr: 1, fontSize: 30 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#e65100' }}>
                Way Moving Forward
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ maxHeight: 800, overflow: 'auto', pr: 1 }}>
              {currentData.calculated.feedback.map((item, idx) => (
                <Box key={idx} sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 2, borderLeft: `5px solid ${item.cluster === 'cognitive' ? '#0039a6' : item.cluster === 'selfLeadership' ? '#e31e24' : '#4caf50'}`, boxShadow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333' }}>{item.competency}</Typography>
                    <Chip label={`Score: ${item.score}/4`} size="small" sx={{ fontWeight: 'bold', bgcolor: '#eee' }} />
                  </Box>
                  <Typography variant="body1" sx={{ color: '#e65100', fontWeight: 'bold', mb: 1 }}>{item.details.title}</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} /><Typography variant="caption" color="textSecondary">Duration: {item.details.duration}</Typography></Box></Grid>
                    <Grid item xs={6}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><SchoolIcon sx={{ fontSize: 16, color: 'text.secondary' }} /><Typography variant="caption" color="textSecondary">Method: {item.details.method}</Typography></Box></Grid>
                    <Grid item xs={12}><Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', color: '#555' }}><strong>Focus Areas:</strong> {item.details.areas}</Typography></Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* 2. Big 5 Feedback (Personality Profile) */}
          <Paper elevation={3} sx={{ p: 3, bgcolor: '#f3e5f5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PsychologyIcon sx={{ color: '#9c27b0', mr: 1, fontSize: 30 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                Personality Profile
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ maxHeight: 800, overflow: 'auto', pr: 1 }}>
              {big5Keys.map((trait) => {
                const fb = currentData.calculated.big5Feedback[trait];
                if (!fb) return null;
                return (
                  <Card key={trait} sx={{ mb: 2, borderLeft: `5px solid ${BIG5_COLORS[trait]}` }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: BIG5_COLORS[trait] }}>
                          {BIG5_NAMES[trait]}
                        </Typography>
                        <Chip label={`${fb.score}/5`} size="small" sx={{ bgcolor: BIG5_COLORS[trait], color: 'white', fontWeight: 'bold' }} />
                      </Box>
                      
                      <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>
                        Band: {fb.band}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Interpretation:</strong> {fb.interpretation}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1, color: '#444' }}>
                        <strong>Context:</strong> {fb.context}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 1, color: 'green' }}>
                        <strong>Strength:</strong> {fb.strength}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 1, color: '#e65100' }}>
                        <strong>Coach Point:</strong> {fb.coachPoint}
                      </Typography>

                      <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', color: '#666', borderTop: '1px dashed #ccc', pt: 1 }}>
                        Readiness: {fb.readinessFactor}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Paper>

        </Grid>
      </Grid>
    </Container>
  );
}