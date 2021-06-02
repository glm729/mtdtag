#!/usr/bin/env ruby


# Required gems
# -----------------------------------------------------------------------------


require "json"


# Function definitions
# -----------------------------------------------------------------------------


# Helper function to read and parse a JSON file
def read_json(path)
  return JSON.parse(File.read(path).rstrip)
end

# Helper function to get the required data for each entry
def get_data(data, keys)
  store = Hash.new
  keys.each do |k, v|
    next if data[v].nil?
    s = data[v].strip
    next if s.empty?
    store[k] = s
  end
  store
end

# Helper to print a message in the console during ops
def msg(ty, tx)
  f = {
    :exit => "\033[7;31m EXIT \033[0m ",
    :ok   => "\033[7;32m  OK  \033[0m ",
    :warn => "\033[7;33m WARN \033[0m ",
    :info => "\033[7;34m INFO \033[0m ",
  }
  print("#{f[ty]}#{tx}\n")
  nil
end


# Operations
# -----------------------------------------------------------------------------


# Define the file paths to use
path = {
  :in => "../_data/pathbank/pathbank_all_metabolites.json",
  :out => "../_data/outConstruct04Pathbank.json"
}

# Set the keys to check by
keys = {
  "SMILES" => "SMILES",
  "Name" => "Metabolite Name",
  "Alias" => "IUPAC",
  "Molecular Formula" => "Formula",
  "KEGG ID" => "KEGG ID",
  "HMDB ID" => "HMDB ID",
  "InChI" => "InChI",
  "InChI Key" => "InChI Key"
}

# Read and parse the PathBank data
msg(:info, "Reading PathBank JSON")
data = read_json(path[:in])

# Get the new data from the current data (effectively a subset)
msg(:info, "Subsetting data")
new_data = data.map {|d| get_data(d, keys) }

# Place alias in an array
new_data.each {|n| n["Alias"] = [n["Alias"]] }

# Write the output file
msg(:info, "Writing output file")
File.open(path[:out], :mode => "w") do |file|
  file.write("#{JSON.pretty_generate(new_data)}\n")
end

# All done
msg(:ok, "End of operations")
exit 0
