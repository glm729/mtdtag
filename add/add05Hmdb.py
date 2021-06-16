#!/usr/bin/env python3


# Required imports
# -----------------------------------------------------------------------------


import json
import argparse as ap
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
def merge_data(entry, key, hmdb_alt, merge_keys):
    # Get ID of current table entry and quit if None
    ident = entry.get(key, None)
    if ident is None:
        return entry
    # Get data for current ID and cancel if none
    data = hmdb_alt.get(ident, None)
    if data is None:
        return entry
    # Initialise new data and loop keys
    ndata = entry.copy()
    for k in merge_keys:
        d = data.get(k, None)
        t = entry.get(k, None)
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
            return entry
        # Enter the data (at this stage, d should be t)
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


# Helper function to convert an array of dicts into a dict, whereby each key is
# a unique value of data for a specific key
def arrange_alt(data, key):
    short = {}
    for entry in data:
        d = entry.get(key, None)
        if d is not None:
            if short.get(d, None) is not None:
                short[d]["__keep"] = False
                continue
            short[d] = entry
    final = {}
    for s in short:
        if short[s].get("__keep", True):
            final[s] = short[s].copy()
    return final


# Operations
# -----------------------------------------------------------------------------


# Parse arguments
aps = ap.ArgumentParser()
aps.add_argument(
    "--table",
    help="Table to merge into")
aps.add_argument(
    "--hmdb",
    help="HMDB data to merge from")
aps.add_argument(
    "--output-file",
    help="Output JSON filename")
aps.add_argument(
    "--keys",
    help="""
        Keys to merge by, common to both the table and HMDB, delimited by a
        pipe character.  Ordering may or may not be important!
        The key will be created in the table if it does not already exist.
    """)
aps.add_argument(
    "--num-cores",
    type=int,
    help="Optional argument to specify the number of CPU cores to use")
args = aps.parse_args()

# Get the number of cores to use
if args.num_cores is None:
    ncores = mp.cpu_count() - 2
    if ncores < 1:
        ncores = 1
else:
    ncores = args.num_cores

# Sort out the keys
keys = args.keys.split("|")
msg("info", f'Found {len(keys)} keys')

# Define keys to search by -- CURRENTLY HARDCODED, ACCORDING TO TABLE SPEC
set_keys = [
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

# Append the new keys to append to the table entries, if any
for k in keys:
    if k not in set_keys:
        set_keys.append(k)

# Don't merge self, no need
merge_keys = [k for k in set_keys if k not in keys]

# Read and parse input JSON data
msg("data", "Reading input data")
hmdb = read_json(args.hmdb)
table = read_json(args.table)

# Run the worker pool to collect / merge the data
msg("info", "Running worker pool -- merging non-ambiguous data")
with mp.Pool(ncores) as worker_pool:
    while keys:
        msg("info", f'Arranging HMDB data by key:  {keys[0]}')
        hmdb_alt = arrange_alt(hmdb, keys[0])
        func = ft.partial(
            merge_data,
            key=keys[0],
            hmdb_alt=hmdb_alt,
            merge_keys=merge_keys)
        msg("info", "Merging data")
        table = worker_pool.map(func, table)  # Overwrites self
        keys = keys[1:]

# Reorder the key-value pairs according to the set keys
msg("info", "Reordering table entry key-value pairs")
ntable = []
for tab in table:
    nt = {}
    for k in set_keys:
        t = tab.get(k, None)
        if t is not None:
            nt[k] = t
    ntable.append(nt)

# Write output
msg("data", f'Writing output file:  {args.output_file}')
with open(args.output_file, "w") as file:
    file.write(f'{json.dumps(ntable, indent=2)}\n')

# All finished
msg("ok", "End of operations")
