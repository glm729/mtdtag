#!/usr/bin/env ruby


# Required packages
# -----------------------------------------------------------------------------

require "json"


# Function definitions
# -----------------------------------------------------------------------------

# Read and parse a JSON file, using the JSON gem
def read_json(path)
  return JSON.parse(File.read(path).rstrip)
end

# Add to an array of data in the table
def add_data_array(data_old, data_new)
  return data_old.sort if data_new.nil?
  data_old = Array.new if data_old.nil?
  data_new.each do |dat|
    data_old << dat if not data_old.any?(dat)
  end
  return data_old.sort
end

# Add to the IDs object in the table
def add_data_ids(id_old, id_new)
  return id_old.map{|id| id.sort} if id_new.nil?
  id_old = Hash.new if id_old.nil?
  id_new.each do |k, val|
    id_old[k] = Array.new if id_old[k].nil?
    val.each{|v| id_old[k] << v if not id_old[k].any?(v)}
    id_old[k].sort!
  end
  return id_old
end


# Operations
# -----------------------------------------------------------------------------

# Define paths
path = {
  :in => {
    :table => "../data/outArrange02Table.json",
    :hmdb => "../data/outArrange03Hmdb.json"
  },
  :out => "../data/outAdd03Hmdb.json"
}

# Read and parse the table and HMDB data
table = read_json(path[:in][:table])
hmdb = read_json(path[:in][:hmdb])

# Loop over the HMDB data
hmdb.each do |dh|
  # Subset the table, and skip if no matching SMILES
  subset = table.filter{|t| dh["smiles"].any?(t["smiles"])}
  next if subset.length === 0
  # Loop over the subset and add to the aliases and DB IDs
  subset.each do |sub|
    sub["alias"] = add_data_array(sub["alias"], dh["alias"])
    sub["id"] = add_data_ids(sub["id"], dh["id"])
  end
end

# Write out, in pretty format
File.open(path[:out], :mode => "w") do |file|
  file.write("#{JSON.pretty_generate(table)}\n")
end

# All done
exit 0
