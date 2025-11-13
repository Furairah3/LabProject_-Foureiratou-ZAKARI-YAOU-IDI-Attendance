<?php
$servername = "localhost";
$username = "root";  // default for XAMPP
$password = "";      // leave blank unless you set one
$database = "database";  // your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "✅ Connected successfully!";
?>
