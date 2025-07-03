
<?php
require_once '../config.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = str_replace('Bearer ', '', $auth);
try {
    $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}
$data = json_decode(file_get_contents("php://input"));
$stmt = $db->prepare("INSERT INTO gps_logs (user_id, latitude, longitude) VALUES (?, ?, ?)");
$stmt->execute([$decoded->id, $data->lat, $data->lng]);
echo json_encode(["status" => "saved"]);
