#!/usr/bin/env ruby


# Required packages
# -----------------------------------------------------------------------------

require("json")


# Function definitions
# -----------------------------------------------------------------------------

# Read the input names file
def readInputNames(path)
  return File.read(path).split(/\n/).map{|r| r.downcase.split(/\|/)}
end

# Read and parse the table JSON
def readTableJson(path)
  return JSON.parse(File.read(path).gsub(/\s+$/, ''))
end

# Subset the table according to the current name group
def subsetTable(table, names)
  out = Array.new()
  table.each do |t|
    al = t["alias"].map{|a| a.downcase}
    out << t if names.any?{|n| al.any?(n)}
  end
  return out
end

# Send a shell command to obabel
def obabelData(name, smiles, dim = "2")
  return %x_obabel -:"#{smiles}" -osdf --gen#{dim.to_s}D_
end

# String to return if no data for current metabolite
def ifNoData(name)
  return %Q_NAME:    #{name}\nSMILES:\n\nNO DATA\n$$$\n_
end

# Handle data if data present
def eachDatum(name, smiles, dim)
  store = Array.new()
  store << %Q_NAME:    #{name}\nSMILES:  #{smiles}_
  if smiles === nil
    store.last.rstrip!
    store << "\nNO SMILES\n$$$\n"
    return store
  end
  store << obabelData(name, smiles, dim)
  return store
end

# Get output to add to results array
def getOutput(name, data, dim)
  out = Array.new()
  if data.length === 0
    out << ifNoData(name)
    return out
  end
  data.each{|entry| eachDatum(name, entry["smiles"], dim).each{|e| out << e}}
  return out
end


# Read and parse files
# -----------------------------------------------------------------------------

# Read the required files
path = {
  :names => "../../sync/data/metabolite_name_list.txt",
  :table => "../../sync/data/reference/arrange02Table.json"
}

# Get the names and the table data
names = readInputNames(path[:names])
table = readTableJson(path[:table])


# Operations
# -----------------------------------------------------------------------------

# Initialise results array
output = Array.new()

# For each name
names.each do |n|
  # Subset the table and push the data to the output array
  sub = subsetTable(table, n)
  getOutput(n.join("; "), sub, dim = "2").each{|o| output << o}
end

# Open the output file and write the string
File.open("./opRequest00SmilesSdf.txt", :mode => "w") do |f|
  f.write(output.join("\n"))
end

# Operations complete
exit(0)
