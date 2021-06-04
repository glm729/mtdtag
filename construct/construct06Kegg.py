#!/usr/bin/env python3


# Required imports
# -----------------------------------------------------------------------------


import json
import functools as ft
import multiprocessing as mp


# Function definitions
# -----------------------------------------------------------------------------


# Helper to read and parse a JSON file
def read_json(path):
    with open(path, "r") as file:
        data = file.read().rstrip()
    return json.loads(data)


# Helper to get a certain nested element in a dict, else None
def acquire(data, frag):
    f = frag.split("|")
    new_data = data
    while f:
        if not isinstance(new_data, dict):
            return None
        new = new_data.get(f[0], None)
        if new is None:
            return None
        new_data = new
        f = f[1:]
    return new_data


# Main operative function to acquire data from a KEGG Compound entry, according
# to input / output specification
def get_table_data(kegg_entry, keys):
    ndata = {}
    for k in keys:
        if keys[k] is None:
            continue
        acq = acquire(kegg_entry, keys[k])
        if acq is not None:
            if k == "Alias":
                acq.sort()
            ndata[k] = acq
    return ndata


# Helper to print a formatted message in the console
def msg(ty, tx):
    f = {
        "exit": "\033[7;31m EXIT \033[0m ",
        "ok":   "\033[7;32m  OK  \033[0m ",
        "warn": "\033[7;33m WARN \033[0m ",
        "info": "\033[7;34m INFO \033[0m "
    }
    print(f'{f[ty]}{tx}')
    return None


# Operations
# -----------------------------------------------------------------------------


# Define file paths
path = {
    "in": "../_data/outCollect09Kegg.json",
    "out": "../_data/outConstruct06Kegg.json"
}

# Define key mapping between table and KEGG data
keys = {
    "SMILES": None,
    "Name": None,
    "Alias": "NAME",
    "Molecular Formula": "FORMULA",
    "KEGG ID": "ENTRY|KEGG ID",
    "HMDB ID": "DBLINKS|HMDB",
    "CAS Registry Number": "DBLINKS|CAS",
    "InChI": None,
    "InChI Key": None
}

# Read in the table and the KEGG data
msg("info", "Reading KEGG Compound JSON")
kegg = read_json(path["in"])

# Run the main data operations across the KEGG data
msg("info", "Running main operations")
with mp.Pool(14) as worker_pool:
    func = ft.partial(get_table_data, keys=keys)
    result = worker_pool.map(func, kegg)

# Write the output JSON
msg("info", "Writing output file")
with open(path["out"], "w") as file:
    file.write(f'{json.dumps(result, indent=2)}\n')

msg("ok", "End of operations")
