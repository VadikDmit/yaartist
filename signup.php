<?php
// Приём заявок с формы «Записаться на пробное занятие» на хостинге Рег.ру.
// Доступен по адресу /api/signup (см. .htaccess) — тот же адрес, что использует js/main.js.
// Письмо уходит через почтовый сервер хостинга (функция mail()), пароль от ящика не нужен.

const MAIL_TO   = 'ya@yaartist.com';
const MAIL_FROM = 'ya@yaartist.com';
// Действующая редакция согласия на обработку ПД (страница /consent)
const CONSENT_VERSION = '2026-10-15';
const CONSENT_URL = 'https://yaartist.com/consent';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function reply(int $code, array $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function clean($v, int $max): string {
    $v = is_scalar($v) ? (string) $v : '';
    $v = trim(preg_replace('/[\r\n\t]+/u', ' ', $v));
    return mb_substr($v, 0, $max, 'UTF-8');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(405, ['success' => false, 'message' => 'Method not allowed']);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) $body = $_POST;

// Скрытое поле-ловушка: люди его не видят, боты заполняют — отвечаем «успехом» и ничего не шлём
if (clean($body['_honey'] ?? '', 200) !== '') reply(200, ['success' => true]);

$f = [
    'name'  => clean($body['name']  ?? '', 100),
    'child' => clean($body['child'] ?? '', 100),
    'age'   => clean($body['age']   ?? '', 20),
    'phone' => clean($body['phone'] ?? '', 30),
    'group' => clean($body['group'] ?? '', 100),
];
if ($f['name'] === '' || strlen(preg_replace('/\D/', '', $f['phone'])) < 10) {
    reply(400, ['success' => false, 'message' => 'Укажите имя и телефон']);
}

// Без согласия на обработку ПД заявку не принимаем; время — серверное, при приёме заявки
if (($body['consent'] ?? null) !== true) {
    reply(400, ['success' => false, 'message' => 'Необходимо согласие на обработку персональных данных']);
}
$consentAt = new DateTimeImmutable('now', new DateTimeZone('Europe/Samara'));
$sentVersion = clean($body['consentVersion'] ?? '', 20);
$consentVersionNote = $sentVersion === CONSENT_VERSION
    ? 'редакция от ' . CONSENT_VERSION . ' (' . CONSENT_URL . ')'
    : 'редакция на сайте ' . CONSENT_VERSION . ' (' . CONSENT_URL . '); в форме передано: ' . ($sentVersion !== '' ? $sentVersion : 'не указано');

// Простая защита от частых отправок: не больше 5 заявок с одного IP за 10 минут
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/yaartist_signup_' . md5($ip);
$now = time();
$hits = array_filter(
    is_file($rateFile) ? array_map('intval', explode(',', (string) file_get_contents($rateFile))) : [],
    fn($t) => $t > $now - 600
);
if (count($hits) >= 5) reply(429, ['success' => false, 'message' => 'Слишком много заявок, попробуйте позже']);
$hits[] = $now;
@file_put_contents($rateFile, implode(',', $hits));

$rows = [
    'Имя родителя'    => $f['name'],
    'Имя ребёнка'     => $f['child'] !== '' ? $f['child'] : '—',
    'Возраст ребёнка' => $f['age'] !== '' ? $f['age'] : '—',
    'Телефон'         => $f['phone'],
    'Группа'          => $f['group'] !== '' ? $f['group'] : 'Не выбрана',
    'Согласие на обработку ПД' => 'Получено: отмечен чекбокс в форме записи',
    'Дата и время согласия'    => $consentAt->format('d.m.Y H:i:s') . ' (Ижевск, UTC+4) · ' . $consentAt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\\TH:i:s\\Z'),
    'Версия текста согласия'   => $consentVersionNote,
];
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

$html = '<h2 style="font-family:Arial,sans-serif;margin:0 0 12px">Заявка на пробное занятие</h2>'
      . '<table cellpadding="8" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:15px">';
foreach ($rows as $k => $v) {
    $html .= '<tr><td style="border:1px solid #ddd;font-weight:bold">' . $e($k) . '</td>'
           . '<td style="border:1px solid #ddd">' . $e($v) . '</td></tr>';
}
$html .= '</table><p style="font-family:Arial,sans-serif;color:#888;font-size:13px">Отправлено с сайта yaartist.com</p>';

$subject = '=?UTF-8?B?' . base64_encode('Заявка на пробное занятие — ' . $f['name']) . '?=';
$fromName = '=?UTF-8?B?' . base64_encode('Сайт ЯАртист') . '?=';
$headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    'From: ' . $fromName . ' <' . MAIL_FROM . '>',
]);

$ok = mail(MAIL_TO, $subject, chunk_split(base64_encode($html)), $headers, '-f' . MAIL_FROM);

if (!$ok) {
    error_log('yaartist signup: mail() вернул false');
    reply(502, ['success' => false, 'message' => 'Не удалось отправить письмо']);
}
reply(200, ['success' => true]);
