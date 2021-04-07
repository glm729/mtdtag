# Request:  Convert SMILES to SDF (Molfile)
#### Mr. George L. Malone
#### 7<sup>th</sup> of April, 2021


### Overview

The purpose of this request was to query the table data for a list of
metabolite names, and convert the SMILES codes into SDF / Molfile data.  The
operations were completed using the Ruby programming language.  Most data were
successfully converted.  Four compounds did not feature SMILES codes, and three
names did not match with any data in the table.  The overall number converted
was 15 out of the 20 input names.  This suggests that at least one name
featured more than one matching entry in the table data.


### Input data

Original input data were erroneous and had to be manually corrected.  Manual
searching of some names revealed further potential errors or non-conformant
naming conventions.  Some metabolites were potentially known under different
names, so the additional names were added to the corresponding row in the
formal input data.  Levo- variants of amino acids are preferred, so these were
edited in the formal input data.  The formal input data were a list of names in
a newline-separated text file, with a pipe character to separate multiple names
if present.

```
L-Alanine
Lactate|Lactic acid
Ethanol
NNN-Trimethyl-L-Lysine|N6,N6,N6-Trimethyl-L-Lysine
...
```


### Operations

The Ruby programming language was used to handle the data.  This decision was
made due to the simplicity of sending requests to the shell, and easily
retrieving and handling the results.  The JSON gem (package) is required to
parse the JSON containing the table data.

The input names file is read in and the text split by newline.  The resulting
array is mapped over, in which the text is pushed to lowercase and split by the
pipe character.  The resulting data are an array of arrays.  Each child array
may be of any length, but all are of length 1 or 2.  Each cell is a string,
being the name of the metabolite.

The table JSON is read in and parsed using the JSON gem.

For each name group in the input names data, the table is subset to the
relevant entries.  The subsetting operation is performed by searching for
exactly-matching strings in the array of aliases for each entry.  The output
array then has certain strings pushed to it, depending on the nature of the
subset data.

If the subset is of length 0 (i.e. no exactly-matching names), the output
string declares "NO DATA", and the operations move to the next metabolite.
Otherwise, the subset of entries is iterated over, and the SMILES code
extracted.  If the SMILES code is `nil`, the output string declares "NO
SMILES", and the operations continue to the next entry in the subset.  If the
SMILES code is present, a command is sent to the Open Babel command-line
utility to convert the SMILES code to SDF, and the resulting string is pushed
to the output string.

When all main operations are complete, the output file is written with the
array of output strings joined by newline.


### Results

Four matching names do not feature SMILES codes, suggesting that the names were
matched within data added from KEGG Compound, which do not feature SMILES
codes.  Three names did not match any aliases within the table.  A total of 15
SMILES codes were converted, out of the original 20 names or name groups
entered -- Citric acid and 1-Methylhistidine featured two entries each in the
table data, that is, feature two different SMILES codes for each alias.  The
duplicate entry for 1-Methylhistidine is due to a potential error in KEGG
Compound -- 1-Methylhistidine and 3-Methylhistidine feature the same KEGG
Compound ID.


### Operative script

```ruby
#!/usr/bin/env ruby


# Required packages
# -----------------------------------------------------------------------------

require("json")


# Function definitions
# -----------------------------------------------------------------------------

# Read the input names file
def readInputNames(path)
  return File.read(path).split(/\n/).map{|r| r.downcase.split(/\|/)}
end

# Read and parse the table JSON
def readTableJson(path)
  return JSON.parse(File.read(path).gsub(/\s+$/, ''))
end

# Subset the table according to the current name group
def subsetTable(table, names)
  out = Array.new()
  table.each do |t|
    al = t["alias"].map{|a| a.downcase}
    out << t if names.any?{|n| al.any?(n)}
  end
  return out
end

# Send a shell command to obabel
def obabelData(name, smiles, dim = "2")
  return %x_obabel -:"#{smiles}" -osdf --gen#{dim.to_s}D_
end

# String to return if no data for current metabolite
def ifNoData(name)
  return %Q_NAME:    #{name}\nSMILES:\n\nNO DATA\n$$$\n_
end

# Handle data if data present
def eachDatum(name, smiles, dim)
  store = Array.new()
  store << %Q_NAME:    #{name}\nSMILES:  #{smiles}_
  if smiles === nil
    store.last.rstrip!
    store << "\nNO SMILES\n$$$\n"
    return store
  end
  store << obabelData(name, smiles, dim)
  return store
end

# Get output to add to results array
def getOutput(name, data, dim)
  out = Array.new()
  if data.length === 0
    out << ifNoData(name)
    return out
  end
  data.each{|entry| eachDatum(name, entry["smiles"], dim).each{|e| out << e}}
  return out
end


# Read and parse files
# -----------------------------------------------------------------------------

# Read the required files
path = {
  :names => "../../sync/data/metabolite_name_list.txt",
  :table => "../../sync/data/reference/arrange02Table.json"
}

# Get the names and the table data
names = readInputNames(path[:names])
table = readTableJson(path[:table])


# Operations
# -----------------------------------------------------------------------------

# Initialise results array
output = Array.new()

# For each name
names.each do |n|
  # Subset the table and push the data to the output array
  sub = subsetTable(table, n)
  getOutput(n.join("; "), sub, dim = "2").each{|o| output << o}
end

# Open the output file and write the string
File.open("./opRequest00SmilesSdf.txt", :mode => "w") do |f|
  f.write(output.join("\n"))
end

# Operations complete
exit(0)
```
