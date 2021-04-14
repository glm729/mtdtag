#!/usr/bin/env ruby


# Required packages
# -----------------------------------------------------------------------------

require "json"


# Function definitions
# -----------------------------------------------------------------------------

# Filter the table by present of KEGG ID
class Array
  def filter_table_by_kegg(kegg)
    self.filter do |dt|
      dt["id"]["kegg"].nil? ? false : dh["id"]["kegg"].any?(kegg)
    end
  end
end

# Helper to read a JSON
def read_json(path)
  return JSON.parse(File.read(path).rstrip)
end

# Check if an array of IDs has at least one entry in common with another
def id_present?(table, other)
  return false if (table.nil? or other.nil?)
  return table.any?{|t| other.any?(t)}
end

# Apply a set of data from one entry to another (e.g. HMDB -> Table)
def apply_data(t:, h:, k:)
  # If new data nil, or current data a string, do not modify
  return t if (h[k].nil? or t[k].is_a?(String))
  # If old data nil, overwrite with new and return
  if t[k].nil?
    t[k] = h[k]
    return t
  end
  hkc = h[k].is_a?(String) ? [h[k]] : h[k]
  # Map over the new data and push to old if not already present
  hkc.map{|hk| t[k] << hk if not t[k].any?(hk)}
  return t
end

# Check and apply IDs between entries (e.g. HMDB -> Table)
def apply_ids(t:, h:)
  h.each do |k, val|
    t[k] = Array.new if t[k].nil?
    val.each{|v| t[k] << v if not t[k].any?(v)}
    t[k].sort!
  end
  return t
end

# Helper to print a somewhat-formatted message to the console during ops
def msg(type, text)
  case type
  when "exit"
    return "\033[31mEXIT  |\033[0m  #{text}\n"
  when "ok"
    return "\033[32m OK   |\033[0m  #{text}\n"
  when "warn"
    return "\033[33mWARN  |\033[0m  #{text}\n"
  else
    return "      |  #{text}\n"
  end
end

# Log version of msg (no shell control characters)
def log(type, text)
  case type
  when "exit"
    $log << "EXIT  |  #{text}\n"
  when "ok"
    $log << " OK   |  #{text}\n"
  when "warn"
    $log << "WARN  |  #{text}\n"
  else
    $log << "      |  #{text}\n"
  end
end


# Operations
# -----------------------------------------------------------------------------

# Initialise global log
$log = Array.new

# Define paths to walk
path = {
  :in => {
    :table => "../data/outAdd03Hmdb.json",
    :hmdb => "../data/outArrange03Hmdb.json"
  },
  :out => {
    :out => "../data/outAdd04Hmdb.json",
    :log => "../data/logAdd04Hmdb.txt"
  }
}

# Read in the table and the HMDB data, and define a set of keys to use later
table = read_json(path[:in][:table])
hmdb = read_json(path[:in][:hmdb])
key_set = ["smiles", "name", "alias"]

# Loop over the table
table.each.with_index do |dt, i|
  # Subset the data and kick (with a log warning) if not exactly one HMDB entry
  subset = hmdb.filter{|dh| id_present?(dt["id"]["kegg"], dh["id"]["kegg"])}
  l = subset.length
  if l != 1
    log("warn", "Table row #{i} matches #{l} HMDB data by KEGG ID")
    next
  end
  sub = subset[0]  # Shorthand
  # Loop over the keys in the key set and apply data
  key_set.each{|k| dt = apply_data(t: dt, h: sub, k: k)}
  # Apply the IDs data
  dt["id"] = apply_ids(t: dt["id"], h: sub["id"])
end

File.open(path[:out][:out], :mode => "w") do |file|
  file.write("#{JSON.pretty_generate(table)}\n")
end

File.open(path[:out][:log], :mode => "w") do |file|
  file.write($log.join(''))
end

exit 0
