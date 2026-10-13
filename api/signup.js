// Приём заявок с формы «Записаться на пробное занятие».
// Работает как серверная функция Vercel по адресу /api/signup и отправляет письмо
// через почту Рег.ру (SMTP), поэтому форма не зависит от зарубежных сервисов.
//
// Переменные окружения (Vercel → Settings → Environment Variables):
//   SMTP_USER — почтовый ящик, от имени которого уходит письмо (ya@yaartist.com)
//   SMTP_PASS — пароль от этого ящика
//   SMTP_HOST — необязательно, по умолчанию mail.hosting.reg.ru
//   SMTP_PORT — необязательно, по умолчанию 465 (SSL)
//   MAIL_TO   — необязательно, куда присылать заявки (по умолчанию SMTP_USER)

const nodemailer = require('nodemailer');

const clean = (v, max) => String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const body = readBody(req);

  // Скрытое поле-ловушка: люди его не видят, боты заполняют — отвечаем «успехом» и ничего не шлём
  if (clean(body._honey, 200)) return res.status(200).json({ success: true });

  const fields = {
    name: clean(body.name, 100),
    age: clean(body.age, 20),
    phone: clean(body.phone, 30),
    group: clean(body.group, 100)
  };
  if (!fields.name || fields.phone.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ success: false, message: 'Укажите имя и телефон' });
  }

  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    console.error('signup: SMTP_USER / SMTP_PASS не заданы');
    return res.status(500).json({ success: false, message: 'Почта не настроена' });
  }

  const rows = [
    ['Имя', fields.name],
    ['Возраст ребёнка', fields.age || '—'],
    ['Телефон', fields.phone],
    ['Группа', fields.group || 'Не выбрана']
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html =
    '<h2 style="font-family:Arial,sans-serif;margin:0 0 12px">Заявка на пробное занятие</h2>' +
    '<table cellpadding="8" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:15px">' +
    rows.map(([k, v]) => `<tr><td style="border:1px solid #ddd;font-weight:bold">${k}</td><td style="border:1px solid #ddd">${escapeHtml(v)}</td></tr>`).join('') +
    '</table><p style="font-family:Arial,sans-serif;color:#888;font-size:13px">Отправлено с сайта yaartist.com</p>';

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.hosting.reg.ru',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  try {
    await transporter.sendMail({
      from: `"Сайт ЯАртист" <${SMTP_USER}>`,
      to: process.env.MAIL_TO || SMTP_USER,
      subject: `Заявка на пробное занятие — ${fields.name}`,
      text,
      html
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('signup: ошибка отправки письма:', err && err.message);
    return res.status(502).json({ success: false, message: 'Не удалось отправить письмо' });
  }
};
