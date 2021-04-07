# Request:  Convert SMILES to SDF (Molfile)
## Revision of previous attempt
#### Mr. George L. Malone
#### 7<sup>th</sup> of April, 2021


### Overview

The purpose of this request was to query the table data given a list of
metabolite names, and convert any SMILES codes found into SDF / Molfile data.
The operations were completed using the Ruby programming language.  Most data
were successfully converted.  Four names with at least one entry did not
feature a SMILES code, three names did not feature any matching entries, and
two names were found to have two matching entries.


### Input data

The original input data are the corrected or cleaned data from the previous
attempt.  The data may be cleaned or edited and the operations reattempted in
future.  The data are a list of names separated by newlines, where, if multiple
names are present or required for a single entry, each name is separated by the
pipe character.


### Operations

This revision approaches data handling somewhat differently to the previous
attempt.  The Ruby programming language is used, in which the JSON gem
(package) is required to parse the JSON containing the table data.

The input file is read in and split by newline.  The resulting array is mapped
over, whereby each row is pushed to lowercase and split by the pipe character.
The table JSON is read in and parsed, using the JSON gem.

The table is looped over and entries are pushed to the results object if any of
the aliases of the current entry match any of the target names.  The pushed
data are stored in relation to which names were found to match.

The resulting data are reorganised and, if a SMILES code is present, the SMILES
code is converted from SMILES to SDF by the OpenBabel command-line utility.
The output from the OpenBabel conversion is edited to include associated data
(SMILES code and names).

After all table and name data are operated on, the log file and output SDF are
written, which concludes the operations of this script.  This script is much
faster than that of `request00`, and produces more precisely-formatted output
data.


### Results

Three names did not match any aliases in the table data.  Four matching names
did not feature SMILES codes, suggesting that these names were matched in data
added from KEGG Compound -- KEGG Compound entries do not feature a SMILES code.
Citric acid and 1-Methylhistidine each matched with two entries in the table,
and the SMILES codes were converted successfully.  A total of 15 SMILES codes
were converted, given the original 20 names or name groups.


### Operations script

```ruby
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
    :log => "../data/logRequest00SmilesToSdf.txt",
    :out => "../data/outRequest00SmilesToSdf.sdf"
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
```
