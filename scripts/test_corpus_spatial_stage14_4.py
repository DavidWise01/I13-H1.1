#!/usr/bin/env python3
from __future__ import annotations

import unittest
from pathlib import Path

from scripts.corpus_browser_stage14_3 import build_browser_manifest


CORPUS = Path('corpus/h1.1-corpus.jsonl')
WORLD = Path('corpus/maps/WORLD-IV-SONIA.json')


class Stage144SpatialManifestTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = build_browser_manifest(CORPUS, WORLD)
        cls.nodes = cls.manifest['nodes']
        cls.by_id = {node['id']: node for node in cls.nodes}

    def test_54_unique_surface_roots(self) -> None:
        self.assertEqual(self.manifest['counts']['nodes'], 54)
        self.assertEqual(len({node['id'] for node in self.nodes}), 54)
        self.assertEqual(len({node['address'] for node in self.nodes}), 54)

    def test_surface_coordinates_are_16_bit(self) -> None:
        for node in self.nodes:
            self.assertGreaterEqual(node['x'], 0)
            self.assertLessEqual(node['x'], 0xFFFF)
            self.assertGreaterEqual(node['y'], 0)
            self.assertLessEqual(node['y'], 0xFFFF)

    def test_address_is_exact_x16_y16_pack(self) -> None:
        for node in self.nodes:
            packed = ((node['x'] & 0xFFFF) << 16) | (node['y'] & 0xFFFF)
            self.assertEqual(packed, node['address'])

    def test_world_path_resolves_to_spatial_roots(self) -> None:
        path = self.manifest['world_path']['path']
        self.assertEqual(len(path) - 1, self.manifest['counts']['world_steps'])
        self.assertEqual(self.manifest['counts']['world_steps'], 9)
        for node_id in path:
            self.assertIn(node_id, self.by_id)

    def test_sonia_and_fractint_are_on_same_surface_schema(self) -> None:
        sonia = self.by_id['sonia-001']
        fractint = self.by_id['fractal-007']
        for node in (sonia, fractint):
            packed = (node['x'] << 16) | node['y']
            self.assertEqual(packed, node['address'])

    def test_voxel_depth_remains_local_metadata(self) -> None:
        addressing = self.manifest['addressing']
        self.assertEqual(addressing['surface_bits'], 32)
        self.assertEqual(addressing['layout'], 'x:16|y:16')
        self.assertIn('local', addressing['voxel_depth'].lower())


if __name__ == '__main__':
    unittest.main()
