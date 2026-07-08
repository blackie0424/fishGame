import { describe, it, expect } from 'vitest';
import { parseArtJson } from '../../../resources/game/utils/artJson.js';

describe('parseArtJson（後台 art 欄位 → 像素預覽參數）', () => {
  it('合法 JSON：補上 shape/pat 預設值後回傳', () => {
    const a = parseArtJson('{"body":"#3a8a5c","belly":"#dfeee2","acc":"#c1272d"}');
    expect(a.shape).toBe('oval');
    expect(a.pat).toBe('plain');
    expect(a.body).toBe('#3a8a5c');
  });

  it('保留 deep 形狀與選填欄位', () => {
    const a = parseArtJson('{"shape":"deep","body":"#111111","belly":"#222222","acc":"#333333","pat":"bars","tail":"#444444","bigEye":true}');
    expect(a.shape).toBe('deep');
    expect(a.tail).toBe('#444444');
    expect(a.bigEye).toBe(true);
  });

  it('note 等額外欄位不影響解析', () => {
    const a = parseArtJson('{"body":"#111111","belly":"#222222","acc":"#333333","note":"鮮黃蝴蝶魚"}');
    expect(a.body).toBe('#111111');
  });

  it('非法 JSON 回傳 null', () => {
    expect(parseArtJson('{oops')).toBeNull();
    expect(parseArtJson('')).toBeNull();
  });

  it('缺任一必要色碼（body/belly/acc）回傳 null', () => {
    expect(parseArtJson('{"body":"#111111","belly":"#222222"}')).toBeNull();
  });

  it('JSON 不是物件（陣列/字串）回傳 null', () => {
    expect(parseArtJson('[1,2]')).toBeNull();
    expect(parseArtJson('"hi"')).toBeNull();
  });
});
