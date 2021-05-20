#!/usr/bin/env python3


# Module imports
# -----------------------------------------------------------------------------


import multiprocessing as mp
import csv
import json
import os


# Function definitions
# -----------------------------------------------------------------------------


# Generate a dummy header of length `l`
def dummy_header(l):
    return ["X{0}".format(str(i).rjust(len(str(l)), "0") for i in range(0, l))]


# Read and parse a CSV as a dict
def parse_csv(path, header=True):
    # Requires import `csv`
    result = []
    with open(path, "r") as file:
        reader = csv.reader(file)
        data = [row for row in reader]
    if header:
        head = data[0]
        data = data[1:]
    else:
        head = dummy_header(len(data[0]))
    return [dict([[head[i], r[i]] for i in range(0, len(head))]) for r in data]


# Run parse_csv for an array of paths -- mainly for use in a process pool
def multi_parse_csv(paths, header=True):
    return [parse_csv(path, header=header) for path in paths]


# Operations
# -----------------------------------------------------------------------------


# Define the number of processes to use
nproc = 12

# Define input directory and output file
path = {
    "dir": "../../smpdb/data/smpdb_metabolites",
    "out": "../../smpdb/data/smpdb_metabolites.json"
}

# List the files to grab in the input directory
files = os.listdir(path["dir"])

# Get the number of files
nfiles = len(files)

# If nfiles mod nproc is 0, the group sizes are all equal
# Else, add one to the truncated integer, and the last group is smaller
group_size = int(nfiles / nproc)
if nfiles % nproc > 0:
    group_size += 1

# Get all file paths
file_paths = [f'{path["dir"]}/{file}' for file in files]

# Initialise groups and current group index
groups = [[]]
idx = 0

# Loop over the file paths
for file in file_paths:
    # Start a new group and increment index if current one is at max. size
    if len(groups[idx]) == group_size:
        groups.append([])
        idx += 1
    # Append the file path to the current group
    groups[idx].append(file)

# Initialise the pool of process workers
pool = mp.Pool(processes=nproc)

# Parse the CSVs
parse_result = pool.map(multi_parse_csv, groups)

# Initialise output object
data = []

# Loop over the results
for result in parse_result:
    # Loop over the parsed CSVs
    for csv in result:
        # Loop over the converted rows
        for row in csv:
            # Append to the output data
            data.append(row)

# Write the output JSON
with open(path["out"], "w") as file:
    file.write(json.dumps(data, indent = 2) + "\n")

# Close the process pool
pool.close()

# That was quick, I'm impressed.  Running it in a single process wasn't
# terrible, but it was certainly slow.  This is much better!
