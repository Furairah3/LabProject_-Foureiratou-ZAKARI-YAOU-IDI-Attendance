<?php
require_once __DIR__ . '/database.php'; // loads $conn

echo "Trying DB connection...<br>";

if ($conn && !$conn->connect_error) {
    echo "Connected to DB successfully.";
} else {
    echo "Connection failed: " . ($conn->connect_error ?? "unknown error");
}
?>
