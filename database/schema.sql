CREATE DATABASE IF NOT EXISTS blood_bank;
USE blood_bank;


CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(20),
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120),
  city VARCHAR(80) NOT NULL,
  last_donation_date DATE NULL,
  available TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL UNIQUE,
  units INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(100) NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  units INT NOT NULL,
  hospital VARCHAR(150) NOT NULL,
  city VARCHAR(80) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  urgency ENUM('Normal','Urgent','Emergency') NOT NULL DEFAULT 'Normal',
  status ENUM('Pending','Approved','Rejected','Completed') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO inventory (blood_group, units) VALUES
('A+', 8), ('A-', 3), ('B+', 6), ('B-', 2),
('AB+', 4), ('AB-', 1), ('O+', 10), ('O-', 2);
