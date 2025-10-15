<?php
include '/bitewise/php/connect.php';
\
header('Content-Type: application/json');
require __DIR__.'/connect.php'; // gives you $pdo

$in = json_decode(file_get_contents('php://input'), true);
if (!$in) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad json']); exit; }

$stmt = $pdo->prepare(
  'INSERT INTO added_foods (name, barcode, protein, fat, calories, carbs)
   VALUES (?, NULLIF(?, ""), ?, ?, ?, ?)'
);

$stmt->execute([
  trim((string)($in['name'] ?? '')),
  (string)($in['barcode'] ?? ''),
  is_numeric($in['protein'])  ? round($in['protein'],  2) : null,
  is_numeric($in['fat'])      ? round($in['fat'],      2) : null,
  is_numeric($in['calories']) ? (int)$in['calories']      : null,
  is_numeric($in['carbs'])    ? round($in['carbs'],    2) : null,
]);

echo json_encode(['ok'=>true,'id'=>$pdo->lastInsertId()]);

