import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import participantFile from './data/participants.csv';
import {
  Box, Container, Typography, Paper, TextField, Button, 
  Autocomplete, Snackbar, Alert, AppBar, Toolbar,
  Accordion, AccordionSummary, AccordionDetails, Chip, Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// REPLACE THIS WITH YOUR RENDER BACKEND URL AFTER DEPLOYMENT
const API_BASE_URL = "https://catalyst-backend-ggzy.onrender.com"; 

// --- SCALES ---
const SCALE_1_4 = {
  1: 'Underdeveloped',
  2: 'Developing',
  3: 'Competent',
  4: 'Highly Effective'
};

const SCALE_1_5 = {
  1: 'Strongly Disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly Agree'
};

// --- ASSESSMENT STRUCTURE ---
const ASSESSMENT_ACTIVITIES = [
  {
    id: 'sjt',
    title: '1. Situational Judgement Test',
    type: 'standard', 
    clusters: [
      {
        name: 'Cognitive Skills (C)',
        competencies: [
          { id: 'sjt_c_problem_solving', name: 'Problem Solving' },
          { id: 'sjt_c_asking_questions', name: 'Asking the Right Questions' },
          { id: 'sjt_c_listening', name: 'Listening Skills' },
          { id: 'sjt_c_decision_making', name: 'Decision-Making Skills' },
          { id: 'sjt_c_strategic_sales', name: 'Strategic Sales & Marketing Approach' },
          { id: 'sjt_c_social_media', name: 'Social Media' }
        ]
      },
      {
        name: 'Self-Leadership (SL)',
        competencies: [
          { id: 'sjt_sl_leadership', name: 'Leadership & Conflict Management' },
          { id: 'sjt_sl_resilience', name: 'Resilience' },
          { id: 'sjt_sl_time_mgmt', name: 'Personal Effectiveness & Time Management' }
        ]
      },
      {
        name: 'Interpersonal Skills (I)',
        competencies: [
          { id: 'sjt_i_communication', name: 'Communication Skills' },
          { id: 'sjt_i_positive_env', name: 'Building a Positive Environment' },
          { id: 'sjt_i_org_skills', name: 'Organization Skills & Team Management' }
        ]
      }
    ]
  },
  {
    id: 'roleplay',
    title: '2. Roleplay',
    type: 'standard', 
    clusters: [
      {
        name: 'Cognitive Skills (C)',
        competencies: [
          { id: 'rp_c_problem_solving', name: 'Problem Solving' },
          { id: 'rp_c_asking_questions', name: 'Asking the Right Questions' },
          { id: 'rp_c_listening', name: 'Listening Skills' },
          { id: 'rp_c_decision_making', name: 'Decision-Making Skills' },
          { id: 'rp_c_strategic_sales', name: 'Strategic Sales & Marketing Approach' },
          { id: 'rp_c_social_media', name: 'Social Media' }
        ]
      },
      {
        name: 'Interpersonal Skills (I)',
        competencies: [
          { id: 'rp_i_communication', name: 'Communication Skills' },
          { id: 'rp_i_positive_env', name: 'Building a Positive Environment' },
          { id: 'rp_i_org_skills', name: 'Organization Skills & Team Management' }
        ]
      }
    ]
  },
  {
    id: 'simulation',
    title: '3. Simulation Operation Transformation',
    type: 'standard', 
    clusters: [
      {
        name: 'Cognitive Skills (C)',
        competencies: [
          { id: 'sim_c_problem_solving', name: 'Problem Solving' },
          { id: 'sim_c_asking_questions', name: 'Asking the Right Questions' },
          { id: 'sim_c_listening', name: 'Listening Skills' },
          { id: 'sim_c_decision_making', name: 'Decision-Making Skills' },
          { id: 'sim_c_strategic_sales', name: 'Strategic Sales & Marketing Approach' },
          { id: 'sim_c_social_media', name: 'Social Media' }
        ]
      },
      {
        name: 'Self-Leadership (SL)',
        competencies: [
          { id: 'sim_sl_leadership', name: 'Leadership & Conflict Management' },
          { id: 'sim_sl_resilience', name: 'Resilience' },
          { id: 'sim_sl_time_mgmt', name: 'Personal Effectiveness & Time Management' }
        ]
      },
      {
        name: 'Interpersonal Skills (I)',
        competencies: [
          { id: 'sim_i_communication', name: 'Communication Skills' },
          { id: 'sim_i_positive_env', name: 'Building a Positive Environment' },
          { id: 'sim_i_org_skills', name: 'Organization Skills & Team Management' }
        ]
      }
    ]
  },
  {
    id: 'ocean',
    title: '4. OCEAN (Big Five)',
    type: 'big5', 
    clusters: [
      {
        name: 'Personality Traits',
        competencies: [
          { id: 'ocean_o', name: 'O – Openness (Creativity & Curiosity)' },
          { id: 'ocean_c', name: 'C – Conscientiousness (Organization & Reliability)' },
          { id: 'ocean_e', name: 'E – Extraversion (Sociability & Energy)' },
          { id: 'ocean_a', name: 'A – Agreeableness (Cooperation & Empathy)' },
          { id: 'ocean_n', name: 'N – Neuroticism (Emotional Stability)' }
        ]
      }
    ]
  }
];

export default function AssessorForm() {
  const [allParticipants, setAllParticipants] = useState([]);
  const [selectedForSession, setSelectedForSession] = useState([]); 
  const [searchVal, setSearchVal] = useState(null);
  const [batchScores, setBatchScores] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    Papa.parse(participantFile, {
      download: true, header: true, skipEmptyLines: true,
      complete: (results) => {
        const formatted = results.data.map(p => ({ ...p, label: `${p.name} (${p.cnic})` }));
        setAllParticipants(formatted);
      }
    });
  }, []);

  const handleAddParticipant = (participant) => {
    if (!participant) return;
    if (selectedForSession.find(p => p.cnic === participant.cnic)) {
      alert("Participant already added to this session.");
      return;
    }
    setSelectedForSession([...selectedForSession, participant]);
    setSearchVal(null); 
  };

  const handleRemoveParticipant = (cnic) => {
    setSelectedForSession(selectedForSession.filter(p => p.cnic !== cnic));
    const newScores = { ...batchScores };
    delete newScores[cnic];
    setBatchScores(newScores);
  };

  const handleScoreChange = (cnic, compId, value) => {
    setBatchScores(prev => ({
      ...prev,
      [cnic]: {
        ...(prev[cnic] || {}),
        [compId]: parseInt(value)
      }
    }));
  };

  const getTotalQuestions = () => {
    let count = 0;
    ASSESSMENT_ACTIVITIES.forEach(act => {
      act.clusters.forEach(cluster => {
        count += cluster.competencies.length;
      });
    });
    return count;
  };

  const handleSubmitAll = async () => {
    if (selectedForSession.length === 0) {
      alert("No participants selected.");
      return;
    }

    const totalQuestions = getTotalQuestions();
    const incomplete = selectedForSession.filter(p => {
      const pScores = batchScores[p.cnic] || {};
      return Object.keys(pScores).length < totalQuestions;
    });

    if (incomplete.length > 0) {
      alert(`Please complete all sections for: ${incomplete.map(p => p.name).join(', ')}`);
      return;
    }

    // Determine URL (Localhost vs Production)
    const submitUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000/api/submit-assessment' 
      : `${API_BASE_URL}/api/submit-assessment`;

    try {
      const promises = selectedForSession.map(p => {
        return fetch(submitUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cnic: p.cnic,
            scores: batchScores[p.cnic],
            assessorName: "Assessor" 
          })
        });
      });

      await Promise.all(promises);

      console.log("Batch Submitted Successfully");
      setOpenSnackbar(true);
      setSelectedForSession([]);
      setBatchScores({});
      window.scrollTo(0, 0);

    } catch (error) {
      console.error("Error submitting:", error);
      alert("Failed to submit. Please check your internet connection.");
    }
  };

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', pb: 10 }}>
      <AppBar position="static" sx={{ bgcolor: 'white', borderBottom: '3px solid #e31e24' }}>
        <Toolbar>
          <img src="/pak-suzuki-logo.png" alt="Suzuki" style={{ height: 40, marginRight: 15 }} />
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
            ASSESSOR PORTAL
          </Typography>
          <img src="/logo.png" alt="Carnelian" style={{ height: 40 }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Step 1: Add Participants to Session
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Autocomplete
              options={allParticipants}
              getOptionLabel={(option) => option.label || ""}
              value={searchVal}
              onChange={(event, newValue) => setSearchVal(newValue)}
              sx={{ flexGrow: 1 }}
              renderInput={(params) => <TextField {...params} label="Search by Name or CNIC" variant="outlined" />}
            />
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => handleAddParticipant(searchVal)}
              disabled={!searchVal}
            >
              Add
            </Button>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedForSession.map(p => (
              <Chip 
                key={p.cnic} 
                label={p.name} 
                onDelete={() => handleRemoveParticipant(p.cnic)} 
                color="primary" 
                variant="outlined" 
              />
            ))}
          </Box>
        </Paper>

        {selectedForSession.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 4 }}>
              Step 2: Evaluate Participants
            </Typography>
            
            {selectedForSession.map((participant, index) => (
              <Accordion key={participant.cnic} defaultExpanded={index === 0} sx={{ mb: 2, borderRadius: '8px !important', '&:before': {display: 'none'} }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#e3f2fd', borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0039a6', flexGrow: 1 }}>
                      {participant.name}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={`${Object.keys(batchScores[participant.cnic] || {}).length} / ${getTotalQuestions()} Scored`} 
                      color={Object.keys(batchScores[participant.cnic] || {}).length === getTotalQuestions() ? "success" : "warning"}
                    />
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                  {ASSESSMENT_ACTIVITIES.map((activity) => (
                    <Accordion key={activity.id} sx={{ mb: 1, boxShadow: 1, '&:before': {display: 'none'} }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#fff', borderLeft: '4px solid #e31e24' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333' }}>
                          {activity.title}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 3 }}>
                        {activity.clusters.map((cluster, cIndex) => (
                          <Box key={cIndex} sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0039a6', mb: 2, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #eee', pb: 1 }}>
                              {cluster.name}
                            </Typography>
                            {cluster.competencies.map((comp) => {
                              const currentScore = (batchScores[participant.cnic] && batchScores[participant.cnic][comp.id]);
                              const scaleToUse = activity.type === 'big5' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
                              const labelsToUse = activity.type === 'big5' ? SCALE_1_5 : SCALE_1_4;

                              return (
                                <Box key={comp.id} sx={{ mb: 3, p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eee' }}>
                                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
                                    {comp.name}
                                  </Typography>
                                  <Grid container spacing={2} justifyContent="center">
                                    {scaleToUse.map((val) => {
                                      const isSelected = currentScore === val;
                                      return (
                                        <Grid item xs={12} sm={6} md={activity.type === 'big5' ? 2.4 : 3} key={val}>
                                          <Box
                                            onClick={() => handleScoreChange(participant.cnic, comp.id, val)}
                                            sx={{
                                              border: isSelected ? '2px solid #0039a6' : '1px solid #e0e0e0',
                                              bgcolor: isSelected ? '#e3f2fd' : 'white',
                                              borderRadius: 2,
                                              p: 1.5,
                                              minHeight: '70px',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              transition: 'all 0.2s ease',
                                              boxShadow: isSelected ? '0 2px 8px rgba(0,57,166,0.15)' : 'none',
                                              '&:hover': { borderColor: '#0039a6', bgcolor: isSelected ? '#e3f2fd' : '#f5f5f5' }
                                            }}
                                          >
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: isSelected ? '#0039a6' : '#666', mr: 1 }}>
                                                {val}
                                              </Typography>
                                              {isSelected && <CheckCircleIcon sx={{ color: '#0039a6', fontSize: 18 }} />}
                                            </Box>
                                            <Typography variant="caption" align="center" sx={{ lineHeight: 1.1, color: isSelected ? '#0039a6' : '#555' }}>
                                              {labelsToUse[val]}
                                            </Typography>
                                          </Box>
                                        </Grid>
                                      );
                                    })}
                                  </Grid>
                                </Box>
                              );
                            })}
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
            <Box sx={{ textAlign: 'center', mt: 5, mb: 10 }}>
              <Button 
                variant="contained" 
                color="secondary" 
                size="large" 
                onClick={handleSubmitAll}
                sx={{ px: 6, py: 2, fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 50, boxShadow: 3 }}
              >
                Submit All Evaluations
              </Button>
            </Box>
          </>
        )}
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
          <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>
            Batch evaluation submitted successfully!
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}