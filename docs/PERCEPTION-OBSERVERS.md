# I13 Perception Observer Lens

Status: **ARCHITECTURAL LENS · NON-RIVER · EXECUTABLE WITNESS**

ID: `I13-PERCEPTION-OBSERVERS-0.1`

This lens distills three separate ideas without merging them:

```text
EMPEDOCLES
correspondence / like-by-like

BENTHAM / FOUCAULT
asymmetric observation

I13 EXTENSION
observation itself may be observed
```

## Distilled relation

Empedocles is used here for the structural idea that perception depends on a correspondence between perceiver and perceived.

```text
PERCEIVED FORM <-> PERCEIVER FORM
```

The project does not treat correspondence as identity or truth.

## Observation chain

The Panopticon was Jeremy Bentham's design; Michel Foucault used it as a model for disciplinary power and hierarchical observation.

The distilled chain is:

```text
SOURCE / SUBJECT
      |
      v
  OBSERVER 1
      |
      v
  OBSERVER 2
```

Observer 2 changes the structure because the first observer's act/report is now itself observable.

```text
SUBJECT -> OBSERVER 1 -> OBSERVER 2
```

This does **not** imply that Observer 2 directly perceived the source.

```text
OBSERVER2_REPORT         = witnessed Observer 1
OBSERVER2_DIRECT_SOURCE  = 0
```

## I13-PERCEPTION-OBSERVERS-001

```text
CORRESPONDENCE IS RELATIONAL,
NOT AUTOMATIC IDENTITY.

OBSERVATION IS A RELATION,
NOT AUTOMATIC TRUTH.

AN OBSERVER MAY ITSELF
BECOME AN OBSERVED SUBJECT.

SECOND-ORDER OBSERVATION
WITNESSES THE FIRST OBSERVER.
IT DOES NOT AUTOMATICALLY
INHERIT DIRECT SOURCE ACCESS.

PROVENANCE MUST SAY
WHO SAW WHAT.
```

## Why the second observer matters

One observer gives:

```text
subject -> observer
```

The observer is structurally privileged.

Adding one more gives:

```text
subject -> observer 1 -> observer 2
```

Now the observation process can itself have provenance.

This is useful below the Plato keystone because it preserves three distinct records:

```text
1. source / subject
2. observer 1 percept or report
3. observer 2 witness of observer 1
```

None automatically collapses into another.

## Executable witness

`corpus/golden/perception_observers.i13` exports:

```text
LIKE_BY_LIKE_OK         = 1
OBSERVER1_REPORT        = 1
OBSERVER2_REPORT        = 1
OBSERVER2_DIRECT_SOURCE = 0
OBSERVER_CHAIN_OK       = 1
PERCEPTION_OBSERVER_OK  = 1
```

This remains a non-river architectural lens. It does not change the five golden river handoffs.
