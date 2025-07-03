
<?php
require_once '../config.php';
$data = json_decode(file_get_contents("php://input"));
$username = $data->username;
$password = password_hash($data->password, PASSWORD_BCRYPT);
$stmt = $db->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
try {
    $stmt->execute([$username, $password]);
    echo json_encode(["status" => "ok"]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["error" => "User exists"]);
}
