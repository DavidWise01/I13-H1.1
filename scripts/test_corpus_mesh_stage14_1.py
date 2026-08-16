import copy
import json
import unittest

from scripts.corpus_mesh_stage14_1 import build_mesh, burrow, neighbors, shortest_path, validate_world_path


def fixture_index():
    records = [
        {"id":"a","root":{"address":1,"x":0,"y":1,"z":0},"domain":["alpha"],"v":["vector"],"evidence_eligible":True},
        {"id":"b","root":{"address":2,"x":0,"y":2,"z":0},"domain":["alpha","bridge"],"v":["vector"],"evidence_eligible":True},
        {"id":"c","root":{"address":3,"x":0,"y":3,"z":0},"domain":["gamma"],"v":["vogel"],"evidence_eligible":False},
        {"id":"d","root":{"address":4,"x":0,"y":4,"z":0},"domain":["delta"],"v":["vector"],"evidence_eligible":True},
    ]
    return {
        "schema":"i13-h1.1-corpus-index/0.1",
        "records":records,
        "indexes":{"domain":{"alpha":["a","b"],"bridge":["b"],"gamma":["c"],"delta":["d"]}},
    }


def world_path():
    return {"world":"IV","target":"Sonia","status":"fixture","path":["b","c","d"],"interpretation":"fixture path"}


class Stage141MeshTests(unittest.TestCase):
    def test_shared_domain_creates_semantic_edge(self):
        mesh = build_mesh(fixture_index())
        n = neighbors(mesh, "a")
        self.assertEqual([x["id"] for x in n], ["b"])
        self.assertEqual(n[0]["shared_domains"], ["alpha"])
        self.assertEqual(n[0]["kinds"], ["domain"])

    def test_world_overlay_bridges_unrelated_domains(self):
        index = fixture_index()
        mesh = build_mesh(index, [world_path()])
        self.assertEqual(shortest_path(mesh, index, "a", "d"), ["a", "b", "c", "d"])
        bc = next(x for x in mesh["edges"] if {x["a"], x["b"]} == {"b", "c"})
        self.assertIn("world_path", bc["kinds"])
        self.assertEqual(bc["world_paths"][0]["label"], "WORLD-IV:Sonia")

    def test_evidence_only_will_not_use_vogel_bridge(self):
        index = fixture_index()
        mesh = build_mesh(index, [world_path()])
        self.assertIsNone(shortest_path(mesh, index, "a", "d", evidence_only=True))
        self.assertEqual(neighbors(mesh, "b", evidence_only=True), [
            {"id":"a","kinds":["domain"],"shared_domains":["alpha"],"world_paths":[],"weight":1,"evidence_eligible":True}
        ])

    def test_burrow_changes_only_local_depth(self):
        index = fixture_index()
        deep = burrow(index, "a", 81)
        self.assertEqual(deep, {"id":"a","address":1,"x":0,"y":1,"z":81})
        self.assertEqual(index["records"][0]["root"]["z"], 0)

    def test_missing_world_path_id_vetoes(self):
        wp = world_path()
        wp["path"] = ["a", "missing"]
        with self.assertRaisesRegex(ValueError, "missing ids"):
            validate_world_path(fixture_index(), wp)

    def test_mesh_is_deterministic(self):
        index = fixture_index()
        a = build_mesh(index, [world_path()])
        shuffled = copy.deepcopy(index)
        shuffled["records"].reverse()
        shuffled["indexes"]["domain"] = dict(reversed(list(shuffled["indexes"]["domain"].items())))
        b = build_mesh(shuffled, [world_path()])
        self.assertEqual(json.dumps(a, sort_keys=True), json.dumps(b, sort_keys=True))


if __name__ == "__main__":
    unittest.main()
