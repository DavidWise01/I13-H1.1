import unittest
from pathlib import Path

from scripts.corpus_browser_stage14_3 import build_browser_manifest


ROOT = Path(__file__).resolve().parents[1]
CORPUS = ROOT / 'corpus/h1.1-corpus.jsonl'
WORLD = ROOT / 'corpus/maps/WORLD-IV-SONIA.json'


class Stage143BrowserManifestTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = build_browser_manifest(CORPUS, WORLD)

    def test_baseline_counts_match_stage_14_2(self):
        c = self.manifest['counts']
        self.assertEqual(c['nodes'], 54)
        self.assertEqual(c['edges'], 187)
        self.assertEqual(c['directed_edges'], 374)
        self.assertEqual(c['world_steps'], 9)

    def test_ordinals_match_build_rs_lexical_id_order(self):
        nodes = self.manifest['nodes']
        self.assertEqual([node['id'] for node in nodes], sorted(node['id'] for node in nodes))
        self.assertEqual([node['ordinal'] for node in nodes], list(range(len(nodes))))

    def test_ology_addresses_are_unique_and_32_bit(self):
        addresses = [node['address'] for node in self.manifest['nodes']]
        self.assertEqual(len(addresses), len(set(addresses)))
        self.assertTrue(all(0 <= address <= 0xFFFFFFFF for address in addresses))

    def test_vogel_never_claims_evidence(self):
        vogel = [node for node in self.manifest['nodes'] if 'vogel' in node['v']]
        self.assertTrue(vogel)
        self.assertTrue(all(not node['evidence'] for node in vogel))

    def test_world_iv_route_is_preserved_as_metadata(self):
        route = self.manifest['world_path']['path']
        self.assertEqual(route[0], 'sonia-001')
        self.assertEqual(route[-1], 'fractal-007')
        self.assertEqual(len(route), 10)
        ids = {node['id'] for node in self.manifest['nodes']}
        self.assertTrue(set(route) <= ids)

    def test_fingerprints_are_present(self):
        self.assertNotEqual(self.manifest['fingerprints']['corpus'], 0)
        self.assertNotEqual(self.manifest['fingerprints']['world'], 0)


if __name__ == '__main__':
    unittest.main()
