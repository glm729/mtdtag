#!/usr/bin/env ruby


# Package requirements
# -----------------------------------------------------------------------------


require "json"


# Function definitions
# -----------------------------------------------------------------------------


# Split the raw KEGG text and convert to a Hash
def split_text(tx)
  ck = ""
  op = Array.new
  ob = Hash.new
  sp = tx.split(/\n/)
  sp.each do |t|
    if t === "///"
      ob.each{|k, v| ob[k] = v.reject(&:empty?)}
      op << ob
      ob = Hash.new
      next
    end
    m = t.match(/^(?<k>[A-Z]+)/)
    if m.nil?
      ob[ck] << t.strip
      next
    end
    ck = m[:k].downcase
    ob[ck] = [t[(m[:k].length..t.length)].strip]
  end
  return op
end

# Get the reaction IDs from the component within KEGG Module data
def km_get_reacid(data)
  return data.map{|d| d.scan(/(?<r>R\d{5})/)}.flatten.sort
end

# Get the module IDs from the component within KEGG Pathway data
def kp_get_modid(data)
  return data.map{|d| d.scan(/(?<m>M\d{5})/)}.flatten.sort
end

# Abstracted reducer to collapse reaction IDs by module
def km_reduce_reacid(acc, crt)
  return acc if crt["reaction"].nil?
  k = crt["entry"][0].match(/^(?<id>M\d{5})/)[:id]
  r = km_get_reacid(crt["reaction"])
  return acc if r.empty?
  acc[k] = r
  return acc
end

# Abstracted reducer to collapse module IDs by pathway
def kp_reduce_modid(acc, crt)
  return acc if crt["module"].nil?
  k = crt["entry"][0].match(/^(?<id>(map|rn)\d{5})/)[:id]
  m = kp_get_modid(crt["module"])
  return acc if m.empty?
  acc[k] = m
  return acc
end

# Get the reaction IDs per pathway ID (combine kmr and kpm)
def get_path_reac(mod_reac, path_mod)
  out = Hash.new
  path_mod.each do |path, mods|
    out[path] = Array.new
    mods.each do |mod|
      next if mod_reac[mod].nil?
      mod_reac[mod].each do |reac|
        out[path] << reac if not out[path].any? reac
      end
    end
  end
  return out.reject{|k, v| v.empty?}
end


# Operations
# -----------------------------------------------------------------------------


# Define paths
path = {
  :in => {
    :klm => "../data/outCollect06Kegg_klm.txt",
    :klp => "../data/outCollect06Kegg_klp.txt",
  },
  :out => {
    :kmr => "../data/outArrange07Kegg_kmr.json",
    :kpm => "../data/outArrange07Kegg_kpm.json",
    :kpr => "../data/outArrange07Kegg_kpr.json",
  },
}

# Read the raw text files
text = Hash.new
path[:in].each{|k, v| text[k] = File.read(v).rstrip};
# text=path[:in].to_a.reduce(Hash.new){|a,c|a[c[0]]=File.read(c[1]).rstrip;a}

# Convert the text to hash
data = Hash.new
text.each{|k, v| data[k] = split_text(v)};

# Extract the reactions per module
mod_reac = data[:klm].reduce(Hash.new){|a, c| km_reduce_reacid(a, c)}

# Extract the modules per pathway
path_mod = data[:klp].reduce(Hash.new){|a, c| kp_reduce_modid(a, c)}

# Get the reactions per pathway
path_reac = get_path_reac(mod_reac, path_mod)

# Put the output data in a common spot
out = {
  :kmr => "#{JSON.pretty_generate(mod_reac)}\n",
  :kpm => "#{JSON.pretty_generate(path_mod)}\n",
  :kpr => "#{JSON.pretty_generate(path_reac)}\n",
}

# Write out
path[:out].each{|k, v| File.open(v, :mode => "w"){|f| f.write(out[k])}}

# Finished!
exit 0
