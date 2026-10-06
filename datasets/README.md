# Test datasets

All fixtures are deterministic and contain **10,200 data rows**: 10,000 generated transactions plus 200 exact duplicate rows. Regenerate them with:

```bash
python3 datasets/generate_datasets.py
```

## Deliberate baseline issues

`baseline.csv` contains:

- exact duplicate records;
- missing and malformed email addresses;
- missing and negative amounts;
- inconsistent customer-name casing and surrounding whitespace;
- inconsistent currency casing and surrounding whitespace;
- inconsistent country codes (`us`, `USA`, etc.);
- invalid/inconsistent statuses (`COMPLETE`, `unknown`);
- repeated customer IDs across otherwise distinct transactions.

The intended baseline schema is:

`transaction_id, customer_id, customer_name, email, transaction_date, amount_usd, currency, status, quantity, country`

Dates use `MM/DD/YYYY`, amounts are dollars, and `quantity` is an integer in the baseline.

## Drift fixtures

| File | Isolated change |
|---|---|
| `schema-drop-country.csv` | Drops `country` |
| `schema-rename-amount.csv` | Renames `amount_usd` to `transaction_amount_usd` |
| `schema-type-quantity.csv` | Changes integer quantities to text such as `one` and `2 units` |
| `schema-add-channel.csv` | Adds `source_channel` |
| `schema-combined.csv` | Applies drop, rename, type change, and added column together |
| `semantic-amount-cents.csv` | Keeps the schema but changes amount values from dollars to cents |
| `semantic-date-dmy.csv` | Keeps the schema but changes date meaning from `MM/DD/YYYY` to `DD/MM/YYYY` |

Dates intentionally use days 1–12, making the date semantic drift syntactically valid and ambiguous. Missing amounts remain missing in the cents fixture.
