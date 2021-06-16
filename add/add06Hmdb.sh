#!/bin/sh

# Define file paths for the table, HMDB data, and output file
TABLE="../_data/outConstruct06Kegg.json"
HMDB="../_data/outCollect08Hmdb.json"
OUTPUT="../_data/outAdd06Hmdb.json"

# Define keys to use, with pipe character delimiter
KEYS="Molecular Formula|KEGG ID|CAS Registry Number"

# Run the script with declared options
python3 ./add05Hmdb.py \
  --table="$TABLE" \
  --hmdb="$HMDB" \
  --output-file="$OUTPUT" \
  --keys="$KEYS" \
  --num-cores=14
