# Cortex / voxel / Cortex Verifier

Canonical current H1.1 form:

```text
[c[v[
    (),
    {},
    ()
]]cv]
```

## Directional parse

```text
c[v[    Cortex enters voxel
()      state entering voxel
{}      local voxel / verification context / working volume
()      state emerging from voxel
]]      close / leave voxel
cv      Cortex Verifier before exit
```

The ingress `v` means **voxel**.
The egress `cv` means **Cortex Verifier**.

## Exit law

```text
CORTEX
  -> VOXEL
  -> WORK
  -> EMERGENT STATE
  -> CLOSE VOXEL
  -> CV
  -> PASS | VETO
```

CV receives the actual transition and returns a verdict/receipt to Cortex. The verifier is not the voxel and the voxel is not the verifier.
