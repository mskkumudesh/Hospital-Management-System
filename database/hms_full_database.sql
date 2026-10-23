-- =====================================================================
-- Hospital Management System - FULL DATABASE (structure + sample data)
-- WARNING: this DROPS the 'hms' database and recreates it from scratch.
-- Run once:  mysql -u root -p < hms_full_database.sql
-- =====================================================================
DROP DATABASE IF EXISTS hms;
CREATE DATABASE hms CHARACTER SET utf8mb4;
USE hms;

-- ---------- STRUCTURE ----------
CREATE TABLE roles(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(30) UNIQUE);
CREATE TABLE users(id INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(50) UNIQUE,password_hash VARCHAR(100),full_name VARCHAR(100),role_id INT,is_active TINYINT DEFAULT 1,last_login DATETIME,FOREIGN KEY(role_id) REFERENCES roles(id));
CREATE TABLE departments(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(80));
CREATE TABLE doctors(id INT AUTO_INCREMENT PRIMARY KEY,full_name VARCHAR(100),department_id INT,specialization VARCHAR(100),consultation_fee DECIMAL(10,2) DEFAULT 0,schedule VARCHAR(120),phone VARCHAR(30),FOREIGN KEY(department_id) REFERENCES departments(id));
CREATE TABLE doctor_schedules(id INT AUTO_INCREMENT PRIMARY KEY,doctor_id INT,weekday VARCHAR(10),start_time TIME,end_time TIME,FOREIGN KEY(doctor_id) REFERENCES doctors(id));
CREATE TABLE patients(id INT AUTO_INCREMENT PRIMARY KEY,full_name VARCHAR(100),dob DATE,gender VARCHAR(10),phone VARCHAR(30),address VARCHAR(200),blood_group VARCHAR(5),emergency_contact VARCHAR(100),deleted_at DATETIME NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE patient_documents(id INT AUTO_INCREMENT PRIMARY KEY,patient_id INT,file_name VARCHAR(200),file_path VARCHAR(250),uploaded_by INT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(patient_id) REFERENCES patients(id));
CREATE TABLE appointments(id INT AUTO_INCREMENT PRIMARY KEY,patient_id INT,doctor_id INT,scheduled_at DATETIME,status ENUM('booked','completed','cancelled') DEFAULT 'booked',notes VARCHAR(255),billed TINYINT DEFAULT 0,FOREIGN KEY(patient_id) REFERENCES patients(id),FOREIGN KEY(doctor_id) REFERENCES doctors(id));
CREATE TABLE admissions(id INT AUTO_INCREMENT PRIMARY KEY,patient_id INT,doctor_id INT,ward VARCHAR(40),bed_no VARCHAR(10),admitted_at DATETIME,discharged_at DATETIME NULL,daily_charge DECIMAL(10,2) DEFAULT 0,billed TINYINT DEFAULT 0,FOREIGN KEY(patient_id) REFERENCES patients(id));
CREATE TABLE medical_records(id INT AUTO_INCREMENT PRIMARY KEY,patient_id INT,doctor_id INT,diagnosis TEXT,prescription TEXT,treatment TEXT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,deleted_at DATETIME NULL,FOREIGN KEY(patient_id) REFERENCES patients(id));
CREATE TABLE lab_tests(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100),price DECIMAL(10,2));
CREATE TABLE lab_requests(id INT AUTO_INCREMENT PRIMARY KEY,patient_id INT,test_id INT,status ENUM('requested','collected','completed') DEFAULT 'requested',result TEXT,requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,billed TINYINT DEFAULT 0,FOREIGN KEY(patient_id) REFERENCES patients(id),FOREIGN KEY(test_id) REFERENCES lab_tests(id));
CREATE TABLE medicines(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100),unit_price DECIMAL(10,2),stock_qty INT DEFAULT 0,reorder_level INT DEFAULT 10,expiry_date DATE);
CREATE TABLE prescription_items(id INT AUTO_INCREMENT PRIMARY KEY,patient_id INT,medicine_id INT,qty INT DEFAULT 1,instructions VARCHAR(200),dispensed TINYINT DEFAULT 0,billed TINYINT DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(patient_id) REFERENCES patients(id),FOREIGN KEY(medicine_id) REFERENCES medicines(id));
CREATE TABLE invoices(id INT AUTO_INCREMENT PRIMARY KEY,patient_id INT,total DECIMAL(10,2) DEFAULT 0,paid DECIMAL(10,2) DEFAULT 0,status ENUM('unpaid','partial','paid') DEFAULT 'unpaid',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(patient_id) REFERENCES patients(id));
CREATE TABLE invoice_items(id INT AUTO_INCREMENT PRIMARY KEY,invoice_id INT,type ENUM('consultation','laboratory','pharmacy','admission'),description VARCHAR(150),amount DECIMAL(10,2),FOREIGN KEY(invoice_id) REFERENCES invoices(id));
CREATE TABLE payments(id INT AUTO_INCREMENT PRIMARY KEY,invoice_id INT,amount DECIMAL(10,2),method VARCHAR(20),received_by INT,paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(invoice_id) REFERENCES invoices(id));
CREATE TABLE employees(id INT AUTO_INCREMENT PRIMARY KEY,full_name VARCHAR(100),department_id INT,position VARCHAR(60),hire_date DATE,phone VARCHAR(30));
CREATE TABLE attendance(id INT AUTO_INCREMENT PRIMARY KEY,employee_id INT,day DATE,status ENUM('present','absent','leave'),FOREIGN KEY(employee_id) REFERENCES employees(id));
CREATE TABLE leave_records(id INT AUTO_INCREMENT PRIMARY KEY,employee_id INT,from_date DATE,to_date DATE,reason VARCHAR(150),FOREIGN KEY(employee_id) REFERENCES employees(id));
CREATE TABLE audit_logs(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT,action VARCHAR(10),path VARCHAR(200),ip VARCHAR(50),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

-- ---------- REQUIRED STARTING DATA ----------
INSERT INTO roles(name) VALUES('admin'),('doctor'),('nurse'),('receptionist'),('lab'),('pharmacist'),('accountant');
INSERT INTO departments(name) VALUES('General Medicine'),('Pediatrics'),('Surgery'),('Radiology');

-- Demo users: username = role name, password = role name + 123 (change after first login)
INSERT INTO users(username,password_hash,full_name,role_id) VALUES
('admin','$2b$10$OtmrRfvJzBBjqdqTXN/SLuTFIkULAwA/15YiHK8h1DBPNHMwhnWwi','admin (demo)',1),
('doctor','$2b$10$Th7lVVVDt/hePTul8ejBkeID8k3ZR48Y6QG81z3pEdeyGD5LAn5a6','doctor (demo)',2),
('nurse','$2b$10$GNVpOST5XWYLKZTlUibgHupIsP3dIOYyv/IPD4g4abwtgChX.ql3S','nurse (demo)',3),
('receptionist','$2b$10$PtWB1ilZatdVrd/rZn9ViOZZnRdXxqDSlCLG2sXM1Z5UdgBDNtBLW','receptionist (demo)',4),
('lab','$2b$10$KIftbnHiitGKIk.oILUXju.d8S2njaxTGjvoTgEnLKKf7mKjnmota','lab (demo)',5),
('pharmacist','$2b$10$fUZb.V0G9TKdrsfAoeK5E.J.qUUfRa.gZL3mWPMgkK0Ofda.wTVn.','pharmacist (demo)',6),
('accountant','$2b$10$PrT7xW1wSnKl9U51V3J2Pei9Vv4tdfSaRzo9todC9NgSyw1WdmMpi','accountant (demo)',7);

-- ---------- SAMPLE DATA (at the bottom, safe to delete for a real hospital) ----------
INSERT INTO doctors(full_name,department_id,specialization,consultation_fee,schedule,phone) VALUES
('Dr. Nimal Perera',1,'General Physician',2500,'Mon-Fri 9-13','0771000001'),
('Dr. Kamani Silva',2,'Pediatrician',3000,'Mon-Sat 14-18','0771000002'),
('Dr. Ruwan Fernando',3,'General Surgeon',4500,'Tue, Thu 8-12','0771000003');
INSERT INTO doctor_schedules(doctor_id,weekday,start_time,end_time) VALUES
(1,'Monday','09:00','13:00'),(1,'Tuesday','09:00','13:00'),(1,'Wednesday','09:00','13:00'),(1,'Thursday','09:00','13:00'),(1,'Friday','09:00','13:00'),
(2,'Monday','14:00','18:00'),(2,'Wednesday','14:00','18:00'),(2,'Friday','14:00','18:00'),
(3,'Tuesday','08:00','12:00'),(3,'Thursday','08:00','12:00');
INSERT INTO patients(full_name,dob,gender,phone,address,blood_group,emergency_contact) VALUES
('Amal Jayasinghe','1985-03-12','Male','0712345601','12 Galle Rd, Colombo','O+','Sunil Jayasinghe 0712345611'),
('Nadeesha Weerasinghe','1992-07-25','Female','0712345602','45 Temple Rd, Kandy','A+','Kasun Weerasinghe 0712345612'),
('Kavindu Rajapaksa','2015-11-02','Male','0712345603','8 Lake Dr, Negombo','B+','Isuri Rajapaksa 0712345613'),
('Sanduni Perera','1978-01-30','Female','0712345604','23 Main St, Galle','AB+','Ruwan Perera 0712345614'),
('Dilshan Fernando','1965-09-18','Male','0712345605','67 Hill St, Matara','O-','Mala Fernando 0712345615');
INSERT INTO appointments(patient_id,doctor_id,scheduled_at,status,notes,billed) VALUES
(1,1,TIMESTAMP(DATE_SUB(CURDATE(),INTERVAL 7 DAY),'10:00:00'),'completed','Fever and cough',1),
(2,1,TIMESTAMP(DATE_SUB(CURDATE(),INTERVAL 1 DAY),'09:30:00'),'completed','Follow-up',0),
(3,2,TIMESTAMP(CURDATE(),'15:00:00'),'booked','Vaccination check',0),
(4,1,TIMESTAMP(DATE_ADD(CURDATE(),INTERVAL 1 DAY),'11:00:00'),'booked','Blood pressure review',0),
(5,3,TIMESTAMP(DATE_ADD(CURDATE(),INTERVAL 2 DAY),'09:00:00'),'booked','Pre-surgery consult',0);
INSERT INTO admissions(patient_id,doctor_id,ward,bed_no,admitted_at,discharged_at,daily_charge,billed) VALUES
(5,3,'Surgical Ward','S-12',DATE_SUB(NOW(),INTERVAL 5 DAY),DATE_SUB(NOW(),INTERVAL 2 DAY),8000,0),
(4,1,'General Ward','G-04',DATE_SUB(NOW(),INTERVAL 1 DAY),NULL,5000,0);
INSERT INTO medical_records(patient_id,doctor_id,diagnosis,prescription,treatment) VALUES
(1,1,'Acute bronchitis','Amoxicillin 500mg three times daily for 5 days','Rest, fluids, follow-up in one week'),
(2,1,'Mild hypertension','Amlodipine 5mg once daily','Reduce salt, monthly BP check'),
(3,2,'Routine child check-up','Vitamin D drops','Vaccination schedule on track');
INSERT INTO lab_tests(name,price) VALUES('Full Blood Count',1500),('Blood Sugar (Fasting)',800),('Lipid Profile',2500),('Urine Full Report',700);
INSERT INTO lab_requests(patient_id,test_id,status,result,billed) VALUES
(1,1,'completed','Hb 13.5 g/dL, WBC 11.2 (slightly raised)',1),
(2,3,'completed','Total cholesterol 5.9 mmol/L',0),
(4,2,'collected',NULL,0),
(5,1,'requested',NULL,0);
INSERT INTO medicines(name,unit_price,stock_qty,reorder_level,expiry_date) VALUES
('Paracetamol 500mg',5,500,100,DATE_ADD(CURDATE(),INTERVAL 18 MONTH)),
('Amoxicillin 500mg',25,200,50,DATE_ADD(CURDATE(),INTERVAL 12 MONTH)),
('Amlodipine 5mg',18,8,20,DATE_ADD(CURDATE(),INTERVAL 10 MONTH)),
('Vitamin D Drops',450,40,10,DATE_ADD(CURDATE(),INTERVAL 30 DAY)),
('Metformin 500mg',12,300,60,DATE_ADD(CURDATE(),INTERVAL 24 MONTH));
INSERT INTO prescription_items(patient_id,medicine_id,qty,instructions,dispensed,billed) VALUES
(1,2,15,'1 capsule three times daily for 5 days',1,0),
(2,3,30,'1 tablet once daily',0,0),
(3,4,1,'5 drops daily',0,0);
INSERT INTO invoices(patient_id,total,paid,status) VALUES(1,4000,2000,'partial');
INSERT INTO invoice_items(invoice_id,type,description,amount) VALUES(1,'consultation','Consultation with Dr. Nimal Perera',2500),(1,'laboratory','Lab: Full Blood Count',1500);
INSERT INTO payments(invoice_id,amount,method,received_by) VALUES(1,2000,'cash',1);
INSERT INTO employees(full_name,department_id,position,hire_date,phone) VALUES
('Chamari Wickramasinghe',1,'Head Nurse','2019-04-01','0772000001'),
('Pradeep Kumara',4,'Radiographer','2021-08-15','0772000002'),
('Ishara Dissanayake',1,'Receptionist','2023-02-10','0772000003');
INSERT INTO attendance(employee_id,day,status) VALUES
(1,CURDATE(),'present'),(2,CURDATE(),'present'),(3,CURDATE(),'absent'),
(1,DATE_SUB(CURDATE(),INTERVAL 1 DAY),'present'),(3,DATE_SUB(CURDATE(),INTERVAL 1 DAY),'leave');
INSERT INTO leave_records(employee_id,from_date,to_date,reason) VALUES
(3,DATE_SUB(CURDATE(),INTERVAL 1 DAY),CURDATE(),'Medical leave');
