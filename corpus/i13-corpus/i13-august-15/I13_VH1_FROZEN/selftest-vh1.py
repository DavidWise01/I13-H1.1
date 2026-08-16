#!/usr/bin/env python3
from vh1 import *
import math, json

rows=[]
def t(name, cond, detail=""):
    rows.append({"name":name,"pass":bool(cond),"detail":detail})

# 1 width ladder
ladder=[width(n) for n in range(5)]
t("ternary width ladder", ladder==[1,3,9,27,81], str(ladder))

# 2 basis cardinality / roundtrip at max width
b=basis(4)
ok=len(b)==81 and len(set(b))==81 and all(index_to_digits(digits_to_index(x),4)==x for x in b)
t("81-state basis", ok, f"count={len(b)}")

# 3 Hermitian gate
bad=[[0,1,0],[0,0,0],[0,0,0]]
try:
    LocalTerm.make(0,bad); ok=False
except ValueError:
    ok=True
t("non-Hermitian local term rejected",ok)

# 4 one-site action
psi=[1+0j,0j,0j]
out=apply_local(psi,1,0,X3)
t("local qutrit operator", out==[0j,1+0j,0j], str(out))

# 5 pair action dimensions
psi=[0j]*9; psi[0]=1
out=apply_pair(psi,2,0,1,ZZ9)
t("two-site 9x9 coupling",len(out)==9 and out[0]==1+0j,f"out0={out[0]}")

# 6 max-depth factored H
h=Hamiltonian(4)
for s in range(4): h.add_local(s,Z3,0.25*(s+1))
for s in range(3): h.add_pair(s,s+1,ZZ9,0.1)
psi=[0j]*81; psi[0]=1+0j
hv=h.apply(psi)
t("81-width Hamiltonian action",len(hv)==81 and h.dense_shape==(81,81),f"shape={h.dense_shape} terms={len(h.local_terms)+len(h.pair_terms)}")

# 7 Hermitian expectation is real for normalized sample state
psi=[0j]*81; psi[0]=1/math.sqrt(2); psi[-1]=1j/math.sqrt(2)
e=h.expectation(psi)
t("Hermitian expectation witness",abs(e.imag)<1e-10,f"expectation={e}")

# 8 ephemeral child terminates
rt=CortexVH1(); r=rt.execute(4,psi,h)
t("ephemeral Cortex child",r["terminated"] and rt.active_children==0 and r["freeze"]=="VH1",f"child={r['child_id']} active={rt.active_children}")

# 9 no dense 81x81 materialization
# Reference runtime only stores 3x3 and 9x9 factored terms.
t("factored not dense",r["dense_materialized"] is False and r["dense_shape"]==(81,81),str(r["dense_shape"]))

# 10 depth bound
try:
    width(5); ok=False
except ValueError:
    ok=True
t("VH1 max depth bound",ok,"n<=4")

passed=sum(x['pass'] for x in rows)
print(json.dumps({"freeze":"VH1","passed":passed,"total":len(rows),"pass":passed==len(rows),"tests":rows},indent=2,default=str))
raise SystemExit(0 if passed==len(rows) else 1)
