# Seed Data

## `schools.csv`

Authoritative initial School Directory input supplied for the pilot. The repository copy contains 17 rows and these required columns:

- `schoolName` - Thai display name
- `smis_code` - official SMIS identifier, imported as a string
- `moe_code` - Ministry of Education identifier, imported as a string

The seed process must validate required values, UTF-8 decoding, and uniqueness of all three columns before writing anything. It then upserts by `moe_code`, requires `smis_code` to remain unique, reports differences instead of silently renaming an existing School, and assigns parent ESAO code `1000960001` from explicit seed configuration because the CSV does not contain an ESAO code.

Source observed at `C:\Users\Pkjgr\Downloads\schools.csv` on 2026-08-07. Do not make runtime behavior depend on that machine-local path.
