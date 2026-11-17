function tlv(id, value) {
  const text = String(value ?? '');
  return `${id}${String(text.length).padStart(2, '0')}${text}`;
}

function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xffff;
      else crc = (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function pixText(value, max) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, max) || 'NA';
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function isValidCpf(digits) {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;
  const calc = (size) => {
    let sum = 0;
    for (let i = 0; i < size; i += 1) sum += Number(digits[i]) * ((size + 1) - i);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

function isValidCnpj(digits) {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;
  const calc = (size) => {
    const weights = size === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, weight, index) => acc + Number(digits[index]) * weight, 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  return calc(12) === Number(digits[12]) && calc(13) === Number(digits[13]);
}

/** Chave no formato exigido pelo Banco Central. */
export function normalizePixKey(raw) {
  const key = String(raw || '').trim();
  if (!key) return '';
  if (key.includes('@')) return key.toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) {
    return key.toLowerCase();
  }

  const digits = onlyDigits(key);
  if (digits.length === 14 && isValidCnpj(digits)) return digits;
  if (digits.length === 11 && isValidCpf(digits)) return digits;

  const looksLikePhone = key.startsWith('+') || /[()]/.test(key) || /\s/.test(key);
  if (key.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return `+${digits}`;
  if (looksLikePhone || digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return digits || key;
}

/** BR Code estático (EMV) aceito pelos apps de banco. */
export function buildPixPayload({ key, name, city, amount }) {
  const pixKey = normalizePixKey(key);
  if (!pixKey) throw new Error('Cadastre a chave Pix da loja.');
  const value = Number(amount) || 0;
  const merchant = tlv('00', 'br.gov.bcb.pix') + tlv('01', pixKey);
  const fields = [
    tlv('00', '01'),
    tlv('26', merchant),
    tlv('52', '0000'),
    tlv('53', '986'),
  ];
  if (value > 0) fields.push(tlv('54', value.toFixed(2)));
  fields.push(
    tlv('58', 'BR'),
    tlv('59', pixText(name, 25)),
    tlv('60', pixText(city, 15)),
    tlv('62', tlv('05', '***')),
    '6304',
  );
  const body = fields.join('');
  return body + crc16(body);
}
