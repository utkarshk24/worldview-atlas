"""Data integrity checks for site/data. Run from the repository root: python3 tools/validate.py
Exits non-zero on any failure so CI blocks a broken deploy."""
import json, pathlib, sys

D = pathlib.Path(__file__).resolve().parent.parent / "site" / "data"
errors, warnings = [], []
C = json.loads((D / "countries.json").read_text(encoding="utf-8"))
UN = {k for k, v in C.items() if v.get("un")} | {"PSE", "VAT"}

# 1. every country record has the core fields
for k, v in C.items():
    for f in ("n", "o", "a2", "r"):
        if not v.get(f):
            errors.append(f"{k}: missing {f}")

# 2. both boundary editions load and reference known countries or listed special areas
for ed in ("geo-india.json", "geo-global.json"):
    g = json.loads((D / ed).read_text(encoding="utf-8"))
    ids = {x["id"] for x in g["objects"]["c"]["geometries"]}
    missing = sorted(k for k in UN if k not in ids and C[k].get("ar", 0) >= 2500)
    if missing:
        warnings.append(f"{ed}: UN members ≥2,500 km² without a shape (by design for the India edition only if merged): {missing}")

# 3. every country has a profile shard entry; UN members have Factbook text
shards = {}
for p in (D / "shard").glob("*.json"):
    shards.update(json.loads(p.read_text(encoding="utf-8")))
for k in C:
    if k not in shards:
        errors.append(f"{k}: no shard record")
    elif k in UN and k != "VAT" and not shards[k].get("fb"):
        errors.append(f"{k}: UN member without Factbook profile")

# 4. metric sanity
for k, v in C.items():
    if v.get("hdi") and not (0 < v["hdi"][0] < 1 and 1 <= v["hdi"][1] <= 193):
        errors.append(f"{k}: HDI out of range {v['hdi']}")
    if v.get("gini") and not (10 < v["gini"][0] < 75):
        errors.append(f"{k}: Gini out of range {v['gini']}")
    if v.get("pop") and v["pop"][0] <= 0:
        errors.append(f"{k}: bad population")
hdi_n = sum(1 for v in C.values() if v.get("hdi"))
if hdi_n != 193:
    errors.append(f"HDI covers {hdi_n} countries, expected 193")

# 5. curated profiles and leadership updates parse and point at real countries
cur = json.loads((D / "curated.json").read_text(encoding="utf-8"))
for k in cur:
    if not k.startswith("_") and k not in C:
        errors.append(f"curated: unknown country {k}")
lead = json.loads((D / "leaders.json").read_text(encoding="utf-8"))
for k, v in lead.items():
    if k.startswith("_"):
        continue
    if k not in C:
        errors.append(f"leaders: unknown country {k}")
    if not v.get("src"):
        errors.append(f"leaders: {k} has no source")

for w in warnings:
    print("WARN", w)
for e in errors:
    print("FAIL", e)
print(f"{len(C)} countries · {len(shards)} shard records · HDI {hdi_n} · {len(errors)} failures · {len(warnings)} warnings")
sys.exit(1 if errors else 0)
