import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import build_views  # noqa: E402
import export_novelpia  # noqa: E402

REAL_ROOT = Path(__file__).resolve().parents[1]


class BuildTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        for name in ['content', 'manuscripts', 'prompts']:
            shutil.copytree(REAL_ROOT / name, self.tmp / name)
        (self.tmp / 'site').mkdir()
        self.old_root, build_views.ROOT = build_views.ROOT, self.tmp

    def tearDown(self):
        build_views.ROOT = self.old_root
        shutil.rmtree(self.tmp)

    def write(self, rel, text):
        path = self.tmp / rel
        path.write_text(text, encoding='utf-8')

    def test_sample_data(self):
        data = build_views.build()
        self.assertEqual([e['id'] for e in data['episodes']], ['EP01', 'EP02'])
        self.assertEqual({x['id'] for x in data['experiences']}, {'001', '002'})
        self.assertEqual(len(data['prompts']), 4)
        self.assertTrue((self.tmp / 'site/data/project.json').exists())

    def test_chapter_counts_and_versions(self):
        self.write('manuscripts/current/EP01-01.md', '---\nstatus: 검수\n---\n# 파리의 저녁\n\n첫 문단.\n\n* * *\n\n**둘째** 문단.\n')
        self.write('manuscripts/archive/EP01-01.v1.md', '# 파리의 저녁\n\n첫 문단.\n')
        ch = build_views.build()['chapters'][0]
        self.assertEqual((ch['episode'], ch['number'], ch['status']), ('EP01', 1, '검수'))
        self.assertEqual(ch['characters'], len('첫 문단.\n\n* * *\n\n**둘째** 문단.'))
        self.assertEqual(ch['versions'][0]['label'], 'v1')
        self.assertEqual(export_novelpia.novelpia_text(ch), '파리의 저녁\n\n첫 문단.\n\n* * *\n\n둘째 문단.\n')

    def test_rejects_bad_chapter_name(self):
        self.write('manuscripts/current/paris.md', '# 제목\n\n본문')
        with self.assertRaisesRegex(ValueError, 'EP01-01'):
            build_views.build()

    def test_rejects_unknown_episode(self):
        self.write('manuscripts/current/EP09-01.md', '# 제목\n\n본문')
        with self.assertRaisesRegex(ValueError, 'EP09'):
            build_views.build()

    def test_rejects_unknown_stage_and_source(self):
        path = self.tmp / 'content/episodes/ep01-paris.md'
        path.write_text(path.read_text(encoding='utf-8').replace('stage: 소재', 'stage: 완료'), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'stage'):
            build_views.build()

    def test_rejects_empty_body(self):
        self.write('manuscripts/current/EP01-01.md', '# 제목만\n')
        with self.assertRaisesRegex(ValueError, '비어'):
            build_views.build()


if __name__ == '__main__':
    unittest.main()
