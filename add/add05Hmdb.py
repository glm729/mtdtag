#!/usr/bin/env python3


# Required imports
# -----------------------------------------------------------------------------


import json
import functools as ft
import multiprocessing as mp


# Function definitions
# -----------------------------------------------------------------------------


# Helper to read and parse a JSON
def read_json(path):
    with open(path, "r") as file:
        data = file.read().rstrip()
    return json.loads(data)


# Helper to merge two different lists of strings
def merge_aliases(set_a, set_b):
    set_n = [s for s in set_a]
    for s in set_b:
        if s not in set_n:
            set_n.append(s)
    set_n.sort()
    return set_n


# Operative function to collect HMDB data for the current table entry
def get_data(table_entry, hmdb_short, keys):
    # Get data for current ID and cancel if none
    data = hmdb_short.get(table_entry["KEGG ID"], None)
    if data is None:
        return table_entry
    # Initialise new data and loop keys
    ndata = {}
    for k in keys:
        d = data.get(k, None)
        t = table_entry.get(k, None)
        # Use current if no new data
        if d is None:
            ndata[k] = t
            continue
        # Use new if no current data
        if t is None:
            ndata[k] = d
            continue
        # Special case for aliases
        if k == "Alias":
            ndata[k] = merge_aliases(d, t)
            continue
        # Cancel on ANY conflict
        if d != t:
            return table_entry
        # Enter the data (at this stage, d should be t
        ndata[k] = d
    return ndata


# Helper to print a formatted message in the console
def msg(ty, tx):
    f = {
        "exit": "\033[7;31m EXIT \033[0m ",
        "ok":   "\033[7;32m  OK  \033[0m ",
        "warn": "\033[7;33m WARN \033[0m ",
        "info": "\033[7;34m INFO \033[0m ",
        "data": "\033[7;36m DATA \033[0m "
    }
    print(f'{f[ty]}{tx}')
    return None


# Operations
# -----------------------------------------------------------------------------


# Define file paths
path = {
    "in": {
        "hmdb": "../_data/outCollect08Hmdb.json",
        "table": "../_data/outConstruct06Kegg.json"
    },
    "out": "../_data/outAdd05Hmdb.json"
}

# Define keys to search by
keys = [
    "SMILES",
    "Name",
    "Alias",
    "Molecular Formula",
    "KEGG ID",
    "HMDB ID",
    "CAS Registry Number",
    "InChI",
    "InChI Key",
    "ChEBI ID",
    "ChemSpider ID",
    "PubChem ID"
]

# Read and parse input JSON data
msg("data", "Reading input data")
hmdb = read_json(path["in"]["hmdb"])
table = read_json(path["in"]["table"])

# Get the KEGG IDs seen in HMDB with only one entry
msg("info", "Subsetting HMDB data to unique KEGG IDs")
seen = {}
for h in hmdb:
    k = h.get("KEGG ID", None)
    # Skip if no KEGG ID
    if k is None:
        continue
    # Initialise seen if not currently found
    if seen.get(k, None) is None:
        seen[k] = {"n": 1, "data": h}
        continue
    # Increment and append data if already found
    seen[k]["n"] += 1

# Get the IDs found and initialise a store
ids = list(seen.keys())
uniq = {}
for i in ids:
    # If exactly one HMDB entry, keep the data
    if seen[i]["n"] == 1:
        uniq[i] = seen[i]["data"]

# Run the worker pool to collect / merge the data
msg("info", "Running worker pool -- merging non-ambiguous data")
with mp.Pool(14) as worker_pool:
    func = ft.partial(get_data, hmdb_short=uniq, keys=keys)
    result = worker_pool.map(func, table)

# Write output
msg("data", f'Writing output file:  {path["out"]}')
with open(path["out"], "w") as file:
    file.write(f'{json.dumps(result, indent=2)}\n')

# All finished
msg("ok", "End of operations")
