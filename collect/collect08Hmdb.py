#!/usr/bin/env python3


# Required imports
# -----------------------------------------------------------------------------


import json
import os
import functools as ft
import multiprocessing as mp
import xmltodict as xd


# Function definitions
# -----------------------------------------------------------------------------


# Helper to read and parse an XML (as dict)
def read_xml(path):
    with open(path, "r") as file:
        data = file.read()
    return xd.parse(data)


# Helper to attempt to acquire a specific nested dict element
# Returns `None` if no exact match
def acquire(obj, frag):
    f = frag.split("|")  # Hardcoded -- split keys by vertical bar
    data = obj  # Does this even do anything useful?
    while f:
        # If no keys to access, reject
        if not isinstance(data, dict):
            return None
        new = data.get(f[0], None)
        # If key does not exist, reject
        if new is None:
            return None
        # Replace with the new data, and slice f
        data = new
        f = f[1:]
    return data


# Helper function to get data from a current object according to node spec
def get_data(obj, node_set):
    output = {}
    for node in node_set:
        data = acquire(obj, node_set[node])
        if data is None:
            continue
        # Special consideration -- Alias must be an array
        if node == "Alias":
            if isinstance(data, str):
                output[node] = [data]
                continue
        output[node] = data
    return output


# Shorthand function to read an XML (and pick metabolite section only),
# then run `get_data`
def read_get(path, node_set):
    xml = read_xml(path)["hmdb"]["metabolite"]
    return get_data(xml, node_set)


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


# Set file paths
path = {
    "in": "../../hmdb/data/hmdb_metabolites",
    "out": "../_data/outCollect08Hmdb.json"
}

# Specify node structure to check against
nodes = {
    "SMILES": "smiles",
    "Name": "name",
    "Alias": "synonyms|synonym",
    "Molecular Formula": "chemical_formula",
    "KEGG ID": "kegg_id",
    "HMDB ID": "accession",
    "CAS Registry Number": "cas_registry_number",
    "InChI": "inchi",
    "InChI Key": "inchikey",
    "ChEBI ID": "chebi_id",
    "ChemSpider ID": "chemspider_id",
    "PubChem ID": "pubchem_compound_id"
}

# Read the files in the input directory
files = os.listdir(path["in"])
files.sort()

# Extract the HMDB IDs -- all are formatted as `ID.xml`, so split by dot
ids = [f.split(".")[0] for f in files]

# Get the "full" file path for each file
files = [f'{path["in"]}/{f}' for f in files]

# Open the worker pool and collect the data
msg("info", "Collecting data")
with mp.Pool(14) as pool:
    collect = ft.partial(read_get, node_set=nodes)
    result = pool.map(collect, files)

# Write the output file
msg("info", "Writing output file")
with open(path["out"], "w") as file:
    file.write(f'{json.dumps(result, indent=2)}\n')

# All done
msg("ok", "End of operations")
