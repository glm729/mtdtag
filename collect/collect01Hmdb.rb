#!/usr/bin/env ruby


# Required packages
# -----------------------------------------------------------------------------


require "nokogiri"
require "json"


# Function definitions
# -----------------------------------------------------------------------------


# Read the file contents and parse as XML
def read_xml(path)
  Nokogiri::XML(File.read(path).rstrip).remove_namespaces!
end

# Collect all XML data of interest, according to spec xpathSet
def get_data(xml, xpath_set)
  output = Hash.new
  xpath_set.each do |key, xp|
    data = xml.xpath(xp)
    text = data.map(&:text).reject(&:empty?)
    next if text.length === 0
    output[key] = key === "Alias" ? text : text[0]
  end
  output
end

# Helper to print a message in the console during ops
def msg(ty, tx)
  f = {
    :exit => "\033[7;31m EXIT \033[0m ",
    :ok   => "\033[7;32m  OK  \033[0m ",
    :warn => "\033[7;33m WARN \033[0m ",
    :info => "\033[7;34m INFO \033[0m ",
  }
  print("#{f[ty]}#{tx}\n")
  nil
end


# Operations
# -----------------------------------------------------------------------------


# Define file paths to use
path = {
  :in => "../../hmdb/data/hmdb_metabolites",
  :out => "../_data/outCollect01Hmdb.json"
}

# Shorthand for common prefix
pf = "//metabolite"

# Define the xpath set
xpaths = {
  "SMILES" => "#{pf}/smiles",
  "Name" => "#{pf}/name",
  "Alias" => "#{pf}/synonyms/synonym",
  "Molecular Formula" => "#{pf}/chemical_formula",
  "KEGG ID" => "#{pf}/kegg_id",
  "HMDB ID" => "#{pf}/accession",
  "CAS Registry Number" => "#{pf}/cas_registry_number",
  "InChI" => "#{pf}/inchi",
  "InChI Key" => "#{pf}/inchikey",
  "ChEBI ID" => "#{pf}/chebi_id",
  "ChemSpider ID" => "#{pf}/chemspider_id",
  "PubChem ID" => "#{pf}/pubchem_compound_id",
}

# Get the directory entries and get the referenced IDs
msg(:info, "Filtering directory entries")
dir_entries = Dir.entries(path[:in]).reject{|e| e.match?(/^\.\.?$/)}
id_hmdb = dir_entries.map{|e| e.match(/^(?<id>HMDB\d+)(?=\.xml$)/)[:id]}.sort

# For each HMDB ID:  parse the XML, collect the data, push to the results
msg(:info, "Collecting data")
result = id_hmdb.map do |id|
  get_data(read_xml(%Q`#{path[:in]}/#{id}.xml`), xpaths)
end

# Write out
msg(:info, "Writing output file")
File.open(fileOut, :mode => "w") do |file|
  file.write("#{JSON.pretty_generate(result)}\n")
end

# Finished
msg(:ok, "End of operations")
exit 0
