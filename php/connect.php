 <?php
$servername = "localhost";
$username = "u373463971_food_diary";
$password = "10Nothing01.";

// Create connection
$conn = new mysqli($servername, $username, $password);

// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}
echo "Connected successfully";
?> 