#!/usr/bin/env python3
from pulse_v01 import run, parse, PulseError

rows=[]
def t(name, fn):
    try:
        detail=fn(); rows.append((True,name,detail or "PASS"))
    except Exception as e:
        rows.append((False,name,f"{type(e).__name__}: {e}"))

def crossing():
    r=run("let s = 120 ... let t = 10 ... let w = 2 ... pulse x = transition(s,t,w) ... emit x ...")
    assert r["emitted"] == [260.0]
    return "130 > 128 → 260"
t("threshold crossing", crossing)

def exact_boundary():
    r=run("pulse x = transition(120,8,2) ... emit x ...")
    assert r["emitted"] == [None]
    return "128 is not > 128 → none"
t("exact boundary", exact_boundary)

def below():
    r=run("pulse x = transition(100,10,3) ... emit x ...")
    assert r["emitted"] == [None]
    return "110 → none"
t("below boundary", below)

def delim():
    assert len(parse("let x = 1 ... emit x ...")) == 2
    return "... splits 2 statements"
t("triple-period delimiter", delim)

def reserved():
    try:
        parse("let x = 1 ..")
    except PulseError as e:
        assert "reserved" in str(e)
        return ".. rejected/reserved"
    raise AssertionError(".. unexpectedly accepted")
t("double-period reserved", reserved)

def terminate():
    try:
        parse("emit 1")
    except PulseError as e:
        assert "unterminated" in str(e)
        return "missing ... rejected"
    raise AssertionError("unterminated statement accepted")
t("hard delimiter required", terminate)

def deterministic():
    s="let s=120 ... let t=10 ... let w=2 ... pulse x=transition(s,t,w) ... emit x ..."
    assert run(s)==run(s)
    return "identical result/trace"
t("deterministic execution", deterministic)

passed=sum(1 for ok,_,_ in rows if ok)
print(f"Pulse v0.1: {passed}/{len(rows)} {'PASS' if passed==len(rows) else 'FAIL'}")
for ok,name,detail in rows:
    print(f"{'PASS' if ok else 'FAIL'}  {name}\n      {detail}")
raise SystemExit(0 if passed==len(rows) else 1)
