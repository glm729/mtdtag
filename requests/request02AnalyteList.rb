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
