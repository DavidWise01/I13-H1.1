use serde_json::Value;
use std::collections::{BTreeMap, HashMap};
use std::env;
use std::fmt::Write as _;
use std::fs;
use std::path::PathBuf;

const EDGE_DOMAIN: u8 = 0x01;
const EDGE_WORLD: u8 = 0x02;

#[derive(Clone, Debug)]
struct Record {
    id: String,
    address: u32,
    evidence: bool,
    domains: Vec<String>,
}

#[derive(Clone, Copy, Debug, Default)]
struct EdgeMeta {
    domain_count: u8,
    world_count: u8,
}

#[derive(Clone, Copy, Debug)]
struct Adj {
    neighbor: usize,
    flags: u8,
    weight: u8,
}

fn fnv1a32(bytes: &[u8]) -> u32 {
    let mut hash = 0x811c_9dc5u32;
    for byte in bytes {
        hash ^= *byte as u32;
        hash = hash.wrapping_mul(0x0100_0193);
    }
    hash
}

fn string_field<'a>(value: &'a Value, key: &str, context: &str) -> &'a str {
    value.get(key)
        .and_then(Value::as_str)
        .unwrap_or_else(|| panic!("{context}: missing string field {key}"))
}

fn string_array(value: &Value, key: &str, context: &str) -> Vec<String> {
    value.get(key)
        .and_then(Value::as_array)
        .unwrap_or_else(|| panic!("{context}: missing array field {key}"))
        .iter()
        .map(|v| v.as_str().unwrap_or_else(|| panic!("{context}: {key} must contain strings")).to_owned())
        .collect()
}

fn main() {
    let manifest = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"));
    let corpus_path = manifest.join("corpus/h1.1-corpus.jsonl");
    let world_path = manifest.join("corpus/maps/WORLD-IV-SONIA.json");
    println!("cargo:rerun-if-changed={}", corpus_path.display());
    println!("cargo:rerun-if-changed={}", world_path.display());

    let corpus_text = fs::read_to_string(&corpus_path).expect("read corpus JSONL");
    let world_text = fs::read_to_string(&world_path).expect("read World IV path");

    let mut records = Vec::new();
    let mut address_owner: HashMap<u32, String> = HashMap::new();
    let mut id_seen: HashMap<String, usize> = HashMap::new();

    for (line_index, raw) in corpus_text.lines().enumerate() {
        if raw.trim().is_empty() {
            continue;
        }
        let context = format!("corpus line {}", line_index + 1);
        let value: Value = serde_json::from_str(raw).unwrap_or_else(|e| panic!("{context}: {e}"));
        let id = string_field(&value, "id", &context).to_owned();
        let domains = string_array(&value, "domain", &context);
        if domains.is_empty() {
            panic!("{context}: domain must not be empty");
        }
        let v_tags = string_array(&value, "v", &context);
        let seriousness = value.get("seriousness")
            .and_then(Value::as_i64)
            .unwrap_or_else(|| panic!("{context}: seriousness must be integer"));
        let source_origin = string_field(&value, "source_origin", &context);
        let url = string_field(&value, "url", &context);
        if source_origin.trim().is_empty() || !(url.starts_with("https://") || url.starts_with("http://")) {
            panic!("{context}: provenance missing");
        }

        *id_seen.entry(id.clone()).or_default() += 1;
        let address = fnv1a32(id.as_bytes());
        if let Some(previous) = address_owner.insert(address, id.clone()) {
            panic!("OLOGY address collision: {previous} and {id} -> {address:#010x}");
        }
        let evidence = seriousness == 0 && !v_tags.iter().any(|tag| tag == "vogel");
        records.push(Record { id, address, evidence, domains });
    }

    if let Some((id, _)) = id_seen.iter().find(|(_, count)| **count != 1) {
        panic!("duplicate canonical corpus id: {id}");
    }

    records.sort_by(|a, b| a.id.cmp(&b.id));
    if records.len() > u16::MAX as usize {
        panic!("Stage 14.2 compact ordinal space is u16; corpus has {} nodes", records.len());
    }

    let ordinal: BTreeMap<String, usize> = records.iter().enumerate().map(|(i, r)| (r.id.clone(), i)).collect();
    let mut domain_members: BTreeMap<String, Vec<usize>> = BTreeMap::new();
    for (index, record) in records.iter().enumerate() {
        for domain in &record.domains {
            domain_members.entry(domain.clone()).or_default().push(index);
        }
    }

    let mut edges: BTreeMap<(usize, usize), EdgeMeta> = BTreeMap::new();
    for members in domain_members.values_mut() {
        members.sort_unstable();
        members.dedup();
        for a_index in 0..members.len() {
            for b_index in (a_index + 1)..members.len() {
                let a = members[a_index];
                let b = members[b_index];
                let slot = edges.entry((a.min(b), a.max(b))).or_default();
                slot.domain_count = slot.domain_count.checked_add(1).expect("domain edge weight overflow");
            }
        }
    }

    let world: Value = serde_json::from_str(&world_text).expect("parse World IV JSON");
    let world_ids = world.get("path")
        .and_then(Value::as_array)
        .expect("World IV path array")
        .iter()
        .map(|v| v.as_str().expect("World IV path ids must be strings"))
        .collect::<Vec<_>>();
    if world_ids.len() < 2 {
        panic!("World IV path must contain at least two ids");
    }
    for pair in world_ids.windows(2) {
        let a = *ordinal.get(pair[0]).unwrap_or_else(|| panic!("World IV missing corpus id {}", pair[0]));
        let b = *ordinal.get(pair[1]).unwrap_or_else(|| panic!("World IV missing corpus id {}", pair[1]));
        let slot = edges.entry((a.min(b), a.max(b))).or_default();
        slot.world_count = slot.world_count.checked_add(1).expect("world edge weight overflow");
    }

    let mut adjacency = vec![Vec::<Adj>::new(); records.len()];
    for (&(a, b), meta) in &edges {
        let flags = (if meta.domain_count > 0 { EDGE_DOMAIN } else { 0 })
            | (if meta.world_count > 0 { EDGE_WORLD } else { 0 });
        let weight = meta.domain_count
            .checked_add(meta.world_count.checked_mul(4).expect("world weight overflow"))
            .expect("edge weight overflow");
        adjacency[a].push(Adj { neighbor: b, flags, weight });
        adjacency[b].push(Adj { neighbor: a, flags, weight });
    }

    for list in &mut adjacency {
        list.sort_by(|a, b| {
            b.weight.cmp(&a.weight)
                .then_with(|| records[a.neighbor].id.cmp(&records[b.neighbor].id))
        });
    }

    let mut offsets = Vec::<u16>::with_capacity(records.len() + 1);
    let mut neighbors = Vec::<u16>::new();
    let mut flags = Vec::<u8>::new();
    let mut weights = Vec::<u8>::new();
    offsets.push(0);
    for list in &adjacency {
        for edge in list {
            neighbors.push(edge.neighbor as u16);
            flags.push(edge.flags);
            weights.push(edge.weight);
        }
        offsets.push(u16::try_from(neighbors.len()).expect("directed adjacency exceeds u16"));
    }

    let addresses = records.iter().map(|r| r.address).collect::<Vec<_>>();
    let evidence = records.iter().map(|r| if r.evidence { 1u8 } else { 0u8 }).collect::<Vec<_>>();
    let corpus_fingerprint = fnv1a32(corpus_text.as_bytes());
    let world_fingerprint = fnv1a32(world_text.as_bytes());
    let world_steps = world_ids.len() - 1;

    let mut generated = String::new();
    writeln!(generated, "// @generated by build.rs from the verified H1.1 corpus. Do not edit.").unwrap();
    writeln!(generated, "pub const NODE_COUNT: usize = {};", records.len()).unwrap();
    writeln!(generated, "pub const EDGE_COUNT: usize = {};", edges.len()).unwrap();
    writeln!(generated, "pub const DIRECTED_EDGE_COUNT: usize = {};", neighbors.len()).unwrap();
    writeln!(generated, "pub const WORLD_STEP_COUNT: usize = {world_steps};").unwrap();
    writeln!(generated, "pub const CORPUS_FINGERPRINT: u32 = 0x{corpus_fingerprint:08x};").unwrap();
    writeln!(generated, "pub const WORLD_FINGERPRINT: u32 = 0x{world_fingerprint:08x};").unwrap();
    writeln!(generated, "pub static NODE_ADDRESSES: [u32; {}] = {:?};", addresses.len(), addresses).unwrap();
    writeln!(generated, "pub static NODE_EVIDENCE: [u8; {}] = {:?};", evidence.len(), evidence).unwrap();
    writeln!(generated, "pub static OFFSETS: [u16; {}] = {:?};", offsets.len(), offsets).unwrap();
    writeln!(generated, "pub static NEIGHBORS: [u16; {}] = {:?};", neighbors.len(), neighbors).unwrap();
    writeln!(generated, "pub static EDGE_FLAGS: [u8; {}] = {:?};", flags.len(), flags).unwrap();
    writeln!(generated, "pub static EDGE_WEIGHTS: [u8; {}] = {:?};", weights.len(), weights).unwrap();
    writeln!(generated, "pub mod arrival {{ include!(concat!(env!(\"CARGO_MANIFEST_DIR\"), \"/src/arrival.rs\")); }}").unwrap();

    let out_dir = PathBuf::from(env::var("OUT_DIR").expect("OUT_DIR"));
    fs::write(out_dir.join("corpus_mesh_generated.rs"), generated).expect("write generated corpus mesh");
}