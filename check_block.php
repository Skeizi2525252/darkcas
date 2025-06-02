<?php
header('Content-Type: application/json');

// Подключение к базе данных
$db = new SQLite3('users.db');

// Получение user_id из сессии или куки
session_start();
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

if (!$user_id) {
    echo json_encode(['blocked' => false]);
    exit;
}

// Проверка блокировки
$stmt = $db->prepare('SELECT is_blocked FROM users WHERE user_id = :user_id');
$stmt->bindValue(':user_id', $user_id, SQLITE3_INTEGER);
$result = $stmt->execute();
$row = $result->fetchArray();

echo json_encode(['blocked' => $row && $row['is_blocked'] == 1]);
?> 