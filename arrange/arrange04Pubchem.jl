#!/usr/bin/env julia


# Required packages
# -----------------------------------------------------------------------------

using JSON


# Function definitions
# -----------------------------------------------------------------------------

# Helper to read and parse a JSON
function read_json(path::String)
  return JSON.parse(join(readlines(path), "\n"))
end

# Helper to return a canonical SMILES code, or nothing
function get_canonical_smiles(props)
  local subset = filter(
    p -> p["urn"]["label"] === "SMILES" && p["urn"]["name"] === "Canonical",
    props
  )
  return length(subset) !== 1 ? nothing : subset[1]["value"]["sval"]
end

# Helper to get props data for the (k, v) pair in the target info
function get_props_data(props, k, v)
  local subset = filter(p -> p["urn"]["label"] === v, props)
  if length(subset) === 0
    return nothing
  end
  return map(s -> s["value"]["sval"], subset)
end

# Abstracted map function to sift and arrange the PubChem data
function sift_data(d, info)
  # Initialise output and shorthand variables
  local out = Dict{String,Any}()
  local props = d["props"]
  local pcid = [string(d["id"]["id"]["cid"])]
  # Set the SMILES code and the PubChem ID
  out["smiles"] = get_canonical_smiles(props)
  out["id"] = Dict{String,Array{String,1}}("pubchem" => pcid)
  # Loop over the info key-value pairs
  for (k, v) in info[:main]
    out[k] = get_props_data(props, k, v)
  end
  for (k, v) in info[:id]
    out["id"][k] = get_props_data(props, k, v)
  end
  # If there are any aliases, get sorted and unique only
  if out["alias"] !== nothing
    sort!(unique!(out["alias"]))
  end
  return out
end


# Operations
# -----------------------------------------------------------------------------

# Define paths to use
path = Dict{Symbol,String}(
  :in => "../data/outCollect04Pubchem_rb.json",
  :out => "../data/outArrange04Pubchem.json"
)

# Set the info to look for, and under what name
info = Dict{Symbol,Dict{String,String}}(
  :main => Dict{String,String}(
    "molecular_formula" => "Molecular Formula",
    "alias" => "IUPAC Name",
  ),
  :id => Dict{String,String}(
    "inchi" => "InChI",
    "inchi_key" => "InChIKey"
  )
)

# Get the data to target
data = reduce(
  (a, c) -> push!(a, c["data"]["PC_Compounds"][1]),
  read_json(path[:in])["found"];
  init = Array{Any,1}()
)

# Initialise sifted output
sift = map(d -> sift_data(d, info), data)

# Write out of the park
open(path[:out], "w") do file
  write(file, JSON.json(sift, 2))
end
