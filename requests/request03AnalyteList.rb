#!/usr/bin/env ruby


# Required packages
# -----------------------------------------------------------------------------

require "json"


# Function definitions
# -----------------------------------------------------------------------------

# Helper method to filter the HMDB data by KEGG ID
class Array
  def filter_hmdb_by_kegg(kegg)
    self.filter do |dh|
      dh["id"]["kegg"].nil? ? false : dh["id"]["kegg"].any?(kegg)
    end
  end
end

# Helper to read a JSON using the JSON gem
def read_json(path)
  return JSON.parse(File.read(path).rstrip)
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
# Assumes all hashes feature the same keys
def make_tsv(data)
  output = Array.new
  keys = data[0].map{|k, v| k}
  output << keys.join("\t")
  data.each{|d| output << d.map{|_, e| e}.join("\t")}
  return %Q_#{output.join("\n")}\n_
end

# Helper to print a somewhat-formatted message to the console during ops
def msg(type, text)
  case type
  when "exit"
    print("[\033[31mEXIT\033[0m]  #{text}\n")
  when "ok"
    print("[\033[32m OK \033[0m]  #{text}\n")
  when "warn"
    print("[\033[33mWARN\033[0m]  #{text}\n")
  else
    print("        #{text}\n")
  end
end


# Operations
# -----------------------------------------------------------------------------

# Define paths to use
path = {
  :in => {
    :input => "../data/Analyte_List_Template_Converted.tsv",
    :hmdb => "../data/outArrange03Hmdb.json"
  },
  :out => "../data/outRequest03AnalyteList.tsv"
}

# Get input and HMDB data
input = read_tsv(path[:in][:input])
hmdb = read_json(path[:in][:hmdb])

# Define the key set to use
key_set = ["CAS", "PubChem", "ChemSpider", "HMDB", "InChI"]

# Loop over the input data (with index, for debug)
input.each_with_index do |data, i|
  # Filter the HMDB data
  subset = hmdb.filter_hmdb_by_kegg(data["KEGG"])
  # Skip with warning if length isn't exactly 1
  if subset.length != 1
    msg("warn", "Row #{i} filtered data length #{subset.length}")
    next
  end
  sub = subset[0]  # Shorthand
  # Loop over the keys
  key_set.each do |key|
    # Warn and skip if data already present (do not overwrite)
    if not data[key].nil?
      msg("warn", "Row #{i} key #{key} data already present")
      next
    end
    k = key.downcase  # Shorthand
    # Skarn and wip if HMDB data missing
    if sub["id"][k].nil?
      msg("warn", "Row #{i} key #{key} subset data missing")
      next
    end
    l = sub["id"][k].length  # Shorthand
    # Warp and skin if too many data in HMDB
    if l > 1
      msg("warn", "Row #{i} key #{key} subset data length #{l}")
      next
    end
    # Assign data
    data[key] = sub["id"][k][0]
  end
end

# Write data out as a TSV
File.open(path[:out], :mode => "w") do |file|
  file.write(make_tsv(input))
end

# Crow and quit
msg("ok", "Operations complete")
exit 0
