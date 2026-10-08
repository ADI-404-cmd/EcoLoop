# EcoLoop — Reference Data V1

**Version:** 1.0
**Purpose:** Scientific/reference dataset for e-waste material estimation, potential material recovery, and environmental-impact calculations.

---

## 1. Purpose

This file defines the numerical reference data that may be used by EcoLoop's Environmental Impact Calculator and related backend services.

Reference data must be separated from user/application data.

Examples of reference data:

* Material composition of electronic devices
* Material-weight-recycling factors
* Device weight references
* Environmental-impact factors
* Regulatory classifications
* Source metadata

Examples of application data:

* User-submitted device
* Quantity submitted
* Collection status
* User-provided weight
* Selected disposal pathway
* Actual collection records

---

# 2. Scientific Integrity Rules

The application must follow these rules:

1. Never invent a material percentage.
2. Never silently substitute a generic e-waste percentage for a device-specific value.
3. Every numerical scientific factor must have a source.
4. Store the source and methodology alongside the factor.
5. Material present and material recovered are different quantities.
6. Potential recovery must not be presented as actual recycling.
7. Device age must not automatically alter material composition.
8. User-provided weight should be used only when a better reference weight is unavailable.
9. If reliable data does not exist, return `UNAVAILABLE`.
10. Avoid false precision. Do not display more decimal places than justified by the source.

---

# 3. Data Confidence Levels

| Level       | Meaning                                                        |
| ----------- | -------------------------------------------------------------- |
| HIGH        | Exact product/model data or highly applicable scientific study |
| MEDIUM      | Device-category scientific reference                           |
| LOW         | Broad/general reference with limited device specificity        |
| UNAVAILABLE | No sufficiently defensible value                               |

The system must not convert `UNAVAILABLE` into an estimated number.

---

# 4. Material Composition Data

## 4.1 Smartphone / Cell Phone

### Dataset A — JRC smartphone lifecycle study

Reference composition:

| Material              | Percentage by mass |
| --------------------- | -----------------: |
| Silicon               |              25.0% |
| Plastic               |              23.0% |
| Iron                  |              20.5% |
| Aluminium             |              14.0% |
| Copper                |               7.0% |
| Lead                  |               6.0% |
| Zinc                  |               2.0% |
| Tin/Nickel            |               1.0% |
| Unspecified remainder |               1.5% |

**Total reported composition:** 98.5%

The 1.5% remainder must not be automatically assigned to another material.

**Data level:** Device category
**Confidence:** HIGH for the studied smartphone scenario
**Use:** Material-presence estimation for smartphone category

---

## 4.2 Cell Phone — Academic Reference Dataset

A separate academic dataset reports:

| Material       |  Content |
| -------------- | -------: |
| Ferrous metals |    5 wt% |
| Aluminium      |    1 wt% |
| Copper         |   13 wt% |
| Plastics       |   57 wt% |
| Glass          |    2 wt% |
| Lead           |  0.3 wt% |
| Nickel         |  0.1 wt% |
| Tin            |  0.5 wt% |
| Silver         | 1340 ppm |
| Gold           |  350 ppm |
| Palladium      |  210 ppm |

This dataset must be stored separately from the JRC dataset.

Do not combine the two compositions into one artificial average.

**Data level:** Device category
**Confidence:** MEDIUM/HIGH
**Use:** Alternative scientific reference / comparison

---

# 5. Laptop

## 5.1 Laptop Material Composition

A published computer-reuse study provides the following laptop composition:

| Material                 | Material % |
| ------------------------ | ---------: |
| Ferrous metals           |      14.2% |
| Aluminium                |      8.44% |
| Copper                   |      6.85% |
| Precious metals          |     0.029% |
| Other non-ferrous metals |      10.9% |
| Plastics                 |      40.6% |
| Other organics           |    0.0874% |
| Minerals                 |      12.6% |
| Other                    |      6.32% |

These values represent a specific literature-based laptop composition model.

**Data level:** Laptop category
**Confidence:** HIGH for category-level estimation
**Use:** Laptop material estimation

---

# 6. Laptop Material-Weight-Recycling Factors

The same study provides Material Weight Recycling (MWR) factors.

| Material                 | Material % | MWR |
| ------------------------ | ---------: | --: |
| Ferrous metals           |      14.2% | 86% |
| Aluminium                |      8.44% | 75% |
| Copper                   |      6.85% | 85% |
| Precious metals          |     0.029% | 88% |
| Other non-ferrous metals |      10.9% | 90% |
| Plastics                 |      40.6% | 13% |
| Other organics           |    0.0874% |  0% |
| Minerals                 |      12.6% |  0% |
| Other                    |      6.32% |  0% |

These MWR values represent the recycling model used by the cited study.

They must NOT be interpreted as guaranteed recovery rates for every recycler.

---

# 7. Desktop Computer

A literature dataset provides the following desktop composition:

| Material                 | Material % | MWR |
| ------------------------ | ---------: | --: |
| Ferrous metals           |      37.2% | 89% |
| Aluminium                |      4.61% | 83% |
| Copper                   |      4.32% | 78% |
| Precious metals          |    0.0113% | 88% |
| Other non-ferrous metals |     0.369% | 29% |
| Plastics                 |      18.8% | 43% |
| Other organics           |    0.0914% |  0% |
| Minerals                 |      30.0% |  0% |
| Other                    |      4.36% |  0% |

These values are suitable for a category-level desktop reference.

---

# 8. Monitor

Monitor material composition varies substantially according to technology and model.

Therefore:

* CRT monitors
* LCD monitors
* LED-backlit monitors

must not be treated as one identical material composition.

For an exact commercial model, manufacturer-specific composition should take priority.

Example manufacturer data may provide exact percentages for a particular monitor model, but that value must only be applied to that exact model or an explicitly equivalent model.

**Current V1 status:** PARTIAL

**Default behaviour when no applicable monitor reference exists:**

```text
Material composition = UNAVAILABLE
```

Do not substitute the laptop or smartphone composition.

---

# 9. Television

Televisions have highly variable composition depending on:

* CRT vs LCD vs LED
* screen size
* display technology
* manufacturing generation

Therefore V1 should not use one universal television composition.

**Current V1 status:** RESEARCH REQUIRED

---

# 10. Printer

Printers contain combinations of:

* plastics
* steel/ferrous metals
* aluminium
* copper
* circuit boards
* glass
* other materials

Composition varies substantially by printer technology.

**Current V1 status:** RESEARCH REQUIRED

---

# 11. Refrigerators and Washing Machines

Large household appliances should not use laptop/phone composition.

They require separate reference datasets because their mass is dominated by substantially different material structures.

**Current V1 status:** RESEARCH REQUIRED

---

# 12. Device Weight Hierarchy

The calculator must determine device weight using the following priority:

### Priority 1 — Exact manufacturer model

Example:

```text
Brand: Samsung
Model: Galaxy S24
```

If an authoritative manufacturer specification provides mass:

```text
device_weight_source = MANUFACTURER_EXACT_MODEL
```

### Priority 2 — Reliable exact-model technical source

If the manufacturer does not provide the required information, a reliable technical source may be used.

```text
device_weight_source = EXACT_MODEL_TECHNICAL_SOURCE
```

### Priority 3 — Category reference weight

If the exact model cannot be identified:

```text
device_weight_source = CATEGORY_REFERENCE
```

### Priority 4 — User-provided weight

If the user physically weighs the device:

```text
device_weight_source = USER_PROVIDED
```

User-provided weight should not be overwritten by a category estimate unless the user requests recalculation.

---

# 13. Total E-Waste Mass

For a device:

```text
total_mass = device_weight × quantity
```

Example:

```text
device_weight = 1.5 kg
quantity = 3

total_mass = 1.5 × 3
            = 4.5 kg
```

---

# 14. Material-Presence Calculation

For each material:

```text
material_mass = total_mass × material_fraction
```

Example:

```text
total_mass = 10 kg
copper_fraction = 6.85%

copper_mass = 10 × 0.0685
            = 0.685 kg
```

The result means approximately:

```text
0.685 kg copper present in the reference composition
```

It does NOT mean that 0.685 kg will actually be recovered.

---

# 15. Potential Material Recovery

Where an applicable MWR factor exists:

```text
potential_recovery =
    material_mass × MWR
```

Example:

```text
copper_mass = 0.685 kg
MWR = 85%

potential_recovery =
    0.685 × 0.85
    = 0.58225 kg
```

Display:

```text
Potential copper recovery ≈ 0.58 kg
```

The interface must label this as:

> Estimated potential recovery

and not:

> Actual recovered copper

---

# 16. Actual Recovery

Actual recovery should only be recorded when the application has an actual processing/collection record.

Example:

```text
actual_recovered_copper = 0.41 kg
```

This is application/process data and must not be confused with the scientific reference factor.

---

# 17. Recovery Terminology

The application must distinguish:

### Material Present

Material estimated to exist in the device.

### Potential Recovery

Material that could potentially be recovered according to the selected reference recovery factor.

### Actual Recovery

Material actually recovered and recorded by a processing/recycling operation.

These three values must never be treated as interchangeable.

---

# 18. Environmental Impact / CO2e

## 18.1 No Universal CO2e-per-kg Factor

EcoLoop V1 must NOT use:

```text
CO2e = e-waste_mass × universal_CO2e_per_kg
```

unless a scientifically appropriate source and system boundary are explicitly established.

A single universal value would ignore:

* device type
* manufacturing scenario
* electricity mix
* geography
* lifetime
* use phase
* transport
* recycling process
* system boundary

---

# 19. Current CO2e Status

### Smartphone

Scenario-specific lifecycle studies exist.

However, their results must be stored together with:

```text
functional_unit
system_boundary
geography
lifetime_assumption
manufacturing_scenario
use_scenario
end_of_life_scenario
source
```

A lifecycle result from one study must not automatically become a universal smartphone CO2e factor.

**V1 status:** PARTIAL

---

### Laptop

Lifecycle studies demonstrate that manufacturing is a major contributor to greenhouse-gas impact.

However, a workplace-level lifecycle result must not be directly converted into:

```text
kg CO2e per laptop
```

without preserving the original assumptions.

**V1 status:** PARTIAL

---

### Other Devices

Until a suitable LCA factor is identified:

```text
CO2e estimate = UNAVAILABLE
```

The UI should explain:

> A defensible CO2e estimate is not currently available for this device/reference scenario.

This is preferable to displaying a fabricated number.

---

# 20. Circular Pathway Recommendation

Age and condition should primarily influence the recommended pathway.

They should NOT directly modify material composition.

Example logic:

```text
IF condition == "fully working"
    → prioritize continued use / reuse

ELSE IF condition == "working with issues"
    → prioritize repair / refurbishment

ELSE IF condition == "non-working"
    → assess repairability
    → otherwise formal recycling

ELSE IF condition == "physically damaged"
    → prioritize formal assessment and recycling
```

The system may also consider device age.

Example:

```text
newer + working
    → reuse / continued use

older + working
    → reuse / refurbishment depending on condition

older + non-working
    → repair assessment or recycling
```

These are pathway recommendations, not material-composition calculations.

---

# 21. Age Handling

Device age should be calculated from:

```text
age = current_year - purchase_year
```

or, if purchase date is available:

```text
age = current_date - purchase_date
```

Age should be stored separately from material composition.

Incorrect:

```text
older laptop → lower aluminium percentage
```

Correct:

```text
older laptop → potentially stronger case for
reuse/refurbishment/lifetime-extension assessment
```

---

# 22. Condition Handling

Condition is an application input.

Recommended values:

```text
FULLY_WORKING
WORKING_WITH_ISSUES
NON_WORKING
PHYSICALLY_DAMAGED
UNKNOWN
```

Condition may influence pathway recommendation.

It must not arbitrarily modify the physical material composition.

---

# 23. Intended Pathway

Recommended values:

```text
CONTINUE_USING
REUSE_DONATE
REPAIR_REFURBISH
FORMAL_RECYCLING
NOT_SURE
```

The user's selected pathway should be retained.

The backend may provide an alternative recommended pathway.

Example:

```text
user_pathway = FORMAL_RECYCLING

recommended_pathway = REPAIR_REFURBISH

reason =
"Device condition indicates that lifetime extension may be preferable
before material recycling."
```

---

# 24. Reference Record Schema

Each scientific factor should follow a structure similar to:

```json
{
  "id": "LAPTOP_MATERIAL_COMPOSITION_V1",
  "device_category": "LAPTOP",
  "material": "COPPER",
  "value": 6.85,
  "unit": "percent_mass",
  "data_type": "MATERIAL_COMPOSITION",
  "source_id": "SRC_LAPTOP_MWR_STUDY",
  "confidence": "HIGH",
  "applicability": "CATEGORY_LEVEL",
  "methodology_version": "1.0",
  "notes": "Literature-based laptop reference"
}
```

---

# 25. Recovery Record Example

```json
{
  "id": "LAPTOP_COPPER_MWR_V1",
  "device_category": "LAPTOP",
  "material": "COPPER",
  "value": 85,
  "unit": "percent",
  "data_type": "MATERIAL_WEIGHT_RECYCLING",
  "source_id": "SRC_LAPTOP_MWR_STUDY",
  "confidence": "HIGH",
  "applicability": "CATEGORY_LEVEL",
  "methodology_version": "1.0"
}
```

---

# 26. Source Registry

Every scientific source must have a registry entry.

Required fields:

```text
source_id
title
publisher
authors
publication_year
source_type
url_or_identifier
device_categories
parameters_supported
geography
methodology_notes
limitations
```

---

# 27. Initial Source Registry

## SRC_JRC_SMARTPHONE

**Title:** Reducing the carbon footprint of ICT products through material efficiency strategies: a life cycle analysis of smartphones

**Publisher:** European Commission Joint Research Centre

**Source type:** Scientific lifecycle study

**Primary use:**

* smartphone lifecycle methodology
* smartphone material/lifecycle context
* lifetime-extension analysis

**Limitations:**

Values are scenario-specific and must not be treated as universal smartphone environmental factors.

---

## SRC_CELL_PHONE_COMPOSITION

**Source type:** Academic literature review / dataset

**Primary use:**

* cell-phone material composition
* metals and plastics reference values
* precious-metal content

**Limitations:**

Represents a literature dataset rather than every modern smartphone model.

---

## SRC_LAPTOP_MWR_STUDY

**Source type:** Peer-reviewed academic study

**Primary use:**

* laptop material composition
* laptop Material Weight Recycling factors
* desktop material composition
* desktop Material Weight Recycling factors

**Limitations:**

MWR values represent the methodology/model used in the study and are not guaranteed recovery rates for every recycling facility.

---

## SRC_JRC_COMPUTER_LCA

**Source type:** European Commission JRC technical report

**Primary use:**

* computer/laptop lifecycle methodology
* manufacturing vs use-phase environmental impacts
* circularity/lifetime considerations

**Limitations:**

Do not convert workplace-level lifecycle totals directly into universal per-device CO2e factors.

---

# 28. V1 Device Support

| Device          | Material Composition | Recovery Factor | CO2e    | Status            |
| --------------- | -------------------- | --------------- | ------- | ----------------- |
| Smartphone      | YES                  | PARTIAL         | PARTIAL | READY FOR MVP     |
| Cell phone      | YES                  | PARTIAL         | PARTIAL | READY FOR MVP     |
| Laptop          | YES                  | YES             | PARTIAL | READY FOR MVP     |
| Desktop PC      | YES                  | YES             | PARTIAL | READY FOR MVP     |
| Monitor         | PARTIAL              | NO              | NO      | LIMITED           |
| TV              | NO                   | NO              | NO      | RESEARCH REQUIRED |
| Printer         | NO                   | NO              | NO      | RESEARCH REQUIRED |
| Refrigerator    | NO                   | NO              | NO      | RESEARCH REQUIRED |
| Washing Machine | NO                   | NO              | NO      | RESEARCH REQUIRED |

---

# 29. MVP Recommendation

EcoLoop V1 should initially support:

```text
SMARTPHONE
CELL_PHONE
LAPTOP
DESKTOP_PC
```

These categories have enough scientific reference data to demonstrate:

1. Device registration
2. Weight estimation
3. Material composition estimation
4. Potential material recovery
5. Circular pathway recommendation
6. Management dashboard aggregation

Additional categories can be enabled only after suitable reference data is added.

---

# 30. Example Calculation

User submits:

```text
Device:
Laptop

Weight:
2 kg

Quantity:
2

Material:
Copper
```

### Step 1 — Total mass

```text
2 × 2 = 4 kg
```

### Step 2 — Copper present

Laptop copper fraction:

```text
6.85%
```

Therefore:

```text
4 × 0.0685 = 0.274 kg
```

Estimated copper present:

```text
0.274 kg
```

### Step 3 — Potential copper recovery

Laptop copper MWR:

```text
85%
```

Therefore:

```text
0.274 × 0.85
= 0.2329 kg
```

Display:

```text
Estimated copper present:
0.274 kg

Estimated potential copper recovery:
0.233 kg
```

The result must explicitly state that this is a reference-based estimate, not a measurement of actual recovered material.

---

# 31. Uncertainty Handling

If a reference provides a range:

```text
minimum_value
maximum_value
```

must be stored instead of inventing a midpoint.

Example:

```json
{
  "value_min": 10,
  "value_max": 20,
  "unit": "percent_mass"
}
```

The UI may display:

```text
Estimated range: 10–20%
```

rather than:

```text
15%
```

unless the source explicitly provides 15% as an appropriate representative value.

---

# 32. Data Versioning

Reference data must be versioned.

Example:

```text
REFERENCE_DATA_V1
REFERENCE_DATA_V1.1
REFERENCE_DATA_V2
```

A calculation record should store:

```text
reference_data_version
```

This ensures that an old calculation can be understood even after the reference dataset changes.

---

# 33. Calculation Record

Every environmental calculation should retain:

```json
{
  "device_category": "LAPTOP",
  "quantity": 2,
  "weight_kg": 2,
  "total_mass_kg": 4,
  "reference_data_version": "1.0",
  "material_results": [],
  "recovery_results": [],
  "co2e_result": null,
  "confidence": "HIGH",
  "warnings": []
}
```

---

# 34. Important UI Warning

The calculator should include a disclaimer similar to:

> Results are estimates generated from scientific reference datasets and the information provided for the device. Actual material content and recovery depend on the specific product, design, condition, dismantling process and recycling facility.

For unavailable environmental factors:

> A scientifically defensible environmental-impact factor is not available for this device/reference scenario, so EcoLoop does not display a fabricated estimate.

---

# 35. Implementation Status

### READY

* Smartphone/cell-phone composition references
* Laptop composition
* Laptop recovery factors
* Desktop composition
* Desktop recovery factors
* Calculation formulas
* Confidence model
* Source tracking
* Versioning structure
* Circular pathway logic

### PARTIAL

* Exact model weights
* Smartphone recovery factors
* Smartphone CO2e
* Laptop CO2e
* Monitor data

### RESEARCH REQUIRED

* TV composition
* Printer composition
* Refrigerator composition
* Washing-machine composition
* Device-specific LCA factors
* More India-specific recovery/process data

---

# 36. Golden Rule

If EcoLoop has insufficient scientific evidence for a numerical result:

```text
DO NOT GUESS.
DO NOT FABRICATE.
RETURN UNAVAILABLE.
```

Scientific transparency is more important than producing a larger-looking number of calculated metrics.
