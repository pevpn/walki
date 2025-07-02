<?php
require __DIR__ . '/vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;

class WalkieTalkie implements MessageComponentInterface {
    protected $clients;
    protected $users;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->users = [];
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        
        if (!$data) return;

        switch ($data['type']) {
            case 'register':
                $this->users[$from->resourceId] = [
                    'id' => $from->resourceId,
                    'name' => $data['name'],
                    'role' => $data['role'],
                    'channel' => $data['channel'] ?? 'main'
                ];
                $this->broadcastUserList();
                break;

            case 'audio':
                if (isset($this->users[$from->resourceId])) {
                    $user = $this->users[$from->resourceId];
                    $this->broadcastToChannel($user['channel'], [
                        'type' => 'audio',
                        'sender' => $user['name'],
                        'audioData' => $data['audioData'],
                        'timestamp' => date('Y-m-d H:i:s')
                    ]);
                }
                break;

            case 'change_channel':
                if (isset($this->users[$from->resourceId])) {
                    $this->users[$from->resourceId]['channel'] = $data['channel'];
                    $this->broadcastUserList();
                }
                break;
        }
    }

    public function onClose(ConnectionInterface $conn) {
        unset($this->users[$conn->resourceId]);
        $this->clients->detach($conn);
        $this->broadcastUserList();
        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }

    private function broadcastUserList() {
        $userList = array_values($this->users);
        foreach ($this->clients as $client) {
            $client->send(json_encode([
                'type' => 'user_list',
                'users' => $userList
            ]));
        }
    }

    private function broadcastToChannel($channel, $message) {
        foreach ($this->users as $id => $user) {
            if ($user['channel'] === $channel) {
                foreach ($this->clients as $client) {
                    if ($client->resourceId === $id) {
                        $client->send(json_encode($message));
                    }
                }
            }
        }
    }
}

$server = IoServer::factory(
    new WsServer(new WalkieTalkie()),
    8080
);

echo "Server running on port 8080\n";
$server->run();