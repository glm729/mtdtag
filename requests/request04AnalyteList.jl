#!/usr/bin/env julia

# Gentlemen, start your engines
println("\e[34mInitialising\e[0m")


# Required packages
# -----------------------------------------------------------------------------

using EzXML


# Function definitions
# -----------------------------------------------------------------------------

# Core function for collecting XML data per the input spec
function collect_data(root, spec)
  local ns = namespace(root)
  local obj = Dict{String,Any}()
  for s in spec
    f = findall(s.xpath, root, ["x" => ns])  # Hardcoded as x!
    if length(f) === 0
      obj[s.name] = nothing
      continue
    end
    if length(f) > 1
      println(
        "\e[33mWARN |\e[0m  Spec. \"$(s.name)\" entries Gt1, using first"
      )
    end
    obj[s.name] = nodecontent(f[1])
  end
  return obj
end

# Abstracted reducer function to collapse the data into a TSV string array
function reduce_data_tsv(acc, crt, headers)
  local out = Array{String,1}()
  for h in headers
    push!(out, get(crt, h, ""))
  end
  return push!(acc, join(out, "\t"))
end


# Operations
# -----------------------------------------------------------------------------

# Prepare variables to use throughout
println("\e[34mAssigning common variables\e[0m")

# Paths in and out
path = Dict{Symbol,Dict{Symbol,String}}(
  :in => Dict{Symbol,String}(:dir => "../../hmdb_data/all_split/"),
  :out => Dict{Symbol,String}(:out => "../data/outRequest04AnalyteList.tsv"),
)

# Headers for the output TSV
headers_tsv = [
  "RT",
  "Formula",
  "Name",
  "CCS [M+H]+",
  "CCS [M-H]-",
  "KEGG",
  "CAS",
  "PubChem",
  "ChemSpider",
  "HMDB",
  "BioCyc",
  "Metlin",
  "UserID",
  "InChI"
]

# Define the name-xpath specification pairs
pf = "//x:metabolite"  # Shorthand
spec = [
  (name = "Formula", xpath = "$pf/x:chemical_formula"),
  (name = "Name", xpath = "$pf/x:name"),
  (name = "KEGG", xpath = "$pf/x:kegg_id"),
  (name = "CAS", xpath = "$pf/x:cas_registry_number"),
  (name = "PubChem", xpath = "$pf/x:pubchem_compound_id"),
  (name = "ChemSpider", xpath = "$pf/x:chemspider_id"),
  (name = "HMDB", xpath = "$pf/x:accession"),
  (name = "BioCyc", xpath = "$pf/x:biocyc_id"),
  (name = "Metlin", xpath = "$pf/x:metlin_id"),
  (name = "InChI", xpath = "$pf/x:inchi"),
]

# Here we go then
println("\e[36mCollecting data\e[0m")

# Get it all
data = map(
  f -> collect_data(root(readxml("$(path[:in][:dir])/$f")), spec),
  readdir(path[:in][:dir])
)

# That wasn't too bad
println("\e[36mReducing output string\e[0m")

# Get it ready
out = reduce(
  (a, c) -> reduce_data_tsv(a, c, headers_tsv),
  data;
  init = ["$(join(headers_tsv, "\t"))"]
)

# Send it here
println("\e[32mWriting file:  $(path[:out][:out])\e[0m")

# Scribble
open(path[:out][:out], "w") do file
  write(file, "$(join(out, "\n"))\n")
end

# I am properly amazed at how fast and effortless that was!  Took less than a
# minute to cross 114,000+ entries.  Ruby scripts to do the same, which
# themselves were pretty quick considering previous attempts, took somewhere
# around 15 minutes (which is entirely to be expected with this volume of
# data).  I am very impressed with the capabilities of Julia!
