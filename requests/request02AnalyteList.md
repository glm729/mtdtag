# Request:  Add data to an analyte list
#### Mr. George L. Malone
#### 9<sup>th</sup> of April, 2021


### Overview

The purpose of these operations is to add chemical identifiers to a provided
analyte list.  The primary data of interest is the InChI ID.  Additional IDs
may be checked and added if not already present.


### Background data

The minimum required background data were those within the table, contained in
the JSON file.  Otherwise, input data were provided in XLS format, and were
converted to TSV.


### Operations

The Ruby programming language was used to perform the operations.  The data
were read in and parsed, using the JSON gem and a function defined for reading
TSV-formatted data.  For each row in the input data, the table data were subset
by matching KEGG ID and checked before proceeding.  If the subset contained one
InChI ID that was not already defined, it was added to the current row,
otherwise no actions were taken, to modify the current row.


### Results

Four of the 29 entries had an InChI assigned.  One entry already had an InChI
ID defined.  All other entries were found to feature at least one table entry
in the subset, but did not feature InChI IDs.  No other IDs have been included
at this time.


### Discussion and Conclusions

The data without InChI IDs are likely "KEGG-only" entries -- that is, the data
are exclusively from KEGG and do not contain PathBank data.  KEGG does not
record the InChI ID, whereas PathBank does, therefore the four successfully
retrieved data are those which were found in the PathBank data with an
associated KEGG ID.

The entry with an InChI ID defined was not checked for whether the ID found
matched what was already present.  This is a possible extension or improvement.

A further extension may be to query data from other databases in the absence of
current data.  This is a possible extension to the current data in the table.
Data missing InChI IDs appear to likely be missing other database links,
therefore this may be difficult or not possible at the current time.


### Script

```ruby
#!/usr/bin/env ruby

# Packages required
# -----------------------------------------------------------------------------

require "json"


# Function definitions
# -----------------------------------------------------------------------------

# Generate a dummy header
def dummy_header(length)
  return (0...length).map{|i| %Q_X#{i.to_s.rjust(length.to_s.length, "0")}_}
end

# Read a raw TSV as an array of hashes
def read_tsv(path, header = true, nil_values = [''])
  output = Array.new
  content = File.read(path).rstrip.split(/\n/).map{|r| r.split(/\t/)}
  if header
    head = content[0]
    content.shift
  else
    head = dummy_header(content[0].length)
  end
  content.each do |c|
    d = head.map.with_index{|h, i| [h, (nil_values.any?(c[i])) ? nil : c[i]]}
    output << d.to_h
  end
  return output
end

# Generate TSV-formatted data from an array of hashes
def make_tsv(data)
  output = Array.new
  keys = data[0].map{|k, v| k}
  output << keys.join("\t")
  data.each{|d| output << d.map{|_, e| e}.join("\t")}
  return %Q_#{output.join("\n")}\n_
end

# Abstracted, hardcoded function to filter by KEGG ID in the table
def filterKegg(json, datum)
  json.filter do |j|
    next if j["id"]["kegg"].nil?
    j["id"]["kegg"].any?(datum["KEGG"])
  end
end

# Abstracted, hardcoded function for checking current subset suitability
def checkSubset(data, subset)
  log = Array.new
  proceed = true
  case
  when subset.length === 0
    log << %Q_No matches found\n_
    proceed = false
  when subset.length > 1
    log << %Q_KEGG ID matches multiple entries, skipping\n_
    proceed = false
  when subset[0]["id"]["inchi"].nil?
    log << %Q_No InChI in matched data\n_
    proceed = false
  when (not data["InChI"].nil?)
    log << %Q_InChI already defined, skipping\n_
    proceed = false
  else
    log << %Q_Found one InChI, assigning to data\n_
  end
  return {:log => log, :proceed => proceed}
end


# Operations
# -----------------------------------------------------------------------------

# Define paths to use
path = {
  :in => {
    :json => "../data/dataArrange02Table.json",
    :data => "../data/Analyte_List_Template_Converted.tsv"
  },
  :out => {
    :log => "../data/logRequest02AnalyteList.txt",
    :out => "../data/outRequest02AnalyteList.json",
    :tsv => "../data/outRequest02AnalyteList.tsv"
  }
}

# Define hash of data
data = {
  :json => JSON.parse(File.read(path[:in][:json]).rstrip),
  :data => read_tsv(path[:in][:data])
}

# Initialise output data hash
out = {:log => Array.new, :out => Array.new, :tsv => nil}

# Loop over the input data and process
data[:data].each do |dat|
  out[:log] << %Q_KEGG ID:  #{dat["KEGG"]}\n_
  # Filter table data and check the subset
  sub = filterKegg(data[:json], dat)
  check = checkSubset(dat, sub)
  # If proceeding with setting an InChI ID, do so
  if check[:proceed]
    dat["InChI"] = sub[0]["id"]["inchi"][0]
  end
  # Push to the output data
  check[:log].each{|l| out[:log] << "  #{l}\n"}
  out[:out] << dat
end

# Set and clean the output data
out[:tsv] = make_tsv(out[:out])
out[:log] = "#{out[:log].join('').rstrip}\n"
out[:out] = "#{JSON.pretty_generate(out[:out])}\n"

# Write the output files
path[:out].each{|k, v| File.open(v, :mode => "w"){|f| f.write(out[k])}}

# Operations complete
exit 0
```
