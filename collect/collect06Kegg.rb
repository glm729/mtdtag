#!/usr/bin/env ruby


# Function definitions
# -----------------------------------------------------------------------------


# Request the KEGG REST API `list` operation for a specified department
def kegg_list(dept)
  return %x_curl "http://rest.kegg.jp/list/#{dept}" 2>/dev/null_.
    rstrip.
    split(/\n/).
    map{|t| t.split(/\t/)}
end

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


# Define output paths
path_out = {
  :klm => "../data/outCollect06Kegg_klm.txt",
  :klp => "../data/outCollect06Kegg_klp.txt",
}

# Request the `list` operation data (to get all IDs)
print("\033[7;34mRequesting KEGG List data\033[0m\n")
klm = kegg_list("module")
klp = kegg_list("pathway")

# Sort through the list data to get the target IDs
id = {
  :klm => klm.map{|k| k[0].gsub(/^path:map/, "rn")},
  :klp => klp.map{|k| k[0].gsub(/^md:/, "")},
}

# Initialise text store
tx = Hash.new

# Request all module and pathway data
print("\033[7;34mRequesting Module and Pathway data\033[0m\n")
id.keys.each do |key|
  tx[key] = group_array(id[key], 10).map.with_index do |idg, i|
    Thread.new do
      sleep(i * 0.200)
      %x_curl "#{kegg_get_uri(idg)}" 2>/dev/null_
    end
  end.each(&:join).map(&:value).join("")
end

# Write out
print("\033[7;36mWriting data\033[0m\n")
path_out.keys.each do |k|
  File.open(path_out[k], :mode => "w"){|f| f.write(tx[k])}
end

# All done
exit 0
