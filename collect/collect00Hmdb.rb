#!/usr/bin/env ruby

# See:  https://github.com/glm729/splitHmdbXml


# Function definitions
# -----------------------------------------------------------------------------

# Generate the output XML string
def xmlOutputText(xmlContentArr)
  # Header rows
  start = [
    %Q_<?xml version="1.0" encoding="UTF-8"?>\n_,
    %Q_<hmdb xmlns="http://www.hmdb.ca">\n_
  ]
  # Main content
  content = xmlContentArr.join('')
  # String end
  strEnd = "</hmdb>\n"
  # Return combined string
  return(%Q_#{start.join('')}#{content}#{strEnd}_)
end

# Helper function to write out the XML string
def writeXml(out, toDir)
  # Check if the ID is nil
  id = (out[:id].nil?) ? "IDNA_#{$idna.to_s.rjust(7, "0")}" : out[:id]
  # Check that the output directory string ends with a slash
  toDir = "#{toDir}/" if not toDir.match?(/\/$/)
  # Write the string to a file
  File.write("#{toDir}#{id}.xml", xmlOutputText(out[:text]), :mode => "w")
end


# Operations
# -----------------------------------------------------------------------------

# DEBUG
# $STOP = 0

# Set global variable for nil-ID count
$idna = 0

# Initialise output data hash
out = {:id => nil, :text => Array.new()}

# Set variables
xmlPath = "../data/hmdb_metabolites.xml"
dirOut = "../data/hmdb_all_split/"

# For each row in the file
File.foreach(xmlPath) do |row|
  # Skip if document opening or closing row
  next if row.match?(/^\<\/?(hmdb|\?xml)/)
  # Push the row to the output data
  out[:text] << row
  # If the ID is currently nil, check for a match in the current row
  if out[:id].nil?
    m = row.match(/\<accession\>(?<id>HMDB\d+)\<\/accession\>/)
    out[:id] = m[:id] if not m.nil?
  end
  # If closing the metabolite data
  if row.match?(/^\<\/metabolite\>/)
    # Write out, and reset variables
    writeXml(out, dirOut)
    $idna += 1 if out[:id].nil?
    out = {:id => nil, :text => Array.new()}
    # DEBUG
    # $STOP += 1
    # break if $STOP > 9
  end
end

print("Operations complete.\n")
exit(0)
