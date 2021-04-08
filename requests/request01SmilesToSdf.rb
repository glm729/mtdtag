#!/usr/bin/env ruby

# Rework of request00SmilesToSdf.rb

# Required packages
# -----------------------------------------------------------------------------

require "json"


# Function definitions
# -----------------------------------------------------------------------------

# Read in the names file
def readNames(path)
  return File.read(path).rstrip.split(/\n/).map{|r| r.downcase.split(/\|/)}
end

# Read in the table JSON
def readTable(path)
  return JSON.parse(File.read(path).rstrip)
end

# Initialise the log entry
def initLog(data)
  n = data[:names].join("; ")
  l = data[:data].length
  p = (l === 1) ? "y" : "ies"
  return %Q_- NAME:  #{n}\n  #{l} matching entr#{p}\n_
end

# Main function for processing entries
def processEntries(data)
  # Initialise output hash and kick if no data
  out = {:log => initLog(data), :data => String.new()}
  # Loop over the data, if any
  data[:data].each_with_index do |dat, i|
    # Boot if frowns
    if dat["smiles"].nil?
      out[:log] += "  No SMILES code for entry #{i + 1}\n"
      next
    end
    # Get OpenBabel output
    out[:data] += obabelOutput(data[:names].join("; "), dat["smiles"])
  end
  return out
end

# Get required output from OpenBabel conversion operation
def obabelOutput(name, smiles)
  insert = %Q_>  <id>\n#{smiles}\n\n>  <Name>\n#{name}\n\n$$$$_
  response = %x_obabel -:"#{smiles}" -osdf --gen2D_.rstrip.split(/\n/)
  response[-1] = insert
  return response.join("\n")
end


# Operations
# -----------------------------------------------------------------------------

# Store paths
path = {
  :in => {
    :names => "../data/dataRequest00MetaboliteNames.txt",
    :table => "../data/dataArrange02Table.json"
  },
  :out => {
    :log => "../data/logRequest01SmilesToSdf.txt",
    :data => "../data/outRequest01SmilesToSdf.sdf"
  }
}

# Read in the names and the table
names = readNames(path[:in][:names])
table = readTable(path[:in][:table])

# Initialise the overarching results object
result = Array.new()
names.each{|g| result << {:names => g, :data => Array.new()}}

# Loop over the table and find the matching entries
table.each do |ent|
  al = ent["alias"].map(&:downcase)
  result.each{|res| res[:data] << ent if res[:names].any?{|n| al.any?(n)}}
end

# Initialise the output files
file = {:log => Array.new(), :data => Array.new()}

# For each entry in the results, process and append results
result.each{|res| processEntries(res).each{|k, v| file[k] << v}}

# Write out
path[:out].each do |k, v|
  File.open(v, :mode => "w"){|f| f.write(file[k].join("\n"))}
end

# Operations complete
exit 0
