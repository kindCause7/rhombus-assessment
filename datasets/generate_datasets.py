#!/usr/bin/env python3
"""Generate deterministic CSV fixtures for baseline, schema drift, and semantic drift tests."""

from __future__ import annotations

import csv
import random
from datetime import date
from pathlib import Path

SEED = 20250308
BASE_ROWS = 10_000
DUPLICATE_ROWS = 200
OUTPUT_DIR = Path(__file__).resolve().parent

FIELDNAMES = [
    "transaction_id",
    "customer_id",
    "customer_name",
    "email",
    "transaction_date",
    "amount_usd",
    "currency",
    "status",
    "quantity",
    "country",
]

FIRST_NAMES = ["Ava", "Noah", "Mia", "Liam", "Sofia", "Ethan", "Zoe", "Mateo"]
LAST_NAMES = ["Patel", "Smith", "Garcia", "Kim", "Brown", "Nguyen", "Martin", "Wilson"]
COUNTRIES = ["US", "CA", "GB", "AU", "DE"]
STATUSES = ["completed", "pending", "refunded", "cancelled"]


def make_rows() -> list[dict[str, object]]:
    rng = random.Random(SEED)
    rows: list[dict[str, object]] = []

    for index in range(1, BASE_ROWS + 1):
        first = FIRST_NAMES[index % len(FIRST_NAMES)]
        last = LAST_NAMES[(index * 3) % len(LAST_NAMES)]
        month = (index % 12) + 1
        # Days remain <= 12 so the semantic date drift stays syntactically valid and ambiguous.
        day = ((index * 5) % 12) + 1
        amount = f"{rng.uniform(2.5, 2500):.2f}"
        country = COUNTRIES[index % len(COUNTRIES)]
        status = STATUSES[index % len(STATUSES)]
        currency = "USD"
        email = f"{first.lower()}.{last.lower()}{index}@example.com"
        name = f"{first} {last}"

        # Deliberate quality problems, spread out so some rows have multiple issues.
        if index % 97 == 0:
            email = ""
        elif index % 89 == 0:
            email = f"{first.lower()}.{last.lower()}.invalid"
        if index % 113 == 0:
            name = f"  {name.upper()}  "
        elif index % 127 == 0:
            name = name.lower()
        if index % 131 == 0:
            country = country.lower()
        elif index % 173 == 0:
            country = "USA"
        if index % 149 == 0:
            currency = "usd"
        elif index % 181 == 0:
            currency = " USD "
        if index % 157 == 0:
            status = "COMPLETE"
        elif index % 191 == 0:
            status = "unknown"
        if index % 211 == 0:
            amount = f"-{rng.uniform(1, 100):.2f}"
        elif index % 223 == 0:
            amount = ""

        rows.append(
            {
                "transaction_id": f"TX-{index:07d}",
                "customer_id": f"C-{((index - 1) % 2400) + 1:05d}",
                "customer_name": name,
                "email": email,
                "transaction_date": date(2024, month, day).strftime("%m/%d/%Y"),
                "amount_usd": amount,
                "currency": currency,
                "status": status,
                "quantity": (index % 8) + 1,
                "country": country,
            }
        )

    # Append exact duplicate records to test deduplication and row-count assertions.
    duplicate_indexes = rng.sample(range(BASE_ROWS), DUPLICATE_ROWS)
    rows.extend(rows[index].copy() for index in duplicate_indexes)
    return rows


def write_csv(filename: str, fieldnames: list[str], rows: list[dict[str, object]]) -> None:
    path = OUTPUT_DIR / filename
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    baseline = make_rows()
    write_csv("baseline.csv", FIELDNAMES, baseline)

    write_csv(
        "schema-drop-country.csv",
        [field for field in FIELDNAMES if field != "country"],
        baseline,
    )

    renamed_rows = [
        {("transaction_amount_usd" if key == "amount_usd" else key): value for key, value in row.items()}
        for row in baseline
    ]
    renamed_fields = [
        "transaction_amount_usd" if field == "amount_usd" else field for field in FIELDNAMES
    ]
    write_csv("schema-rename-amount.csv", renamed_fields, renamed_rows)

    typed_rows = []
    quantity_words = {1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight"}
    for row in baseline:
        changed = row.copy()
        quantity = int(changed["quantity"])
        changed["quantity"] = quantity_words[quantity] if quantity % 2 else f"{quantity} units"
        typed_rows.append(changed)
    write_csv("schema-type-quantity.csv", FIELDNAMES, typed_rows)

    added_rows = []
    channels = ["web", "mobile", "store", "partner"]
    for index, row in enumerate(baseline):
        changed = row.copy()
        changed["source_channel"] = channels[index % len(channels)]
        added_rows.append(changed)
    added_fields = [*FIELDNAMES, "source_channel"]
    write_csv("schema-add-channel.csv", added_fields, added_rows)

    combined_rows = []
    combined_fields = [
        "transaction_id",
        "customer_id",
        "customer_name",
        "email",
        "transaction_date",
        "transaction_amount_usd",
        "currency",
        "status",
        "quantity",
        "source_channel",
    ]
    for index, row in enumerate(baseline):
        changed = {key: value for key, value in row.items() if key != "country"}
        changed["transaction_amount_usd"] = changed.pop("amount_usd")
        quantity = int(changed["quantity"])
        changed["quantity"] = quantity_words[quantity] if quantity % 2 else f"{quantity} units"
        changed["source_channel"] = channels[index % len(channels)]
        combined_rows.append(changed)
    write_csv("schema-combined.csv", combined_fields, combined_rows)

    cents_rows = []
    for row in baseline:
        changed = row.copy()
        amount = str(changed["amount_usd"])
        if amount:
            changed["amount_usd"] = f"{float(amount) * 100:.2f}"
        cents_rows.append(changed)
    write_csv("semantic-amount-cents.csv", FIELDNAMES, cents_rows)

    dmy_rows = []
    for row in baseline:
        changed = row.copy()
        month, day, year = str(changed["transaction_date"]).split("/")
        changed["transaction_date"] = f"{day}/{month}/{year}"
        dmy_rows.append(changed)
    write_csv("semantic-date-dmy.csv", FIELDNAMES, dmy_rows)

    print(f"Generated 8 datasets with {len(baseline):,} rows each in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
