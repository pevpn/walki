
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
$room = $_POST['room'];
$file = $_FILES['file'];
$target = "../uploads/" . time() . "_" . basename($file['name']);
move_uploaded_file($file['tmp_name'], $target);
$stmt = $db->prepare("INSERT INTO uploads (user_id, file_path, room, type) VALUES (?, ?, ?, ?)");
$stmt->execute([$decoded->id, $target, $room, mime_content_type($target)]);
echo json_encode(["status" => "uploaded"]);
