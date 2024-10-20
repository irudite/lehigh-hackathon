Student Matching System
Overview
The Student Matching System is a Node.js application designed to help students find potential study partners based on shared classes and professors. The application reads student data from a CSV file, allows users to input their information, and uses k-means clustering to identify matches based on academic profiles.

Features
Data Storage: Loads and saves student data to a local JSON file (students.json).
CSV Data Parsing: Reads student information from a CSV file (student_data.csv).
User Input: Prompts users for their name, major, classes, and professors.
Matching Logic:
First attempts to find exact matches based on shared classes and professors.
If no exact matches are found, it uses k-means clustering to find similar students based on academic patterns.
Dynamic Clustering: Automatically adjusts the number of clusters to ensure meaningful matches.
How It Works
Data Loading: When the application starts, it loads existing student data from students.json. If no data is found, it initializes an empty list of students.
CSV File Processing: It reads data from student_data.csv, extracting classes and professors for each student.
User Interaction: Users are prompted to enter their details, which are then stored in the student list. If a user already exists, their information is updated.
Exact Matching: The system checks for students with shared classes or professors. If matches are found, they are displayed.
K-Means Clustering: If no matches are found, the system encodes the student data into vectors and performs k-means clustering to identify groups of similar students.
Result Display: Matched students are displayed, including their names, majors, classes, and professors.