#!/usr/bin/env ruby
# I'm rather pleased with this script.


# Required packages
# -----------------------------------------------------------------------------

require "json"


# Function definitions
# -----------------------------------------------------------------------------

# Abstracted filter function for filtering the initial table
def filterTable(entry)
  # Must frown
  return false if not entry["smiles"].nil?
  # Can be identified
  return false if entry["id"].nil?
  # Personal computer
  return false if entry["id"]["pubchem"].nil?
  # Passed
  return true
end

# Abstracted reducer function to split the shortlist into two components
def reduceShortlist(acc, crt)
  idp = crt["id"]["pubchem"]
  if idp.length > 1
    acc[:tmi] << crt
  else
    acc[:req] << idp[0]
  end
  return acc
end

# Helper to generate a PUG REST URI for a PubChem Compound CID
def pcCompoundUri(id)
  return "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/#{id}/json"
end

# Function to request and classify PubChem Compound data
def requestPubchemCompound(id)
  out = {:id => id, :data => nil, :code => nil}
  data = %x_curl "#{pcCompoundUri(id)}" 2>/dev/null_
  if data.empty?
    out[:code] = 9
    return out
  end
  parsed = JSON.parse(data)
  if parsed["Fault"].nil?
    out[:code] = 0
  else
    pfc = parsed["Fault"]["Code"]
    out[:code] = 1 if pfc === "PUGREST.ServerBusy"
    out[:code] = 2 if pfc === "PUGREST.NotFound"
  end
  out[:code] = 9 if out[:code].nil?
  out[:data] = parsed
  return out
end


# Operations
# -----------------------------------------------------------------------------

# Initialise paths to use
path = {
  :in => "../data/outArrange02Table.json",
  :out => "../data/outCollect04Pubchem_rb.json"
}

# Read and parse the table JSON, and shortlist
parsed = JSON.parse(File.read(path[:in]).rstrip)
shortlist = parsed.filter{|p| filterTable(p)}

# Initialise shortlist reducer initial value, and reduce the shortlist
init_slr = {:req => Array.new, :tmi => Array.new}
data = shortlist.reduce(init_slr){|a, c| reduceShortlist(a, c)}

# If any data with more than one PubChem ID, flag and write out
if data[:tmi].length > 0
  l = data[:tmi].length
  s = (l === 1) ? "y" : "ies"
  fsTmi = {
    :name => "../data/outCollect04Pubchem_excessPubchemIds.json",
    :data => "#{JSON.pretty_generate(data[:tmi])}\n"
  }
  print("\e[33m#{l} entr#{s} with Gt1 PubChem ID\e[0m\n")
  File.open(fsTmi[:name], :mode => "w") do |file|
    file.write(fsTmi[:data])
  end
end

# Sort the IDs to request (probably not necessary, ultimately)
data[:req].sort!

# Initialise pass index and data store
pn = 0
store = {
  :toGet => data[:req],
  :found => Array.new,
  :notFound => Array.new,
  :unknownError => Array.new
}

# While there are still IDs to collect and check
while store[:toGet].length > 0
  # Increment pass index and get shorthand store[:toGet].length
  pn += 1
  sl = store[:toGet].length
  # Bit of output
  print([
    "\e[34mInitialising PubChem Compound request pass #{pn}:\n",
    "  #{sl} to retrieve\n",
    "  Estimated time\n",
    "    #{(sl * 0.200).to_i} seconds\n",
    "    (#{(sl * 0.200 / 60).ceil} minutes)\n"
  ].join(''))
  # Request the data, using threads
  pass = store[:toGet].map.with_index do |id, i|
    Thread.new do
      sleep(i * 0.200)  # No more than 5 per second, as asked
      requestPubchemCompound(id)
    end
  end.each(&:join).map(&:value)
  # Check over the results
  pass.each do |p|
    c = p[:code]  # Shorthand
    # Shift data around depending on outcome code
    if c != 1
      store[:unknownError] << p if c === 9
      store[:notFound] << p[:id] if c === 2
      store[:found] << {:id => p[:id], :data => p[:data]} if c === 0
      store[:toGet].reject!{|t| t === p[:id]}
    end
  end
end

# Kick off toGet
store.reject!{|k, v| k === :toGet}

# Note final results
print([
  "  \e[7;36mAll data requested\e[0m\n",
  "\e[32mSuccessful:\e[0m      #{store[:found].length}\n",
  "\e[33mNot found:\e[0m       #{store[:notFound].length}\n",
  "\e[35mUnknown errors:\e[0m  #{store[:unknownError].length}\n"
].join(''))

# Write out to the given path
File.open(path[:out], :mode => "w") do |file|
  file.write("#{JSON.pretty_generate(store)}\n")
end

# Tell the viewer about the results file
print("\e[36mResults written to file:\e[0m  #{path[:out]}\n")

# Goodbye
exit 0
