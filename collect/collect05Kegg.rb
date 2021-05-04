#!/usr/bin/env ruby


# Function definitions
# -----------------------------------------------------------------------------


# Helper function to group an array by chunks of a specified size
def group_array(array, size)
  out = [[]]
  idx = 0
  array.each do |a|
    if out[idx].length == size
      out << []
      idx += 1
    end
    out[idx] << a
  end
  return out
end

# Generate a KEGG REST API `get` operation URI
def kegg_get_uri(tx)
  base = "http://rest.kegg.jp/get/"
  return base + tx.join("+") if tx.is_a? Array
  return base + tx if tx.is_a? String
  print "\033[7;31mObject class not applicable:\033[0m  #{tx.class}\n"
  raise RuntimeError, "Object class not applicable"
end


# Operations
# -----------------------------------------------------------------------------


# Set the output path
path_op = "../data/outCollect05Kegg.txt"

# Request and reformat KEGG List Reaction
print("\033[7;34mRequesting KEGG List Reaction\033[0m\n")
lr = %x_curl "http://rest.kegg.jp/list/reaction" 2>/dev/null_.
  split(/\n/).
  map{|e| e.split(/\t/)}

# Extract the reaction IDs from KEGG List Reaction
print("\033[7;34mExtracting Reaction IDs\033[0m\n")
ids_reac = lr.reduce(Array.new){|a, c| a << c[0].gsub(/^rn:/, '')}
# ^ All are ordered and unique, no need to filter or sort

# Group the IDs in tens
print("\033[7;34mGrouping Reaction IDs\033[0m\n")
ids_grp = group_array(ids_reac, 10)

# Request the text in groups across threads, then get values and connect
print("\033[7;36mRequesting KEGG Reaction data\033[0m\n")
text = ids_grp.map.with_index do |idg, i|
  Thread.new do
    sleep(i * 0.200)  # Spread them out a bit to avoid wrecking the server(s)
    %x_curl "#{kegg_get_uri(idg)}" 2>/dev/null_
  end
end.each(&:join).map(&:value).join("")

# Write the text out (process it later, separation of concerns, etc.)
print("\033[7;36mWriting output file\033[0m\n")
File.open(path_op, :mode => "w"){|file| file.write(text)}

# Finished
print("\033[7;32mOperations complete\033[0m\n")
exit 0
