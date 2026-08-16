---
name: ia-cli-intro
description: Use when the user references the Internet Archive 'ia' command-line tool, ia-cli, bulk upload/download/metadata via CLI, 'ia configure', 'ia upload/download/metadata/search', or wants the operational (not GUI) way to harvest archive.org items. Corpus = the Archive Academy "Introduction Workshop on ia command-line tool" (2021-09-22) ASR transcript + MP3 audio, downloaded from archive.org. The CLI companion to the ia-unofficial-guide skill. Staged in the worktop; also promoted to live ~/.hermes/skills and pushed to the shared I13 repo.
category: reference
---

# ia-cli-intro — Introduction Workshop on the `ia` command-line tool (Archive Academy, 2021-09-22)

Reference skill for the **official Internet Archive `ia` CLI workshop** (Archive
Academy / internetarchivepresents). The *operational* companion to
`ia-unofficial-guide` — where that skill is the GUI/manual, this is the
command-line harvesting tool we actually use to pull corpus into skills.

## Source (archive.org)
- Item: `ia-cli-intro-2021-09-22`
- URL:  https://archive.org/details/ia-cli-intro-2021-09-22
- Collections: internet-archive-staff-presentations, internetarchivepresents,
  theinternetarchive, ArchiveAcademy, whisper_test
- Files in this skill dir:
  - `ia_tool.asr.srt` — ASR transcript of the workshop (~38 KB), grep-able corpus
  - `ia_tool.mp3`      — workshop audio (~20 MB), under GitHub's 100 MB push limit

## What it covers (from the real transcript)
- **`ia configure`** — one-time auth setup; "this Ia configure command and you enter" credentials. Required before write ops.
- **`ia upload`** — upload items/files. Two **required fields**: `identifier` + the
  file to upload. Supports **bulk via spreadsheet**: `ia upload --spreadsheet` reads
  metadata keys from a sheet and uploads all files; re-run to retry **failed uploads**.
- **`ia download`** — download files/collections; "it will always download the latest";
  can download a **collection** or an **external/outgoing manifest**; auto-skips already
  downloaded files; resume **failed downloads**.
- **`ia metadata`** — read AND write metadata; `ia metadata --spreadsheet` to submit
  metadata in bulk (metaxml too). "It can be used to read and write metadata."
- **`ia search`** — "search requires authorization"; outputs items; pair with download.

## How to use
Answer `ia` CLI questions from `ia_tool.asr.srt` (grep). For live harvesting,
combine with the advancedsearch.php / /metadata / /download endpoint patterns the
flay workflow already uses. The transcript is the human walkthrough; the endpoints
are the machine path.

## Notes
- This is the **tooling/operations** layer — high affinity with `flay` and
  `ia-unofficial-guide`. It is the *how-we-harvest* skill for the whole I13 corpus
  pipeline.
- Video (333 MB MP4) was NOT downloaded — over GitHub's 100 MB limit and the
  transcript carries the content. Only transcript + audio staged.
- Staged in worktop; promoted live and pushed to shared I13 repo (no .io touch).

## Verification (LIT, this turn)
- `ia_tool.asr.srt` downloaded: 38,401 bytes, valid SRT (cue/timing format).
- `ia_tool.mp3` downloaded: 20,785,964 bytes, `ID3` magic (494433) confirmed.
