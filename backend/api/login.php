
<?php
require_once '../config.php';
use \Firebase\JWT\JWT;

$data = json_decode(file_get_contents("php://input"));
$username = $data->username;
$password = $data->password;

$stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($password, $user['password'])) {
    $payload = [
        "id" => $user['id'],
        "username" => $user['username'],
        "role" => $user['role'],
        "exp" => time() + 3600
    ];
    echo json_encode(["token" => JWT::encode($payload, JWT_SECRET, 'HS256')]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Invalid credentials"]);
}
