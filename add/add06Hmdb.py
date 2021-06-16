#!/usr/bin/env python3

# This is more of a "glue" script than anything else, to demonstrate expected
# usage for running add05Hmdb.py, particularly with regard to using multiple
# keys in sequence.


# Import subprocess to make the call to add05Hmdb.py
import subprocess as sp

# Define the paths to the table, HMDB data, and output file
table = "../_data/outConstruct06Kegg.json"
hmdb = "../_data/outCollect08Hmdb.json"
output = "../_data/outAdd06Hmdb.json"

# Define the keys to filter HMDB data by, and join by pipe character
keys = [
    "Molecular Formula",
    "KEGG ID",
    "CAS Registry Number"
]

joined_keys = "|".join(keys)

# Build the subprocess call
call = [
    "python3",
    "./add05Hmdb.py",
    f'--table={table}',
    f'--hmdb={hmdb}',
    f'--output-file={output}',
    f'--keys={joined_keys}',
    "--num-cores=14"
]

# Make the call
sp.run(call)
