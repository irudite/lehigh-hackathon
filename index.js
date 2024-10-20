const fs = require('fs');
const csv = require('csv-parser');
const kmeans = require('node-kmeans');
const seedrandom = require('seedrandom');

// Set the seed
seedrandom('23', { global: true });

let students = [];
let userInput = {};
const studentFilePath = 'students.json';

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
  
  // Extract classes
  for (let i = 1; i <= 5; i++) {
    const className = student[`Class ${i}`];
    if (className && className.trim()) {
      classes.push(className.trim());
    }
  }
  
  // Extract professors
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
    getUserInput().then(() => {
      processStudentData(students);
    });
  });

// Function to prompt user for their information
function getUserInput() {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    readline.question('Enter your name: ', (name) => {
      userInput['Student Name'] = name;
      readline.question('Enter your major: ', (major) => {
        userInput['Major'] = major;
        readline.question('Enter your classes (comma separated): ', (classes) => {
          userInput['Classes'] = classes.split(',').map(c => c.trim());
          readline.question('Enter your professors (comma separated): ', (professors) => {
            userInput['Professors'] = professors.split(',').map(p => p.trim());
            readline.close();

            const existingUser = students.find(student => student['Student Name'] === userInput['Student Name']);
            if (existingUser) {
              console.log('User already exists in the system. Updating information...');
              Object.assign(existingUser, userInput);
            } else {
              console.log('New user. Adding to the system...');
              students.push(userInput);
            }

            saveStudentData();
            resolve();
          });
        });
      });
    });
  });
}

// Function to encode classes, professors, and majors
function encodeStudentData(students) {
  const classMap = {};
  const professorMap = {};
  const majorMap = {};
  let classIndex = 0;
  let professorIndex = 0;
  let majorIndex = 0;

  // Encode existing students
  students.forEach(student => {
    // Encode classes from the Classes array
    (student.Classes || []).forEach(className => {
      if (className && !classMap[className]) {
        classMap[className] = classIndex++;
      }
    });

    // Encode professors from the Professors array
    (student.Professors || []).forEach(professorName => {
      if (professorName && !professorMap[professorName]) {
        professorMap[professorName] = professorIndex++;
      }
    });

    // Encode major
    const majorName = student['Major'];
    if (majorName && !majorMap[majorName]) {
      majorMap[majorName] = majorIndex++;
    }
  });

  // Encode user input
  (userInput.Classes || []).forEach(className => {
    if (className && !classMap[className]) {
      classMap[className] = classIndex++;
    }
  });

  (userInput.Professors || []).forEach(professorName => {
    if (professorName && !professorMap[professorName]) {
      professorMap[professorName] = professorIndex++;
    }
  });

  if (userInput.Major && !majorMap[userInput.Major]) {
    majorMap[userInput.Major] = majorIndex++;
  }

  const maxClasses = classIndex;
  const maxProfessors = professorIndex;
  const maxMajors = majorIndex;

  // Process student vectors
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

  // Process user input vectors
  userInput.classVector = Array(maxClasses).fill(-1);
  (userInput.Classes || []).forEach(className => {
    if (classMap[className] !== undefined) {
      userInput.classVector[classMap[className]] = classMap[className];
    }
  });

  userInput.professorVector = Array(maxProfessors).fill(-1);
  (userInput.Professors || []).forEach(professorName => {
    if (professorMap[professorName] !== undefined) {
      userInput.professorVector[professorMap[professorName]] = professorMap[professorName];
    }
  });

  userInput.majorVector = Array(maxMajors).fill(-1);
  if (majorMap[userInput.Major] !== undefined) {
    userInput.majorVector[majorMap[userInput.Major]] = majorMap[userInput.Major];
  }

  userInput.clusterVector = [
    ...userInput.classVector,
    ...userInput.professorVector,
    ...userInput.majorVector
  ];

  return students.filter(student => student.clusterVector && student.clusterVector.length > 0);
}

// Function to process student data and determine matches
async function processStudentData(students) {
  // Find exact matches first
  const findMatches = (students, userInput) => {
    const matches = [];

    students.forEach(student => {
      if (student['Student Name'] !== userInput['Student Name']) {
        // Ensure Classes and Professors arrays exist
        const studentClasses = student.Classes || [];
        const studentProfessors = student.Professors || [];
        const userClasses = userInput.Classes || [];
        const userProfessors = userInput.Professors || [];

        const sharedClasses = studentClasses.filter(classItem => 
          userClasses.includes(classItem));
        const sharedProfessors = studentProfessors.filter(professor => 
          userProfessors.includes(professor));

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

  // Get exact matches
  const exactMatches = findMatches(students, userInput);

  if (exactMatches.length > 0) {
    console.log('\nYou have been matched with the following students based on shared classes and professors:');
    exactMatches.forEach(match => {
      console.log(`\nName: ${match.studentName} (${match.major})`);
      if (match.sharedClasses.length > 0) {
        console.log(`  Shared Classes: ${match.sharedClasses.join(', ')}`);
      }
      if (match.sharedProfessors.length > 0) {
        console.log(`  Shared Professors: ${match.sharedProfessors.join(', ')}`);
      }
    });
  } else {
    // If no exact matches, use k-means clustering
    const encodedStudents = encodeStudentData(students);
    if (encodedStudents.length === 0) {
      console.error('No valid data available for clustering');
      return;
    }

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
    let clusters;
    
    try {
      while (numClusters > 1) {
        clusters = await performClustering(numClusters);
        const validClusters = clusters.filter(cluster => 
          cluster.clusterInd.length >= 5);
        if (validClusters.length > 0) break;
        numClusters--;
      }

      const userCluster = clusters.find(cluster => 
        cluster.clusterInd.includes(data.length - 1));

      if (userCluster) {
        console.log('\nBased on similar academic patterns, you have been matched with:');
        const matchedStudents = userCluster.clusterInd
          .filter(index => encodedStudents[index]['Student Name'] !== userInput['Student Name'])
          .map(index => encodedStudents[index]);

        const selectedMatches = matchedStudents.length > 4 ? 
          shuffleArray(matchedStudents).slice(0, 4) : matchedStudents;

        selectedMatches.forEach(student => {
          console.log(`\nName: ${student['Student Name']}, Major: ${student['Major']}`);
          if (student.Classes && student.Classes.length > 0) {
            console.log(`  Classes: ${student.Classes.join(', ')}`);
          }
          if (student.Professors && student.Professors.length > 0) {
            console.log(`  Professors: ${student.Professors.join(', ')}`);
          }
        });
      } else {
        console.log('\nNo suitable matches found through clustering analysis.');
      }
    } catch (error) {
      console.error('Clustering error:', error);
      return;
    }
  }
}

// Utility function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}