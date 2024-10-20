
const fs = require('fs');
const csv = require('csv-parser');
const kmeans = require('node-kmeans');
let students = [];
let userInput = {};
// Read the CSV file and store data in an array
fs.createReadStream('student_data.csv')
  .pipe(csv())
  .on('data', (row) => {
    students.push(row);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    // Prompt user for input
    getUserInput().then(() => {
      processStudentData(students); // Call the function to process data
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
    // Encode classes
    for (let i = 1; i <= 5; i++) {
      const className = student[`Class ${i}`];
      if (className && !classMap[className]) {
        classMap[className] = classIndex++;
      }
    }
    // Encode professors
    for (let i = 1; i <= 5; i++) {
      const professorName = student[`Professor ${i}`];
      if (professorName && !professorMap[professorName]) {
        professorMap[professorName] = professorIndex++;
      }
    }
    // Encode major
    const majorName = student['Major'];
    if (majorName && !majorMap[majorName]) {
      majorMap[majorName] = majorIndex++;
    }
  });
  // Encode user input
  for (const className of userInput.Classes) {
    if (className && !classMap[className]) {
      classMap[className] = classIndex++;
    }
  }
  
  for (const professorName of userInput.Professors) {
    if (professorName && !professorMap[professorName]) {
      professorMap[professorName] = professorIndex++;
    }
  }
  if (userInput.Major && !majorMap[userInput.Major]) {
    majorMap[userInput.Major] = majorIndex++;
  }
  // Initialize maximum dimensions for vectors
  const maxClasses = classIndex;
  const maxProfessors = professorIndex;
  const maxMajors = majorIndex;
  // Map to numerical vectors for each student
  students.forEach(student => {
    student.classVector = Array(maxClasses).fill(-1); // Initialize with -1
    for (let i = 1; i <= 5; i++) {
      const className = student[`Class ${i}`];
      if (className && classMap[className] !== undefined) {
        student.classVector[classMap[className]] = classMap[className];
      }
    }
    
    student.professorVector = Array(maxProfessors).fill(-1); // Initialize with -1
    for (let i = 1; i <= 5; i++) {
      const professorName = student[`Professor ${i}`];
      if (professorName && professorMap[professorName] !== undefined) {
        student.professorVector[professorMap[professorName]] = professorMap[professorName];
      }
    }
    
    student.majorVector = Array(maxMajors).fill(-1); // Initialize with -1
    if (majorMap[student['Major']] !== undefined) {
      student.majorVector[majorMap[student['Major']]] = majorMap[student['Major']];
    }
    
    student.clusterVector = [
      ...student.classVector, 
      ...student.professorVector, 
      ...student.majorVector
    ];
  });
  // Encode user input as a new student
  userInput.classVector = Array(maxClasses).fill(-1); // Initialize with -1
  userInput.Classes.forEach(className => {
    if (classMap[className] !== undefined) {
      userInput.classVector[classMap[className]] = classMap[className];
    }
  });
  
  userInput.professorVector = Array(maxProfessors).fill(-1); // Initialize with -1
  userInput.Professors.forEach(professorName => {
    if (professorMap[professorName] !== undefined) {
      userInput.professorVector[professorMap[professorName]] = professorMap[professorName];
    }
  });
  
  userInput.majorVector = Array(maxMajors).fill(-1); // Initialize with -1
  if (majorMap[userInput.Major] !== undefined) {
    userInput.majorVector[majorMap[userInput.Major]] = majorMap[userInput.Major];
  }
  
  userInput.clusterVector = [
    ...userInput.classVector, 
    ...userInput.professorVector, 
    ...userInput.majorVector
  ];
  
  students.push(userInput); // Add user data to students array
  // Filter out students with no valid vectors
  return students.filter(student => student.clusterVector.length > 0);
}
// Function to process student data and perform K-means clustering
async function processStudentData(students) {
  // Encode student data
  students = encodeStudentData(students);
  // Prepare data for clustering
  const data = students.map(student => student.clusterVector);
  if (data.length === 0) {
    console.error('No valid data available for clustering');
    return;
  }
  // Function to perform clustering
  const performClustering = (numClusters) => {
    return new Promise((resolve, reject) => {
      kmeans.clusterize(data, { k: numClusters }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  };
  // Loop to adjust number of clusters until we get valid clusters
  let numClusters = 30; // Start with a high number of clusters
  let clusters;
  try {
    while (numClusters > 1) {
      clusters = await performClustering(numClusters);
      // Check for clusters with fewer than 2 members
      const validClusters = clusters.filter(cluster => cluster.clusterInd.length >= 2);
      if (validClusters.length === clusters.length) {
        break; // All clusters are valid
      }
      numClusters--; // Reduce the number of clusters if there are invalid ones
    }
  } catch (error) {
    console.error('Clustering error:', error);
    return;
  }
  // Handle if we can't find any valid clusters
  if (numClusters < 1 || !clusters) {
    console.error('Unable to form valid clusters with at least 2 students each.');
    return;
  }
  // Adjust clusters to ensure a max of 5 students per cluster
  const adjustedClusters = [];
  clusters.forEach(cluster => {
    const clusterStudents = cluster.clusterInd.map(index => students[index]);
    while (clusterStudents.length > 5) {
      const group = clusterStudents.splice(0, 5);
      adjustedClusters.push({ clusterInd: group.map(s => students.indexOf(s)) });
    }
    if (clusterStudents.length > 0) {
      adjustedClusters.push({ clusterInd: clusterStudents.map(s => students.indexOf(s)) });
    }
  });
  console.log('Clusters:', adjustedClusters);
  groupStudentsIntoStudyGroups(students, adjustedClusters);
  // Save clusters to a file for future use
  fs.writeFileSync('clusters.json', JSON.stringify(adjustedClusters, null, 2));
  console.log('Clusters saved to clusters.json');
}
// Function to group students into study groups based on clusters
function groupStudentsIntoStudyGroups(students, clusters) {
  clusters.forEach((cluster, index) => {
    console.log(`Study Group ${index + 1}:`);
    cluster.clusterInd.forEach(studentIndex => {
      const student = students[studentIndex];
      console.log(student['Student Name'] ? student['Student Name'] : 'Unknown Student');
    });
    console.log('\n');
  });
}
