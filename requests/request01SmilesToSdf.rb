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
  return out if data[:data].length === 0
  # Loop over the data
  data[:data].each_with_index do |dat, i|
    # Boot if frowns
    if dat["smiles"].nil?
      out[:log] += "  No SMILES code for entry #{i + 1}.\n"
      next
    end
    # Get the desired OpenBabel output
    out[:data] += obabelOutput(data[:names].join("; "), dat["smiles"])
  end
  return out
end

# Get required output from OpenBabel conversion operation
def obabelOutput(name, smiles)
  insert = %Q_>  <id>\n#{smiles}\n\n>  <Name>\n#{name}\n\n$$$$\n_
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
    :out => "../data/outRequest01SmilesToSdf.sdf"
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
file = {:log => String.new(), :out => String.new()}

# For each entry in the results, process and push results out
result.each do |res|
  process = processEntries(res)
  file[:log] += "#{process[:log]}\n"
  file[:out] += process[:data]
end

# Clean trailing newline in the log file
file[:log] = "#{file[:log].rstrip}\n"

# Write out
File.open(path[:out][:log], :mode => "w"){|f| f.write(file[:log])}
File.open(path[:out][:out], :mode => "w"){|f| f.write(file[:out])}

# Operations complete
exit 0
