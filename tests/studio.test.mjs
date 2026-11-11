import test from 'node:test';
import assert from 'node:assert/strict';
import { paragraphDiff, novelpiaText } from '../site/studio.mjs';

test('문단 비교는 추가·삭제·유지를 구분한다', () => {
  assert.deepEqual(paragraphDiff('가\n\n나\n\n다', '가\n\n라\n\n다'), [['same', '가'], ['del', '나'], ['add', '라'], ['same', '다']]);
});

test('노벨피아 복사본은 굵게·인용 기호를 빼고 장면 전환을 통일한다', () => {
  assert.equal(novelpiaText({ title: '1화', text: '**안녕**\n\n---\n\n> 인용' }), '1화\n\n안녕\n\n* * *\n\n인용\n');
});
