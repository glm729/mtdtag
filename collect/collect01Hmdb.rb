#!/usr/bin/env ruby


# Required packages
# -----------------------------------------------------------------------------


require("nokogiri")
require("json")


# Function definitions
# -----------------------------------------------------------------------------


# Read the file contents and parse as XML
def parseXml(path)
  file = File.read(path).gsub(/\s+$/, '')
  return(Nokogiri::XML(file).remove_namespaces!)
end

# Collect all XML data of interest, according to spec xpathSet
def getXmlData(xml, xpathSet)
  output = Hash.new()
  xpathSet.each do |key, xp|
    data = xml.xpath(xp)
    if data.empty?
      output[key] = [nil]
      next
    end
    text = data.map(&:text).reject{|e| e == ''}
    if text.length == 0
      output[key] = [nil]
      next
    end
    output[key] = text
  end
  return(output)
end


# Operations
# -----------------------------------------------------------------------------


# Set variables
dir = "../data/hmdb_all_split/"
fileOut = "../data/hmdbDataExtracted.json"

# jsonOpt = {
#   :array_nl => "\n",
#   :object_nl => "\n",
#   :indent => "  ",
#   :space => " "
# }
# ^ Decided to minimise filesize, so keeping JSON condensed

# Get the directory entries and get the referenced IDs
dirEntries = Dir.entries(dir).reject{|e| e.match?(/^\.\.?$/)}
idHmdb = dirEntries.map{|e| e.match(/^(?<id>HMDB\d+)(?=\.xml$)/)[:id]}.sort

# Initialise results array
result = Array.new()

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
  data = getXmlData(xml, xpathSet)
  result << data
end

# Write out
File.open(fileOut, :mode => "w"){|f| f.write(JSON.generate(result))}

# Finished
exit(0)
