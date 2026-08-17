# I13 Logic Genealogy · Aristotle Fork

Status: **HISTORICAL GENEALOGY · COUNTERFACTUAL BRANCH MARKED · NON-RIVER**

This document separates the historical trunk from the I13 extrapolation. It does not add I13 syntax and it does not freeze `05_logic`.

## Fork point

The pre-Aristotelian trunk is treated as dialectical practice: question, answer, concession, refutation, contradiction, and judgment across changing subject matter.

```text
PLATO / ACADEMY DIALECTIC
        |
        +-------------------------------+
        |                               |
        |                               |
        v                               v
ARISTOTLE FORK                    DIALECTICAL TRUNK
ANALYTICS / TERM FORM             proposition / conditional line
        |                               |
        v                               v
syllogistic form                 Clinomachus / Eubulidean context
                                        |
                                        v
                                 Diodorus Cronus
                                        |
                                        v
                                      Philo
                                        |
                                        v
                                    Chrysippus
```

Aristotle is therefore marked as a **burrow/fork**, not the sole trunk of Logic.

## Historical distinction

Aristotle's surviving logical achievement is primarily term logic and syllogistic: relations among terms and forms of deduction.

The Dialectical/Megarian-Stoic line developed, apparently independently of Aristotle's core achievement, around whole propositions, conditionals, modalities, paradoxes, and valid argument modes. Diodorus Cronus and Philo are important precursors; Chrysippus built the first large survivingly attested propositional deductive system in that line.

Theophrastus and Eudemus are immediate historical successors to Aristotle, but they are not the clean counterfactual replacement for Aristotle because much of their logical work explicitly extends, revises, or broadens Aristotelian syllogistic.

## Counterfactual: if Aristotle stayed with the dialectical trunk

The following is an I13 extrapolation, not a historical fact.

If Aristotle had never separated out analytics as a distinct study of term-form inference, the next independently viable formalization path is plausibly:

```text
DIALECTIC
   |
   v
PROPOSITION
   |
   v
CONDITIONAL / DISJUNCTION / NEGATION
   |
   v
ARGUMENT MODE
   |
   v
CONSEQUENCE
   |
   v
CHRYSIPPEAN DEDUCTIVE SYSTEM
```

In that counterfactual, the canonical first image of Logic might have been less:

```text
All A are B
C is A
therefore C is B
```

and more:

```text
if P then Q
P
therefore Q
```

The likely consequences for the conceptual shape of Logic are:

1. **Propositions before categories.** Whole asserted states become primitive earlier than subject/predicate term classes.
2. **Transition before taxonomy.** `if / then`, incompatibility, disjunction, and consequence become central earlier than class inclusion.
3. **Paradox as a first-class stress test.** Liar, Sorites, modality, and temporal possibility stay close to the center rather than at the edge.
4. **Argument mode before ontology.** Logic is initially about how one state licenses another, rather than first about what kinds of things terms name.
5. **A more natural local-state reading.** For I13, this branch maps more naturally onto voxel/vector transitions and bounded choice fields than Aristotelian categorical syllogistic does.

## Replacement slot

If one name must occupy the historical **formalizer slot** in the no-Aristotle-analytics counterfactual:

```text
CHRYSIPPUS
```

is the strongest candidate.

Why not Theophrastus? Because his logical corpus is substantially downstream of Aristotle.

Why not Diodorus or Philo? Because they supply crucial independent propositional machinery, especially conditionals and modalities, but Chrysippus is the one credited in antiquity with building a broad deductive propositional system.

So the counterfactual slot is best represented as:

```text
Diodorus + Philo
      |
      v
  CHRYSIPPUS
  formalizer slot
```

## I13 design consequence

Do not make `05_logic` equal to Aristotle.

Instead:

```text
05 LOGIC
   |
   +-- ARISTOTLE FORK
   |      term / form / syllogistic
   |
   +-- DIALECTICAL-STOIC FORK
          proposition / transition / consequence
```

The Queen voxel/vector field belongs closer to the second fork:

```text
state
  |
  v
conditional relation
  |
  v
choice / consequence
  |
  v
next state
```

while Aristotle remains valuable as the explicit discovery that inferential form can survive substitution of particulars.

The two forks may later be FLAYed against each other rather than forcing either one to be the whole of Logic.
