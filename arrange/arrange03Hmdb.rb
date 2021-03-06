#!/usr/bin/env ruby


# Required packages
# -----------------------------------------------------------------------------

require "json"


# Function definitions
# -----------------------------------------------------------------------------

def arrange_id(entry)
  entry_out = Hash.new
  exclude_keys = ["smiles", "name"]
  loop_keys = entry.keys.reject{|k| exclude_keys.any?(k)}
  exclude_keys.each do |key|
    if entry[key].length > 1
      raise RuntimeError, "Too many of datum #{key} for entry"
    end
    entry_out[key] = entry[key][0]
  end
  loop_keys.each do |key|
    if key.to_s.match?(/^id_/)
      entry_out["id"] = Hash.new if entry_out["id"].nil?
      key_new = key.to_s.match(/^id_(?<db>.+)/)[:db]
      entry_out["id"][key_new] = entry[key].sort
    else
      entry_out[key] = entry[key].sort
    end
  end
  return entry_out
end


# Operations
# -----------------------------------------------------------------------------

path = {
  :in => "../data/hmdbDataExtracted.json",
  :out => "../data/outArrange03Hmdb.json"
}

data = JSON.parse(File.read(path[:in]).rstrip)

result = data.map{|d| arrange_id(d)}

File.open(path[:out], :mode => "w") do |file|
  file.write("#{JSON.pretty_generate(result)}\n")
end

exit 0
