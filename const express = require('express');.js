const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/ugmc', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Define data models
const patientSchema = new mongoose.Schema({
  patientID: { type: String, required: true, unique: true },
  surname: String,
  otherNames: String,
  gender: String,
  phoneNumber: String,
  residentialAddress: String,
  emergencyContact: {
    name: String,
    contact: String,
    relationship: String
  },
  encounters: [{
    dateAndTime: Date,
    encounterType: String,
    vitals: {
      bloodPressure: String,
      temperature: String,
      pulse: String,
      spO2: String
    }
  }]
});

const Patient = mongoose.model('Patient', patientSchema);

// Endpoint to register a patient
app.post('/register_patient', async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    await newPatient.save();
    res.json({ message: 'Patient registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to start an encounter for a patient
app.post('/start_encounter', async (req, res) => {
  try {
    const { patientID, dateAndTime, encounterType } = req.body;
    const patient = await Patient.findOne({ patientID });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const newEncounter = {
      dateAndTime,
      encounterType,
      vitals: {}
    };

    patient.encounters.push(newEncounter);
    await patient.save();

    res.json({ message: 'Encounter started successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to submit patient vitals by a nurse
app.post('/submit_vitals', async (req, res) => {
  try {
    const { patientID, encounterIndex, vitals } = req.body;
    const patient = await Patient.findOne({ patientID });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const encounter = patient.encounters[encounterIndex];
    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    encounter.vitals = vitals;
    await patient.save();

    res.json({ message: 'Vitals submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to view a list of patients
app.get('/view_patients', async (req, res) => {
  try {
    const patients = await Patient.find({}, '_id patientID surname otherNames');
    res.json({ patients });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to view details of a specific patient
app.get('/view_patient/:patientID', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientID: req.params.patientID });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({ patient });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(Server is running on port ${PORT});
});
