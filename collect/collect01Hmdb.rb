#!/usr/bin/env ruby


# Required packages
# -----------------------------------------------------------------------------


require "nokogiri"
require "json"


# Function definitions
# -----------------------------------------------------------------------------


# Read the file contents and parse as XML
def parseXml(path)
  file = File.read(path).gsub(/\s+$/, '')
  return Nokogiri::XML(file).remove_namespaces!
end

# Collect all XML data of interest, according to spec xpathSet
def getXmlData(xml, xpathSet)
  output = Hash.new
  xpathSet.each do |key, xp|
    data = xml.xpath(xp)
    text = data.map(&:text).reject(&:empty?)
    next if text.length === 0
    output[key] = text
  end
  return output
end


# Operations
# -----------------------------------------------------------------------------


# Set variables
dir = File.read("../data/hmdb_data_store.txt").rstrip
fileOut = "../data/hmdbDataExtracted.json"

# Get the directory entries and get the referenced IDs
dirEntries = Dir.entries(dir).reject{|e| e.match?(/^\.\.?$/)}
idHmdb = dirEntries.map{|e| e.match(/^(?<id>HMDB\d+)(?=\.xml$)/)[:id]}.sort

# Initialise results array
result = Array.new

# Shorthand for common prefix
pf = "//metabolite"

# Define the xpath set
xpathSet = {
  :smiles => "#{pf}/smiles",
  :name => "#{pf}/name",
  :alias => "#{pf}/synonyms/synonym",
  :id_cas => "#{pf}/cas_registry_number",
  :id_chebi => "#{pf}/chebi_id",
  :id_chemspider => "#{pf}/chemspider_id",
  :id_hmdb => "#{pf}/accession",
  :id_hmdb_other => "#{pf}/secondary_accessions/accession",
  :id_inchi => "#{pf}/inchi",
  :id_inchikey => "#{pf}/inchikey",
  :id_kegg => "#{pf}/kegg_id",
  :id_pubchem => "#{pf}/pubchem_compound_id"
}

# For each HMDB ID:  parse the XML, collect the data, push to the results
idHmdb.each do |id|
  xml = parseXml(%Q[#{dir}#{id}.xml])
  result << getXmlData(xml, xpathSet)
end

# Write out
File.open(fileOut, :mode => "w") do |file|
  file.write("#{JSON.pretty_generate(result)}\n")
end

# Finished
exit 0
