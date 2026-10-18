# Computational research results

Recorded 2026-10-18T11:39:55.779Z; Node v24.19.0, linux/x64. Commit 7248a7daf455709286b772d8b4933042519aaa08; working tree dirty: true. Source SHA-256 values in latest.json identify the actual tested code beyond the commit.

Preregistration SHA-256: `9ba59b6328882c8deda0ef45d1582be21a3fd10d674339322eae102c09cc159c`. Deterministic result SHA-256: `4b2f40b88d401672ab347100559c7a0144c90697c9da9e973745d50b49b1d070`. Seeds 0–999. Amendment SHA-256: `48f8829083ad1a51a36c6296369834280aa796447bc9473e752250bf9c1be5cb`. Initial display mismatch is preserved in the original registration and timestamped runs; the amended run uses exact mission dimensions and adds an independently checked containment-edge rewrite.

| Hypothesis | Actual status | Failure observations |
|---|---|---|
| H1 | PASS | 0 |
| H2 | PASS | 0 |
| H3 | PASS | 0 |
| H4 | PASS | 0 |
| H5 | PASS | 0 |
| H6 | PENDING | 0 |
| H7 | PASS | 0 |

These are computational experiments on authored fixtures, not proof of scientific novelty, aesthetic quality, broad usability, or real external service behavior. H6 separates browser fidelity evidence from similarity improvement; no improvement claim is made without a before/after comparison. Distinct full-content hashes include seeds; structural equivalence and geometric feasibility are reported separately. No statistical significance is asserted.

## H1: pass

```json
{
  "seeds": 1000,
  "seedFamilyAssignment": "FAMILIES[seed % 6]",
  "seedOutputSHA256": "68bc189445fa92f05f3b30baa254bc61d4092ed999350c6148becf2686bf404f",
  "uniqueContentSHA256": 1000,
  "uniqueSDKStructuralSignatures": 14,
  "uniqueIndependentStructuralSignatures": 16,
  "oneEdge": {
    "edge": {
      "from": "resource-a4e65930136b0cd4-n3",
      "to": "resource-a4e65930136b0cd4",
      "kind": "references"
    },
    "changes": [
      {
        "family": "observatory",
        "contentChanged": false,
        "independentStructureChanged": false,
        "sdkStructureChanged": false
      },
      {
        "family": "orbital",
        "contentChanged": false,
        "independentStructureChanged": false,
        "sdkStructureChanged": false
      },
      {
        "family": "elastic",
        "contentChanged": false,
        "independentStructureChanged": false,
        "sdkStructureChanged": false
      },
      {
        "family": "folded",
        "contentChanged": false,
        "independentStructureChanged": false,
        "sdkStructureChanged": false
      },
      {
        "family": "workbench",
        "contentChanged": false,
        "independentStructureChanged": false,
        "sdkStructureChanged": false
      },
      {
        "family": "chromatic",
        "contentChanged": false,
        "independentStructureChanged": false,
        "sdkStructureChanged": false
      }
    ]
  },
  "amendedContainmentEdge": {
    "original": {
      "from": "resource-a4e65930136b0cd4-n3",
      "to": "resource-a4e65930136b0cd4-n4",
      "kind": "contains"
    },
    "replacement": {
      "from": "resource-a4e65930136b0cd4-n5",
      "to": "resource-a4e65930136b0cd4-n4",
      "kind": "contains"
    },
    "changes": [
      {
        "family": "observatory",
        "target": "resource-a4e65930136b0cd4-n4",
        "oldParent": "resource-a4e65930136b0cd4-n3",
        "newParent": "resource-a4e65930136b0cd4-n5",
        "structureChanged": true,
        "geometryChanged": false,
        "actionsPreserved": true,
        "hardConstraintErrors": []
      },
      {
        "family": "orbital",
        "target": "resource-a4e65930136b0cd4-n4",
        "oldParent": "resource-a4e65930136b0cd4-n3",
        "newParent": "resource-a4e65930136b0cd4-n5",
        "structureChanged": true,
        "geometryChanged": false,
        "actionsPreserved": true,
        "hardConstraintErrors": []
      },
      {
        "family": "elastic",
        "target": "resource-a4e65930136b0cd4-n4",
        "oldParent": "resource-a4e65930136b0cd4-n3",
        "newParent": "resource-a4e65930136b0cd4-n5",
        "structureChanged": true,
        "geometryChanged": false,
        "actionsPreserved": true,
        "hardConstraintErrors": []
      },
      {
        "family": "folded",
        "target": "resource-a4e65930136b0cd4-n4",
        "oldParent": "resource-a4e65930136b0cd4-n3",
        "newParent": "resource-a4e65930136b0cd4-n5",
        "structureChanged": true,
        "geometryChanged": false,
        "actionsPreserved": true,
        "hardConstraintErrors": []
      },
      {
        "family": "workbench",
        "target": "resource-a4e65930136b0cd4-n4",
        "oldParent": "resource-a4e65930136b0cd4-n3",
        "newParent": "resource-a4e65930136b0cd4-n5",
        "structureChanged": true,
        "geometryChanged": true,
        "actionsPreserved": true,
        "hardConstraintErrors": []
      },
      {
        "family": "chromatic",
        "target": "resource-a4e65930136b0cd4-n4",
        "oldParent": "resource-a4e65930136b0cd4-n3",
        "newParent": "resource-a4e65930136b0cd4-n5",
        "structureChanged": true,
        "geometryChanged": false,
        "actionsPreserved": true,
        "hardConstraintErrors": []
      }
    ]
  },
  "manifestReplay": true
}
```

No observed failures in this experiment.

Interpretation: The registered computational checks (including explicitly recorded amendment) passed for these inputs. This does not establish performance outside the tested domain.

Next test: Repeat in a second environment and expand fixtures; inspect human usability separately.

## H2: pass

```json
{
  "displayMatrix": "Exact mission dimensions per preregister-amendment-1.json",
  "initialMismatch": "Initial run stress dimensions retained in original registration/timestamped results; amendment corrected 320x640/2560x1080/1024x360 to 320x568/900x390/1920x1080 before this run.",
  "combinations": 36,
  "feasible": 36,
  "paretoFront": [
    "observatory/portrait",
    "observatory/narrow",
    "observatory/wide",
    "orbital/portrait",
    "orbital/narrow",
    "elastic/portrait",
    "elastic/desktop",
    "elastic/tablet",
    "elastic/narrow",
    "elastic/landscape",
    "elastic/wide",
    "folded/portrait",
    "folded/desktop",
    "folded/tablet",
    "folded/narrow",
    "folded/landscape",
    "folded/wide",
    "workbench/portrait",
    "workbench/narrow",
    "chromatic/portrait",
    "chromatic/desktop",
    "chromatic/narrow",
    "chromatic/wide"
  ],
  "negativeControls": {
    "clipping": [
      "clip:resource-a4e65930136b0cd4"
    ],
    "wrongAction": [
      "required-actions-mismatch"
    ]
  },
  "usability": "Geometric/action constraints only; DOM/a11y/usability requires H6 and human review."
}
```

No observed failures in this experiment.

Interpretation: The registered computational checks (including explicitly recorded amendment) passed for these inputs. This does not establish performance outside the tested domain.

Next test: Repeat in a second environment and expand fixtures; inspect human usability separately.

## H3: pass

```json
{
  "fieldCases": 1200,
  "gamutCases": 185,
  "minimumContrast": 6.937890444021296,
  "minimumByMode": {
    "dark": 7.044865240699234,
    "light": 6.937890444021296
  },
  "maxSDKIndependentContrastDelta": 0,
  "negativeRatios": [
    1,
    1.2632533688247014
  ]
}
```

No observed failures in this experiment.

Interpretation: The registered computational checks (including explicitly recorded amendment) passed for these inputs. This does not establish performance outside the tested domain.

Next test: Repeat in a second environment and expand fixtures; inspect human usability separately.

## H4: pass

```json
{
  "seededWorlds": 100,
  "ticksPerWorld": 1200,
  "stressNodes": 64,
  "stressTicks": 2400,
  "maxEnergy": 3538.009403,
  "maxAbsoluteField": 0.842,
  "maxAbsolutePosition": 125.999924,
  "maxAbsoluteVelocity": 38.885694,
  "maxFinalEnergyRatio": 0.08811079326327166,
  "orderAndBatchingReplay": true,
  "zeroForceEquilibrium": true,
  "reducedMotion": true,
  "boundedWork": true,
  "semanticSideEffects": "API contains no callbacks; tests do not authorize external effects."
}
```

No observed failures in this experiment.

Interpretation: The registered computational checks (including explicitly recorded amendment) passed for these inputs. This does not establish performance outside the tested domain.

Next test: Repeat in a second runtime and extend parameter sweeps and initial conditions.

## H5: pass

```json
{
  "operations": 20,
  "pack": {
    "id": "netscape-capabilities",
    "version": "1.0.0",
    "constitutionVersion": "1.0.0",
    "enforcementRevision": "1",
    "performers": [
      {
        "id": "validate-url",
        "version": "1.0.0",
        "input": "nmop/text@1",
        "output": "nmop/safe-url@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "external-target",
        "version": "1.0.0",
        "input": "nmop/safe-url@1",
        "output": "nmop/external-target@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "fetch-resource",
        "version": "1.0.0",
        "input": "nmop/safe-url@1",
        "output": "nmop/resource-document@1",
        "effects": [
          "external-read"
        ],
        "requires": [
          "resource.read"
        ]
      },
      {
        "id": "validate-graph",
        "version": "1.0.0",
        "input": "nmop/semantic-graph@1",
        "output": "nmop/semantic-graph@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "graph-summary",
        "version": "1.0.0",
        "input": "nmop/semantic-graph@1",
        "output": "nmop/graph-summary@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "graph-passages",
        "version": "1.0.0",
        "input": "nmop/semantic-graph@1",
        "output": "nmop/passages@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "graph-links",
        "version": "1.0.0",
        "input": "nmop/semantic-graph@1",
        "output": "nmop/links@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "graph-intent-candidates",
        "version": "1.0.0",
        "input": "nmop/semantic-graph@1",
        "output": "nmop/intent-candidates@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "select-passage",
        "version": "1.0.0",
        "input": "nmop/selection-request@1",
        "output": "nmop/selection@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "selection-context",
        "version": "1.0.0",
        "input": "nmop/selection@1",
        "output": "nmop/passage-context@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "context-artifact",
        "version": "1.0.0",
        "input": "nmop/passage-context@1",
        "output": "nmop/artifact@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "validate-artifact",
        "version": "1.0.0",
        "input": "nmop/artifact@1",
        "output": "nmop/artifact@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "artifact-markdown",
        "version": "1.0.0",
        "input": "nmop/artifact@1",
        "output": "nmop/text@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "artifact-json",
        "version": "1.0.0",
        "input": "nmop/artifact@1",
        "output": "nmop/text@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "save-artifact",
        "version": "1.0.0",
        "input": "nmop/artifact@1",
        "output": "nmop/artifact@1",
        "effects": [
          "local-state"
        ],
        "requires": [
          "artifact.write"
        ]
      },
      {
        "id": "load-artifact",
        "version": "1.0.0",
        "input": "nmop/text@1",
        "output": "nmop/artifact@1",
        "effects": [
          "local-state"
        ],
        "requires": [
          "artifact.read"
        ]
      },
      {
        "id": "normalize-text",
        "version": "1.0.0",
        "input": "nmop/text@1",
        "output": "nmop/text@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "text-stats",
        "version": "1.0.0",
        "input": "nmop/text@1",
        "output": "nmop/text-stats@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "unique-links",
        "version": "1.0.0",
        "input": "nmop/links@1",
        "output": "nmop/links@1",
        "effects": [
          "pure"
        ],
        "requires": []
      },
      {
        "id": "links-markdown",
        "version": "1.0.0",
        "input": "nmop/links@1",
        "output": "nmop/text@1",
        "effects": [
          "pure"
        ],
        "requires": []
      }
    ],
    "provenance": "Local, authored SDK implementations; external transports and storage are injected, never fabricated."
  },
  "negativeControls": {
    "schemaMismatch": true,
    "runtimeShape": true,
    "missingPassage": true,
    "unauthorizedNetwork": true,
    "unauthorizedLocalSave": true,
    "effectEscalation": true,
    "preflightBeforeEffects": true,
    "unknownOperation": true,
    "outputSchema": true
  },
  "pureTraceSteps": 5,
  "metadata": [
    {
      "id": "validate-url",
      "input": "nmop/text@1",
      "output": "nmop/safe-url@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/safe-url@1"
      ],
      "metadataRich": true
    },
    {
      "id": "external-target",
      "input": "nmop/safe-url@1",
      "output": "nmop/external-target@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/external-target@1"
      ],
      "metadataRich": true
    },
    {
      "id": "fetch-resource",
      "input": "nmop/safe-url@1",
      "output": "nmop/resource-document@1",
      "effects": [
        "external-read"
      ],
      "requires": [
        "resource.read"
      ],
      "provides": [
        "nmop/resource-document@1"
      ],
      "metadataRich": true
    },
    {
      "id": "validate-graph",
      "input": "nmop/semantic-graph@1",
      "output": "nmop/semantic-graph@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/semantic-graph@1"
      ],
      "metadataRich": true
    },
    {
      "id": "graph-summary",
      "input": "nmop/semantic-graph@1",
      "output": "nmop/graph-summary@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/graph-summary@1"
      ],
      "metadataRich": true
    },
    {
      "id": "graph-passages",
      "input": "nmop/semantic-graph@1",
      "output": "nmop/passages@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/passages@1"
      ],
      "metadataRich": true
    },
    {
      "id": "graph-links",
      "input": "nmop/semantic-graph@1",
      "output": "nmop/links@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/links@1"
      ],
      "metadataRich": true
    },
    {
      "id": "graph-intent-candidates",
      "input": "nmop/semantic-graph@1",
      "output": "nmop/intent-candidates@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/intent-candidates@1"
      ],
      "metadataRich": true
    },
    {
      "id": "select-passage",
      "input": "nmop/selection-request@1",
      "output": "nmop/selection@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/selection@1"
      ],
      "metadataRich": true
    },
    {
      "id": "selection-context",
      "input": "nmop/selection@1",
      "output": "nmop/passage-context@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/passage-context@1"
      ],
      "metadataRich": true
    },
    {
      "id": "context-artifact",
      "input": "nmop/passage-context@1",
      "output": "nmop/artifact@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/artifact@1"
      ],
      "metadataRich": true
    },
    {
      "id": "validate-artifact",
      "input": "nmop/artifact@1",
      "output": "nmop/artifact@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/artifact@1"
      ],
      "metadataRich": true
    },
    {
      "id": "artifact-markdown",
      "input": "nmop/artifact@1",
      "output": "nmop/text@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/text@1"
      ],
      "metadataRich": true
    },
    {
      "id": "artifact-json",
      "input": "nmop/artifact@1",
      "output": "nmop/text@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/text@1"
      ],
      "metadataRich": true
    },
    {
      "id": "save-artifact",
      "input": "nmop/artifact@1",
      "output": "nmop/artifact@1",
      "effects": [
        "local-state"
      ],
      "requires": [
        "artifact.write"
      ],
      "provides": [
        "nmop/artifact@1"
      ],
      "metadataRich": true
    },
    {
      "id": "load-artifact",
      "input": "nmop/text@1",
      "output": "nmop/artifact@1",
      "effects": [
        "local-state"
      ],
      "requires": [
        "artifact.read"
      ],
      "provides": [
        "nmop/artifact@1"
      ],
      "metadataRich": true
    },
    {
      "id": "normalize-text",
      "input": "nmop/text@1",
      "output": "nmop/text@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/text@1"
      ],
      "metadataRich": true
    },
    {
      "id": "text-stats",
      "input": "nmop/text@1",
      "output": "nmop/text-stats@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/text-stats@1"
      ],
      "metadataRich": true
    },
    {
      "id": "unique-links",
      "input": "nmop/links@1",
      "output": "nmop/links@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/links@1"
      ],
      "metadataRich": true
    },
    {
      "id": "links-markdown",
      "input": "nmop/links@1",
      "output": "nmop/text@1",
      "effects": [
        "pure"
      ],
      "requires": [],
      "provides": [
        "nmop/text@1"
      ],
      "metadataRich": true
    }
  ]
}
```

No observed failures in this experiment.

Interpretation: The registered computational checks (including explicitly recorded amendment) passed for these inputs. This does not establish performance outside the tested domain.

Next test: Repeat in a second environment and expand fixtures; inspect human usability separately.

## H6: pending

```json
{
  "browserEvidence": "artifacts/reports/visual-summary.json",
  "browserSummarySHA256": "e6970fce218248ce871789182814a49e6af4dd6116faf51b0633adeabba0514e",
  "expectedCases": 36,
  "observedCases": 36,
  "observedHardGateFailures": 0,
  "zeroDifferenceRecaptures": 36,
  "referenceComparison": "Self-baseline frozen recapture measures fidelity only. No before/after similarity improvement measured; comparative H6 remains pending.",
  "caseIds": [
    "chromatic-320x568",
    "elastic-320x568",
    "folded-320x568",
    "observatory-320x568",
    "orbital-320x568",
    "workbench-320x568",
    "chromatic-390x844",
    "elastic-390x844",
    "folded-390x844",
    "observatory-390x844",
    "orbital-390x844",
    "workbench-390x844",
    "chromatic-768x1024",
    "elastic-768x1024",
    "folded-768x1024",
    "observatory-768x1024",
    "orbital-768x1024",
    "workbench-768x1024",
    "chromatic-900x390",
    "elastic-900x390",
    "folded-900x390",
    "observatory-900x390",
    "orbital-900x390",
    "workbench-900x390",
    "chromatic-1440x900",
    "elastic-1440x900",
    "folded-1440x900",
    "observatory-1440x900",
    "orbital-1440x900",
    "workbench-1440x900",
    "chromatic-1920x1080",
    "elastic-1920x1080",
    "folded-1920x1080",
    "observatory-1920x1080",
    "orbital-1920x1080",
    "workbench-1920x1080"
  ]
}
```

No observed failures in this experiment.

Interpretation: No outcome claimed without external visual evidence.

Next test: Collect browser screenshots, keyboard/axe/action-map gates and deliberately failing controls; compare a frozen reference only when it exists.

## H7: pass

```json
{
  "fixtures": [
    {
      "fixture": "nasa",
      "dominant": {
        "kind": "research",
        "status": "inferred",
        "confidence": 0.95,
        "evidence": [
          "resource-a4e65930136b0cd4",
          "resource-a4e65930136b0cd4-n2",
          "resource-a4e65930136b0cd4-n4",
          "resource-a4e65930136b0cd4-n5",
          "resource-a4e65930136b0cd4-n6",
          "resource-a4e65930136b0cd4-n10",
          "resource-a4e65930136b0cd4-n11"
        ]
      },
      "intents": [
        {
          "kind": "research",
          "status": "inferred",
          "confidence": 0.95,
          "evidence": [
            "resource-a4e65930136b0cd4",
            "resource-a4e65930136b0cd4-n2",
            "resource-a4e65930136b0cd4-n4",
            "resource-a4e65930136b0cd4-n5",
            "resource-a4e65930136b0cd4-n6",
            "resource-a4e65930136b0cd4-n10",
            "resource-a4e65930136b0cd4-n11"
          ]
        }
      ],
      "nodes": 15,
      "actions": [
        {
          "id": "resource-a4e65930136b0cd4-n2",
          "action": "select-passage"
        },
        {
          "id": "resource-a4e65930136b0cd4-n4",
          "action": "select-passage"
        },
        {
          "id": "resource-a4e65930136b0cd4-n6",
          "action": "select-passage"
        },
        {
          "id": "resource-a4e65930136b0cd4-n7",
          "action": "select-passage"
        },
        {
          "id": "resource-a4e65930136b0cd4-n9",
          "action": "select-passage"
        },
        {
          "id": "resource-a4e65930136b0cd4-n10",
          "action": "navigate"
        },
        {
          "id": "resource-a4e65930136b0cd4-n11",
          "action": "navigate"
        },
        {
          "id": "resource-a4e65930136b0cd4-select-passage",
          "action": "select-passage"
        },
        {
          "id": "resource-a4e65930136b0cd4-attach-companion",
          "action": "attach-companion"
        },
        {
          "id": "resource-a4e65930136b0cd4-save-artifact",
          "action": "save-artifact"
        }
      ]
    },
    {
      "fixture": "restaurant",
      "dominant": {
        "kind": "commerce",
        "status": "inferred",
        "confidence": 0.95,
        "evidence": [
          "resource-7407f17147aa36b5",
          "resource-7407f17147aa36b5-n2",
          "resource-7407f17147aa36b5-n4",
          "resource-7407f17147aa36b5-n5",
          "resource-7407f17147aa36b5-n6",
          "resource-7407f17147aa36b5-n8",
          "resource-7407f17147aa36b5-n9",
          "resource-7407f17147aa36b5-n11"
        ]
      },
      "intents": [
        {
          "kind": "commerce",
          "status": "inferred",
          "confidence": 0.95,
          "evidence": [
            "resource-7407f17147aa36b5",
            "resource-7407f17147aa36b5-n2",
            "resource-7407f17147aa36b5-n4",
            "resource-7407f17147aa36b5-n5",
            "resource-7407f17147aa36b5-n6",
            "resource-7407f17147aa36b5-n8",
            "resource-7407f17147aa36b5-n9",
            "resource-7407f17147aa36b5-n11"
          ]
        }
      ],
      "nodes": 15,
      "actions": [
        {
          "id": "resource-7407f17147aa36b5-n2",
          "action": "select-passage"
        },
        {
          "id": "resource-7407f17147aa36b5-n4",
          "action": "select-passage"
        },
        {
          "id": "resource-7407f17147aa36b5-n6",
          "action": "select-passage"
        },
        {
          "id": "resource-7407f17147aa36b5-n8",
          "action": "select-passage"
        },
        {
          "id": "resource-7407f17147aa36b5-n11",
          "action": "navigate"
        },
        {
          "id": "resource-7407f17147aa36b5-select-passage",
          "action": "select-passage"
        },
        {
          "id": "resource-7407f17147aa36b5-attach-companion",
          "action": "attach-companion"
        },
        {
          "id": "resource-7407f17147aa36b5-save-artifact",
          "action": "save-artifact"
        }
      ]
    },
    {
      "fixture": "github",
      "dominant": {
        "kind": "repository",
        "status": "inferred",
        "confidence": 0.95,
        "evidence": [
          "resource-0b51dc47fd8f7abb",
          "resource-0b51dc47fd8f7abb-n2",
          "resource-0b51dc47fd8f7abb-n4",
          "resource-0b51dc47fd8f7abb-n6",
          "resource-0b51dc47fd8f7abb-n7",
          "resource-0b51dc47fd8f7abb-n8",
          "resource-0b51dc47fd8f7abb-n9",
          "resource-0b51dc47fd8f7abb-n10"
        ]
      },
      "intents": [
        {
          "kind": "repository",
          "status": "inferred",
          "confidence": 0.95,
          "evidence": [
            "resource-0b51dc47fd8f7abb",
            "resource-0b51dc47fd8f7abb-n2",
            "resource-0b51dc47fd8f7abb-n4",
            "resource-0b51dc47fd8f7abb-n6",
            "resource-0b51dc47fd8f7abb-n7",
            "resource-0b51dc47fd8f7abb-n8",
            "resource-0b51dc47fd8f7abb-n9",
            "resource-0b51dc47fd8f7abb-n10"
          ]
        }
      ],
      "nodes": 15,
      "actions": [
        {
          "id": "resource-0b51dc47fd8f7abb-n2",
          "action": "select-passage"
        },
        {
          "id": "resource-0b51dc47fd8f7abb-n4",
          "action": "select-passage"
        },
        {
          "id": "resource-0b51dc47fd8f7abb-n6",
          "action": "select-passage"
        },
        {
          "id": "resource-0b51dc47fd8f7abb-n7",
          "action": "navigate"
        },
        {
          "id": "resource-0b51dc47fd8f7abb-n8",
          "action": "navigate"
        },
        {
          "id": "resource-0b51dc47fd8f7abb-n9",
          "action": "navigate"
        },
        {
          "id": "resource-0b51dc47fd8f7abb-n11",
          "action": "select-passage"
        },
        {
          "id": "resource-0b51dc47fd8f7abb-select-passage",
          "action": "select-passage"
        },
        {
          "id": "resource-0b51dc47fd8f7abb-attach-companion",
          "action": "attach-companion"
        },
        {
          "id": "resource-0b51dc47fd8f7abb-save-artifact",
          "action": "save-artifact"
        }
      ]
    }
  ],
  "externalGeneralization": "Not tested: local authored fixtures only."
}
```

No observed failures in this experiment.

Interpretation: The registered computational checks (including explicitly recorded amendment) passed for these inputs. This does not establish performance outside the tested domain.

Next test: Evaluate independently sourced real documents and adversarial domain ambiguity.

## Methodological basis

See [bibliography](../experiments/sources/bibliography.json) for exact public source URLs, retrieval status and independent SHA-256. WCAG contrast, CSS Color 4, explicit integration/diffusion stability, runtime schemas and effect authority are established methods; Computational Interface Morphogenesis names this project’s combination, not established new science.

## Replay and failure retention

`npm run experiments` writes timestamped runs without deleting previous failures. `npm run experiments -- --replay artifacts/experiments/replay-manifest.json` independently verifies fixture, graph and regenerated surface SHA-256. Environment and source hashes are per-run metadata; the deterministic result digest excludes timestamps, CPU timing and commit state. Runtime measurements vary by machine and are not feasibility gates.
