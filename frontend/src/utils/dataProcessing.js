import Papa from 'papaparse';
import participantFile from '../data/participants.csv';

// --- CONFIGURATION ---
const API_URL = "https://catalyst-backend-ggzy.onrender.com"; 

const TIERS = {
  DIAMOND: { label: 'Diamond', color: '#b9f2ff', min: 81 },
  GOLD: { label: 'Gold', color: '#ffd700', min: 66 },
  SILVER: { label: 'Silver', color: '#c0c0c0', min: 51 },
  BRONZE: { label: 'Bronze', color: '#cd7f32', min: 0 }
};

const COMPETENCIES = [
  // Cognitive
  { id: 'c_problem_solving', label: 'Problem Solving', cluster: 'cognitive' },
  { id: 'c_asking_questions', label: 'Asking the Right Questions', cluster: 'cognitive' },
  { id: 'c_listening', label: 'Listening Skills', cluster: 'cognitive' },
  { id: 'c_decision_making', label: 'Decision Making', cluster: 'cognitive' },
  { id: 'c_strategic_sales', label: 'Strategic Sales', cluster: 'cognitive' },
  { id: 'c_social_media', label: 'Social Media', cluster: 'cognitive' },
  // Self-Leadership
  { id: 'sl_leadership', label: 'Leadership & Conflict Management', cluster: 'selfLeadership' },
  { id: 'sl_resilience', label: 'Resilience', cluster: 'selfLeadership' },
  { id: 'sl_time_mgmt', label: 'Personal Effectiveness & Time Management', cluster: 'selfLeadership' },
  // Interpersonal
  { id: 'i_communication', label: 'Communication Skills', cluster: 'interpersonal' },
  { id: 'i_positive_env', label: 'Building a Positive Environment', cluster: 'interpersonal' },
  { id: 'i_org_skills', label: 'Organization Skills & Team Management', cluster: 'interpersonal' }
];

// --- COMPETENCY FEEDBACK DATABASE ---
const FEEDBACK_DB = {
  c_problem_solving: {
    ex_low: { title: "Foundations of Logic", duration: "2 Days", areas: "Defining Problems, Fact vs Opinion", method: "Drills", rationale: "Struggles to identify core issues." },
    low: { title: "Root Cause Analysis", duration: "1 Day", areas: "5 Whys, Fishbone Diagram", method: "Case Studies", rationale: "Treats symptoms rather than causes." },
    med: { title: "Creative Problem Solving", duration: "2 Days", areas: "Ideation, Lateral Thinking", method: "Workshop", rationale: "Solves standard problems but lacks innovation." },
    high: { title: "Strategic Problem Solving", duration: "1 Day", areas: "Systemic Risk, Long-term Impact", method: "Simulation", rationale: "Needs to focus on systemic prevention." },
    ex_high: { title: "Crisis Management Lab", duration: "2 Days", areas: "Chaos Theory, Rapid Response", method: "Real-world Sim", rationale: "Mastery level; ready for high-stakes scenarios." }
  },
  c_asking_questions: {
    ex_low: { title: "Power of Asking", duration: "1 Day", areas: "Open vs Closed Questions", method: "Roleplay", rationale: "Rarely asks questions; needs inquiry habit." },
    low: { title: "Needs Assessment", duration: "1 Day", areas: "Probing, Fact-Finding", method: "Sales Scenarios", rationale: "Misses key details; needs probing skills." },
    med: { title: "Consultative Questioning (SPIN)", duration: "2 Days", areas: "Situation, Problem, Implication", method: "Advanced Roleplay", rationale: "Needs to guide customer thinking via questions." },
    high: { title: "The Socratic Method", duration: "Ongoing", areas: "Critical Thinking, Influence", method: "Coaching", rationale: "Ready to influence outcomes via inquiry." },
    ex_high: { title: "Strategic Discovery", duration: "1 Day", areas: "Uncovering Latent Needs", method: "Mentoring", rationale: "Exceptional; should mentor others." }
  },
  c_listening: {
    ex_low: { title: "Attention & Focus", duration: "1 Day", areas: "Removing Distractions, Eye Contact", method: "Video Analysis", rationale: "Frequently interrupts; needs focus." },
    low: { title: "Active Listening Basics", duration: "1 Day", areas: "Paraphrasing, Summarizing", method: "Group Work", rationale: "Misses details; needs retention techniques." },
    med: { title: "Empathetic Listening", duration: "2 Days", areas: "EQ, Validating Feelings", method: "Workshop", rationale: "Misses emotional subtext." },
    high: { title: "Listening for Subtext", duration: "1 Day", areas: "Reading Between Lines", method: "Simulation", rationale: "Ready to hear what isn't said." },
    ex_high: { title: "Negotiation Psychology", duration: "2 Days", areas: "High-stakes Profiling", method: "Case Study", rationale: "Can de-escalate and close complex deals." }
  },
  c_decision_making: {
    ex_low: { title: "Overcoming Indecision", duration: "1 Day", areas: "Confidence, Basic Choice", method: "Coaching", rationale: "Freezes under pressure." },
    low: { title: "Decision Frameworks", duration: "1 Day", areas: "Pros/Cons, SWOT", method: "Classroom", rationale: "Lacks structure in choices." },
    med: { title: "Data-Driven Decisions", duration: "2 Days", areas: "Analytics, Reducing Bias", method: "Case Studies", rationale: "Needs to back intuition with data." },
    high: { title: "Strategic Decision Making", duration: "1 Day", areas: "Risk vs Reward, Stakeholders", method: "Gamified Sim", rationale: "Focus on organizational ripple effects." },
    ex_high: { title: "Decision Making Under Pressure", duration: "2 Days", areas: "Crisis Leadership, Ambiguity", method: "High-Stress Sim", rationale: "Thrives in ambiguity." }
  },
  c_strategic_sales: {
    ex_low: { title: "Intro to Sales", duration: "2 Days", areas: "Sales Cycle, Product Knowledge", method: "Training", rationale: "Lacks foundational sales knowledge." },
    low: { title: "Pipeline Management", duration: "1 Day", areas: "Prospecting, Closing", method: "CRM Training", rationale: "Disorganized funnel management." },
    med: { title: "Consultative Selling", duration: "2 Days", areas: "Value Prop, Solution Selling", method: "Roleplay", rationale: "Needs to shift from transactional to solution." },
    high: { title: "Key Account Management", duration: "2 Days", areas: "Relationship Building, Up-selling", method: "Seminar", rationale: "Focus on high-value retention." },
    ex_high: { title: "Global Market Strategy", duration: "3 Days", areas: "Macro-trends, Partnerships", method: "Retreat", rationale: "Top performer; strategic asset." }
  },
  c_social_media: {
    ex_low: { title: "Digital Literacy", duration: "0.5 Day", areas: "Platform Overview, Safety", method: "Lab", rationale: "Unfamiliar with platforms." },
    low: { title: "Professional Presence", duration: "1 Day", areas: "LinkedIn Profile, Etiquette", method: "Workshop", rationale: "Passive user; needs optimization." },
    med: { title: "Social Selling", duration: "2 Days", areas: "Content Strategy, Lead Gen", method: "Interactive", rationale: "Needs to convert likes to leads." },
    high: { title: "Content & Branding", duration: "1 Day", areas: "Video, Copywriting, Analytics", method: "Creative Lab", rationale: "Refine content authority." },
    ex_high: { title: "Thought Leadership", duration: "Ongoing", areas: "Industry Influence", method: "Mentorship", rationale: "Digital native brand ambassador." }
  },
  sl_leadership: {
    ex_low: { title: "Self-Leadership Basics", duration: "1 Day", areas: "Accountability, Ownership", method: "Classroom", rationale: "Must lead self before others." },
    low: { title: "Emerging Leaders", duration: "2 Days", areas: "Delegation, Motivation", method: "Workshop", rationale: "Lacks management tools." },
    med: { title: "Conflict Resolution", duration: "2 Days", areas: "Mediation, Difficult Convos", method: "Roleplay", rationale: "Avoids conflict; needs constructive skills." },
    high: { title: "Situational Leadership", duration: "2 Days", areas: "Adaptive Styles, Coaching", method: "Simulation", rationale: "Adapt style to team maturity." },
    ex_high: { title: "Organizational Influence", duration: "Ongoing", areas: "Vision, Culture, Change", method: "Executive Coaching", rationale: "Ready for strategic roles." }
  },
  sl_resilience: {
    ex_low: { title: "Coping with Stress", duration: "1 Day", areas: "Triggers, Breathing", method: "Wellness", rationale: "Easily overwhelmed." },
    low: { title: "Building Resilience", duration: "1 Day", areas: "Growth Mindset, Persistence", method: "Workshop", rationale: "Slow recovery from setbacks." },
    med: { title: "Emotional Intelligence", duration: "2 Days", areas: "Self-Regulation, Empathy", method: "Interactive", rationale: "Reactive; needs regulation." },
    high: { title: "Adaptability & Agility", duration: "2 Days", areas: "Change Mgmt, Flexibility", method: "Simulation", rationale: "Thrive during rapid change." },
    ex_high: { title: "Anti-Fragility", duration: "1 Day", areas: "Leading in Crisis, Stoicism", method: "Seminar", rationale: "Unshakeable anchor." }
  },
  sl_time_mgmt: {
    ex_low: { title: "Time Mgmt 101", duration: "1 Day", areas: "To-Do Lists, Punctuality", method: "Training", rationale: "Disorganized and late." },
    low: { title: "Prioritization", duration: "1 Day", areas: "Urgent vs Important", method: "Workshop", rationale: "Busy but not productive." },
    med: { title: "Productivity & Efficiency", duration: "1 Day", areas: "Deep Work, Batching", method: "Self-Paced", rationale: "Good output but burns out." },
    high: { title: "Agile Workflows", duration: "2 Days", areas: "Sprint Planning, Kanban", method: "Team Workshop", rationale: "Organize team workflows." },
    ex_high: { title: "Strategic Focus", duration: "0.5 Day", areas: "80/20 Rule, Vision Alignment", method: "Coaching", rationale: "Master of time allocation." }
  },
  i_communication: {
    ex_low: { title: "Business Comm Basics", duration: "2 Days", areas: "Grammar, Email Etiquette", method: "Training", rationale: "Unclear or unprofessional." },
    low: { title: "Verbal Communication", duration: "1 Day", areas: "Articulation, Confidence", method: "Drills", rationale: "Lacks speaking confidence." },
    med: { title: "Persuasive Presentation", duration: "2 Days", areas: "Structuring Arguments", method: "Video Practice", rationale: "Needs to sell ideas better." },
    high: { title: "Storytelling for Business", duration: "1 Day", areas: "Narrative Arc, Emotion", method: "Workshop", rationale: "Inspire through stories." },
    ex_high: { title: "Charisma & Presence", duration: "Ongoing", areas: "Media Training, Influence", method: "One-on-One", rationale: "Public face of the brand." }
  },
  i_positive_env: {
    ex_low: { title: "Workplace Etiquette", duration: "1 Day", areas: "Respect, Boundaries", method: "Training", rationale: "Disruptive behavior." },
    low: { title: "Teamwork Fundamentals", duration: "1 Day", areas: "Collaboration, Trust", method: "Team Building", rationale: "Works in silos." },
    med: { title: "Psychological Safety", duration: "1 Day", areas: "Inclusion, Feedback", method: "Interactive", rationale: "Create safe space for others." },
    high: { title: "Conflict Transformation", duration: "2 Days", areas: "Innovation from Conflict", method: "Simulation", rationale: "Turn friction into energy." },
    ex_high: { title: "Culture Building", duration: "2 Days", areas: "Values, Legacy", method: "Seminar", rationale: "Culture carrier." }
  },
  i_org_skills: {
    ex_low: { title: "Personal Organization", duration: "1 Day", areas: "Filing, Checklists", method: "Training", rationale: "Messy workspace/files." },
    low: { title: "Task Management", duration: "1 Day", areas: "Scheduling, Deadlines", method: "Workshop", rationale: "Misses deadlines." },
    med: { title: "Project Mgmt Fundamentals", duration: "2 Days", areas: "Resources, Timelines", method: "Case Study", rationale: "Manage small projects." },
    high: { title: "Systems Thinking", duration: "2 Days", areas: "Process Optimization", method: "Simulation", rationale: "Improve system efficiency." },
    ex_high: { title: "Operational Excellence", duration: "2 Days", areas: "Lean, Scaling", method: "Executive Course", rationale: "Operational expert." }
  }
};

// --- BIG 5 FEEDBACK DATABASE ---
const BIG5_FEEDBACK = {
  O: {
    high: { band: 'High (4.2-5.0)', interpretation: 'Strong natural tendency', context: 'Comfortable with new customer types, ambiguity, and unscripted conversations', strength: 'Can adapt to lifestyle-led, non-linear sales conversations', coachPoint: 'Leverage comfort with ambiguity to build deeper customer relationships', readinessFactor: 'Excellent for premium/HNI customers' },
    moderateHigh: { band: 'Moderately High (3.5-4.1)', interpretation: 'Reliable, usually visible', context: 'Generally comfortable with new ideas and diverse customer profiles', strength: 'Able to handle varied customer needs with reasonable flexibility', coachPoint: 'Build confidence in truly unscripted scenarios', readinessFactor: 'Good for premium exposure with coaching' },
    moderate: { band: 'Moderate (2.8-3.4)', interpretation: 'Situational, coachable', context: 'Prefers familiar structures; may hesitate with unconventional approaches', strength: 'Works well with structured processes and known customer types', coachPoint: 'Gradually introduce more ambiguity and unscripted selling techniques', readinessFactor: 'Requires development before premium exposure' },
    low: { band: 'Low (Below 2.8)', interpretation: 'Development risk', context: 'Prefers structure; may struggle with new or premium buyer profiles', strength: 'Excels in process-driven, predictable sales environments', coachPoint: 'Invest in structured premium selling frameworks; exposure therapy for ambiguity', readinessFactor: 'Needs significant development before HNI selling' }
  },
  C: {
    high: { band: 'High (4.2-5.0)', interpretation: 'Strong natural tendency', context: 'Reliable, prepared, detail-oriented, builds trust', strength: 'Consistent follow-through, meticulous documentation, earns customer confidence', coachPoint: 'Ensure detail-focus doesn\'t slow down closing; balance precision with pace', readinessFactor: 'Highly suited for premium customers valuing reliability' },
    moderateHigh: { band: 'Moderately High (3.5-4.1)', interpretation: 'Reliable, usually visible', context: 'Generally organized and detail-conscious', strength: 'Dependable follow-up and execution; inspires customer trust', coachPoint: 'Maintain consistency; add strategic thinking to details', readinessFactor: 'Ready for premium customers' },
    moderate: { band: 'Moderate (2.8-3.4)', interpretation: 'Situational, coachable', context: 'Variable attention to detail; inconsistent organization', strength: 'Can be detail-oriented when motivated or coached', coachPoint: 'Implement systems and checklists; build accountability habits', readinessFactor: 'Needs coaching before premium exposure' },
    low: { band: 'Low (Below 2.8)', interpretation: 'Development risk', context: 'Inconsistent follow-up, weak execution discipline', strength: 'May excel in dynamic, spontaneous situations', coachPoint: 'Critical: Establish CRM discipline, deadline accountability, quality checks', readinessFactor: 'Not ready for HNI customers—must improve execution first' }
  },
  E: {
    high: { band: 'High (4.2-5.0)', interpretation: 'Strong natural tendency', context: 'Confident presence, energetic, naturally initiates conversations', strength: 'Comfort initiating with strangers; infectious energy builds rapport', coachPoint: 'Guard against dominating conversations; practice active listening and restraint', readinessFactor: 'Strong presence, but must balance with empathy' },
    moderateHigh: { band: 'Moderately High (3.5-4.1)', interpretation: 'Reliable, usually visible', context: 'Presence without dominance; conversational restraint', strength: 'Balanced approach—confident but not overwhelming; approachable', coachPoint: 'Ideal state for HNI selling; maintain this balance', readinessFactor: 'Naturally suited for premium customer interactions' },
    moderate: { band: 'Moderate (2.8-3.4)', interpretation: 'Situational, coachable', context: 'Selective initiator; prefers smaller groups or one-on-ones', strength: 'Thoughtful listener; builds deep connections with prepared customers', coachPoint: 'Build confidence in cold outreach and group settings', readinessFactor: 'Can succeed with preparation; needs visibility coaching' },
    low: { band: 'Low (Below 2.8)', interpretation: 'Development risk', context: 'May struggle with visibility or initiation', strength: 'Can succeed with preparation; excels in deep, scheduled conversations', coachPoint: 'Exposure therapy: scheduled networking, prepared cold calls, team shadowing', readinessFactor: 'Needs visibility coaching before independent HNI prospecting' }
  },
  A: {
    high: { band: 'High (4.2-5.0)', interpretation: 'Strong natural tendency', context: 'Empathetic, respectful, relationship-focused, non-pushy', strength: 'Naturally trusted; listens deeply; puts customer needs first', coachPoint: 'Ensure empathy doesn\'t prevent assertive closing; balance warmth with results', readinessFactor: 'Excellent for long-term premium customer relationships' },
    moderateHigh: { band: 'Moderately High (3.5-4.1)', interpretation: 'Reliable, usually visible', context: 'Respectful, socially attuned; balanced approach', strength: 'Strong interpersonal skills; builds trust while maintaining professionalism', coachPoint: 'Maintain this balance; this is the ideal for HNI engagement', readinessFactor: 'Naturally suited for respectful premium selling' },
    moderate: { band: 'Moderate (2.8-3.4)', interpretation: 'Situational, coachable', context: 'Selectively cooperative; can be direct or indirect depending on context', strength: 'Can adjust style based on customer; not overly deferential', coachPoint: 'Develop consistent empathy; practice perspective-taking', readinessFactor: 'Needs coaching on consistent respect and empathy' },
    low: { band: 'Low (Below 2.8)', interpretation: 'Development risk', context: 'May appear pushy, dismissive, or overly transactional', strength: 'Direct, competitive; may excel in aggressive negotiations', coachPoint: 'Critical: Develop empathy and active listening; reframe "win-win" as personal value', readinessFactor: 'Not suited for HNI customers without significant agreeableness coaching' }
  },
  N: {
    high: { band: 'High (4.2-5.0)', interpretation: 'Strong natural tendency (High Neuroticism)', context: 'Anxious, reactive to stress, takes rejection personally', strength: 'Detail-aware; motivated by threat avoidance; conscientious', coachPoint: 'Critical coaching: Build emotional resilience; develop stress management and reframing', readinessFactor: 'Needs significant emotional coaching before premium exposure' },
    moderateHigh: { band: 'Moderately High (3.5-4.1)', interpretation: 'Moderately sensitive to stress', context: 'Reactive to pressure; confidence can fluctuate under stress', strength: 'Aware of risks; can be motivated to improve by avoiding failure', coachPoint: 'Build resilience through small wins; develop antistress techniques', readinessFactor: 'Needs coaching in stress resilience before HNI exposure' },
    moderate: { band: 'Moderate (2.8-3.4)', interpretation: 'Balanced emotional response', context: 'Generally steady under pressure; occasional stress reactions', strength: 'Resilient; can handle customer objections; bounces back from setbacks', coachPoint: 'Maintain current equilibrium; leverage resilience in coaching others', readinessFactor: 'Ready for premium customers; emotionally stable' },
    low: { band: 'Low (Below 2.8)', interpretation: 'Low Neuroticism = High Emotional Stability', context: 'Calm under pressure, silence, price resistance, and status asymmetry', strength: 'Naturally resilient; unshakeable confidence; thrives under stress', coachPoint: 'Mentor others; ensure overconfidence doesn\'t lead to dismissing customer concerns', readinessFactor: 'Ideally suited for high-stakes premium/HNI selling' }
  }
};

// --- HELPER FUNCTIONS ---

export const getTier = (percentage) => {
  const rounded = Math.round(percentage);
  if (rounded >= TIERS.DIAMOND.min) return TIERS.DIAMOND;
  if (rounded >= TIERS.GOLD.min) return TIERS.GOLD;
  if (rounded >= TIERS.SILVER.min) return TIERS.SILVER;
  return TIERS.BRONZE;
};

const normalizeCNIC = (cnic) => {
  if (!cnic) return "";
  return String(cnic).replace(/[^a-zA-Z0-9]/g, '').trim();
};

export const processData = (callback) => {
  Papa.parse(participantFile, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const csvData = results.data;
      
      try {
        const fetchUrl = `${API_URL}/api/dashboard-data`;
        const response = await fetch(fetchUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const dbData = await response.json();

        const merged = csvData.map(p => {
          const targetCnic = normalizeCNIC(p.cnic);
          const scoreRecord = dbData.find(s => normalizeCNIC(s.cnic) === targetCnic);
          
          if (!scoreRecord) return null; 

          const rawScores = scoreRecord.scores;
          const compAggregates = {};
          COMPETENCIES.forEach(comp => { compAggregates[comp.id] = { sum: 0, count: 0 }; });
          const oceanScores = { O: 0, C: 0, E: 0, A: 0, N: 0 };

          Object.keys(rawScores).forEach(key => {
            const val = parseInt(rawScores[key]);
            if (key.startsWith('ocean_')) {
              const trait = key.split('_')[1].toUpperCase();
              if (oceanScores[trait] !== undefined) oceanScores[trait] = val;
              return;
            }
            const matchedComp = COMPETENCIES.find(c => key.includes(c.id));
            if (matchedComp) {
              compAggregates[matchedComp.id].sum += val;
              compAggregates[matchedComp.id].count += 1;
            }
          });

          const finalScores = {};
          const feedbackList = [];
          const clusterTotals = { cognitive: 0, selfLeadership: 0, interpersonal: 0 };
          const clusterCounts = { cognitive: 0, selfLeadership: 0, interpersonal: 0 };

          COMPETENCIES.forEach(comp => {
            const agg = compAggregates[comp.id];
            const avgScore = agg.count > 0 ? agg.sum / agg.count : 0;
            const pct = (avgScore / 4) * 100;
            finalScores[comp.id] = pct;

            if (pct > 0) {
              clusterTotals[comp.cluster] += pct;
              clusterCounts[comp.cluster]++;
            }

            let suggestionObj = { title: "N/A", duration: "", areas: "", method: "", rationale: "" };
            if (FEEDBACK_DB[comp.id]) {
                if (avgScore <= 1.5) suggestionObj = FEEDBACK_DB[comp.id].ex_low;
                else if (avgScore <= 2.2) suggestionObj = FEEDBACK_DB[comp.id].low;
                else if (avgScore <= 3.0) suggestionObj = FEEDBACK_DB[comp.id].med;
                else if (avgScore <= 3.6) suggestionObj = FEEDBACK_DB[comp.id].high;
                else suggestionObj = FEEDBACK_DB[comp.id].ex_high;
            }

            feedbackList.push({
              competency: comp.label,
              score: avgScore.toFixed(1),
              details: suggestionObj,
              cluster: comp.cluster
            });
          });

          // --- BIG 5 FEEDBACK GENERATION ---
          const big5Feedback = {};
          Object.keys(oceanScores).forEach(trait => {
            const score = oceanScores[trait]; // Raw 1-5 score
            let feedback = {};
            
            if (score >= 4.2) feedback = BIG5_FEEDBACK[trait].high;
            else if (score >= 3.5) feedback = BIG5_FEEDBACK[trait].moderateHigh;
            else if (score >= 2.8) feedback = BIG5_FEEDBACK[trait].moderate;
            else feedback = BIG5_FEEDBACK[trait].low;

            big5Feedback[trait] = {
              score: score,
              ...feedback
            };
          });

          const cogPct = clusterCounts.cognitive > 0 ? clusterTotals.cognitive / clusterCounts.cognitive : 0;
          const slPct = clusterCounts.selfLeadership > 0 ? clusterTotals.selfLeadership / clusterCounts.selfLeadership : 0;
          const ipPct = clusterCounts.interpersonal > 0 ? clusterTotals.interpersonal / clusterCounts.interpersonal : 0;
          const overallPct = (cogPct + slPct + ipPct) / 3;

          return {
            ...p,
            scores: finalScores,
            calculated: {
              cognitive: cogPct,
              selfLeadership: slPct,
              interpersonal: ipPct,
              overall: overallPct,
              ocean: oceanScores,
              tier: getTier(overallPct),
              feedback: feedbackList,
              big5Feedback: big5Feedback // New Field
            }
          };
        }).filter(Boolean);

        merged.sort((a, b) => b.calculated.overall - a.calculated.overall);
        callback(merged);

      } catch (error) {
        console.error("❌ Error fetching DB data:", error);
        callback([]);
      }
    }
  });
};