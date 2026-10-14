function tlv(id, value) {
  const text = String(value ?? '');
  return `${id}${String(text.length).padStart(2, '0')}${text}`;
}

function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
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

/** BR Code estático (EMV) aceito pelos apps de banco. */
export function buildPixPayload({ key, name, city, amount, txid = '***' }) {
  const pixKey = String(key || '').trim();
  if (!pixKey) throw new Error('Cadastre a chave Pix da loja.');
  const value = (Number(amount) || 0).toFixed(2);
  const merchant = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', pixKey);
  const additional = tlv('05', String(txid).replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***');
  const body = [
    tlv('00', '01'),
    tlv('26', merchant),
    tlv('52', '0000'),
    tlv('53', '986'),
    tlv('54', value),
    tlv('58', 'BR'),
    tlv('59', pixText(name, 25)),
    tlv('60', pixText(city, 15)),
    tlv('62', additional),
    '6304',
  ].join('');
  return body + crc16(body);
}
