const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const kmeans = require('node-kmeans');
const seedrandom = require('seedrandom');
const bodyParser = require('body-parser');

// Set the seed for reproducibility
seedrandom('23', { global: true });

const app = express();
const port = 3000;
let students = [];
const studentFilePath = 'students.json';

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Load previous student data if it exists
function loadStudentData() {
  if (fs.existsSync(studentFilePath)) {
    const data = fs.readFileSync(studentFilePath);
    students = JSON.parse(data);
    console.log('Loaded previous student data.');
  } else {
    console.log('No previous student data found.');
  }
}

// Save student data to the file
function saveStudentData() {
  fs.writeFileSync(studentFilePath, JSON.stringify(students, null, 2));
  console.log('Student data saved to', studentFilePath);
}

// Helper function to extract classes and professors from CSV row
function extractClassesAndProfessors(student) {
  const classes = [];
  const professors = [];
  
  for (let i = 1; i <= 5; i++) {
    const className = student[`Class ${i}`];
    if (className && className.trim()) {
      classes.push(className.trim());
    }
  }
  
  for (let i = 1; i <= 5; i++) {
    const professorName = student[`Professor ${i}`];
    if (professorName && professorName.trim()) {
      professors.push(professorName.trim());
    }
  }
  
  return { classes, professors };
}

// Read the CSV file and store data in an array
fs.createReadStream('student_data.csv')
  .pipe(csv())
  .on('data', (row) => {
    const { classes, professors } = extractClassesAndProfessors(row);
    const enrichedRow = {
      ...row,
      Classes: classes,
      Professors: professors
    };
    students.push(enrichedRow);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    loadStudentData();
  });

// Function to encode student data (same as earlier)
function encodeStudentData(students) {
  const classMap = {};
  const professorMap = {};
  const majorMap = {};
  let classIndex = 0;
  let professorIndex = 0;
  let majorIndex = 0;

  students.forEach(student => {
    (student.Classes || []).forEach(className => {
      if (className && !classMap[className]) {
        classMap[className] = classIndex++;
      }
    });

    (student.Professors || []).forEach(professorName => {
      if (professorName && !professorMap[professorName]) {
        professorMap[professorName] = professorIndex++;
      }
    });

    const majorName = student['Major'];
    if (majorName && !majorMap[majorName]) {
      majorMap[majorName] = majorIndex++;
    }
  });

  const maxClasses = classIndex;
  const maxProfessors = professorIndex;
  const maxMajors = majorIndex;

  students.forEach(student => {
    student.classVector = Array(maxClasses).fill(-1);
    (student.Classes || []).forEach(className => {
      if (className && classMap[className] !== undefined) {
        student.classVector[classMap[className]] = classMap[className];
      }
    });

    student.professorVector = Array(maxProfessors).fill(-1);
    (student.Professors || []).forEach(professorName => {
      if (professorName && professorMap[professorName] !== undefined) {
        student.professorVector[professorMap[professorName]] = professorMap[professorName];
      }
    });

    student.majorVector = Array(maxMajors).fill(-1);
    if (majorMap[student['Major']] !== undefined) {
      student.majorVector[majorMap[student['Major']]] = majorMap[student['Major']];
    }

    student.clusterVector = [
      ...student.classVector,
      ...student.professorVector,
      ...student.majorVector
    ];
  });

  return students.filter(student => student.clusterVector && student.clusterVector.length > 0);
}

// API route to get all students
app.get('/students', (req, res) => {
  res.json(students);
});

// API route to add or update student data
app.post('/students', (req, res) => {
  const userInput = req.body;

  // Check if the student already exists
  const existingUser = students.find(student => student['Student Name'] === userInput['Student Name']);
  if (existingUser) {
    console.log('User already exists. Updating information...');
    Object.assign(existingUser, userInput);
  } else {
    console.log('New user. Adding to the system...');
    students.push(userInput);
  }

  saveStudentData();
  res.json({ message: 'Student data updated or added successfully.' });
});

// API route to find matches for a student
app.post('/find-matches', (req, res) => {
  const userInput = req.body;

  // Find exact matches first
  const findMatches = (students, userInput) => {
    const matches = [];

    students.forEach(student => {
      if (student['Student Name'] !== userInput['Student Name']) {
        const sharedClasses = student.Classes.filter(classItem => 
          userInput.Classes.includes(classItem));
        const sharedProfessors = student.Professors.filter(professor => 
          userInput.Professors.includes(professor));

        if (sharedClasses.length > 0 || sharedProfessors.length > 0) {
          matches.push({
            studentName: student['Student Name'],
            major: student['Major'],
            sharedClasses,
            sharedProfessors
          });
        }
      }
    });

    return matches;
  };

  const exactMatches = findMatches(students, userInput);

  if (exactMatches.length > 0) {
    res.json({ matches: exactMatches });
  } else {
    // If no exact matches, use k-means clustering
    const encodedStudents = encodeStudentData(students);
    const data = encodedStudents.map(student => student.clusterVector);
    
    const performClustering = (numClusters) => {
      return new Promise((resolve, reject) => {
        kmeans.clusterize(data, { k: numClusters }, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
    };

    let numClusters = Math.min(30, Math.floor(data.length / 2));

    performClustering(numClusters).then(clusters => {
      const userCluster = clusters.find(cluster => 
        cluster.clusterInd.includes(data.length - 1));

      if (userCluster) {
        const matchedStudents = userCluster.clusterInd
          .filter(index => encodedStudents[index]['Student Name'] !== userInput['Student Name'])
          .map(index => encodedStudents[index]);

        const selectedMatches = matchedStudents.length > 4 ? 
          matchedStudents.slice(0, 4) : matchedStudents;

        res.json({ matches: selectedMatches });
      } else {
        res.json({ message: 'No suitable matches found through clustering analysis.' });
      }
    }).catch(error => {
      res.status(500).json({ error: 'Clustering error', details: error });
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
