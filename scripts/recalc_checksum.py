import csv

csv_path = r"c:\Users\odoka\Documents\GitHub\ioxweb\src\data\training\monitoringPeriodData.csv"

rows = []
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        rows.append(row)

depth_data = {}
for row in rows:
    period = int(row['period'])
    depth = float(row['depth'])
    if depth not in depth_data:
        depth_data[depth] = {}
    depth_data[depth][period] = {
        'aPlus': float(row['aPlus']) if row['aPlus'].strip() else None,
        'aMinus': float(row['aMinus']) if row['aMinus'].strip() else None,
        'cumDisp': float(row['cumDisp']) if row['cumDisp'].strip() else None,
    }

updates = {}
for depth, periods in sorted(depth_data.items()):
    if 1 not in periods or 5 not in periods or 6 not in periods:
        continue
    p1, p5, p6 = periods[1], periods[5], periods[6]
    if None in (p1['cumDisp'], p5['cumDisp'], p6['cumDisp'], p1['aPlus'], p6['aPlus']):
        continue

    c1, c5, c6 = p1['cumDisp'], p5['cumDisp'], p6['cumDisp']
    denom = c6 - c1
    if denom == 0:
        continue

    frac = (c5 - c1) / denom
    aPlus_interp = p1['aPlus'] + (p6['aPlus'] - p1['aPlus']) * frac
    aMinus_interp = p1['aMinus'] + (p6['aMinus'] - p1['aMinus']) * frac
    chk_interp = aPlus_interp + aMinus_interp

    if abs(chk_interp) > 0.50:
        # Symmetrize to checksum = 0.50
        signal = (aPlus_interp - aMinus_interp) / 2.0
        delta = 0.25 if chk_interp > 0 else -0.25
        new_aPlus = round(signal + delta, 2)
        new_aMinus = round(-signal + delta, 2)
        new_checksum = round(new_aPlus + new_aMinus, 2)
        flag = "CAPPED"
    else:
        new_aPlus = round(aPlus_interp, 2)
        new_aMinus = round(aMinus_interp, 2)
        new_checksum = round(chk_interp, 2)
        flag = ""

    updates[depth] = (new_aPlus, new_aMinus, new_checksum)

    print(f"depth={depth:5.1f}  cumDisp={c5:7.2f}  "
          f"interp: A+={aPlus_interp:8.2f} A-={aMinus_interp:8.2f} chk={chk_interp:6.2f}  "
          f"final: A+={new_aPlus:8.2f} A-={new_aMinus:8.2f} chk={new_checksum:.2f}  {flag}")

for row in rows:
    if int(row['period']) == 5:
        depth = float(row['depth'])
        if depth in updates:
            new_aPlus, new_aMinus, new_checksum = updates[depth]
            row['aPlus'] = f"{new_aPlus:.2f}"
            row['aMinus'] = f"{new_aMinus:.2f}"
            row['checksum'] = f"{new_checksum:.2f}"

with open(csv_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

capped = sum(1 for v in updates.values() if abs(v[2]) == 0.50)
print(f"\nDone. {len(updates)} rows updated, {capped} capped to 0.50.")
