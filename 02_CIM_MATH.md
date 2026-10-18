# Computational Interface Morphogenesis
Research name, not established new science. Let G=(V,E,tau) be typed semantic graph, I intent, K constraints, z seed, D display. Generate typed tree T=Grammar(G,I,z), solve feasible layout L=Solve(T,K,D), render U=Render(L). Pure deterministic generation from canonical input+seed+version; deterministic tie-breaking and bounded recursion.

Graph node kinds: Resource, Section, Text, Link, Form, Action, Artifact, Participant, Evidence, Group. Edges: contains, references, navigates, derives, observes, acts_on. Use versioned rewrite rules and a typed intermediate representation.

Hard constraints: required actions reachable; valid types; accessible focus order; viewport scroll; readable text; minimum target sizes; contrast; supported actions only. Soft objectives: compactness, legibility, grouping, whitespace, motion energy. Optimize a vector/Pareto frontier, not only a beauty score.

Experiments: 1,000 seeded structures; unique hashes versus structural equivalence; six families x six displays; one-edge perturbation; replay from manifest. Never equate distinct hashes with visually novel usable interfaces.
