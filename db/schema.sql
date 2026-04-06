CREATE DATABASE hellomayor;
USE hellomayor;

CREATE TABLE notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_en VARCHAR(255) NOT NULL,
  title_np VARCHAR(255),
  content_en TEXT NOT NULL,
  content_np TEXT,
  category VARCHAR(100),
  is_important BOOLEAN DEFAULT false,
  publish_date DATE DEFAULT (CURDATE()),
  expiry_date DATE,
  attachment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gallery_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_en VARCHAR(255) NOT NULL,
  title_np VARCHAR(255),
  description_en TEXT,
  description_np TEXT,
  media_type ENUM('image', 'video') DEFAULT 'image',
  media_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  category VARCHAR(100) DEFAULT 'general',
  event_date DATE,
  is_featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_en VARCHAR(255) NOT NULL,
  title_np VARCHAR(255),
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt_en TEXT,
  excerpt_np TEXT,
  content_en LONGTEXT NOT NULL,
  content_np LONGTEXT,
  cover_image_url VARCHAR(500),
  author_name VARCHAR(255),
  category VARCHAR(100),
  tags JSON,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE development_works (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_en VARCHAR(255) NOT NULL,
  title_np VARCHAR(255),
  description_en TEXT,
  description_np TEXT,
  category VARCHAR(100),
  budget DECIMAL(15,2) DEFAULT 0,
  spent DECIMAL(15,2) DEFAULT 0,
  status ENUM('planned','ongoing','completed','suspended') DEFAULT 'planned',
  progress INT DEFAULT 0,
  start_date DATE,
  expected_completion DATE,
  actual_completion DATE,
  contractor_name VARCHAR(255),
  location VARCHAR(500),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ward_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label_en VARCHAR(255),
  label_np VARCHAR(255),
  value VARCHAR(255),
  icon VARCHAR(100),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status ENUM('pending','in_progress','resolved') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status ENUM('unread','read') DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);