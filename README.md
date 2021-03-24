# Metabolite Data Aggregator
#### Mr. George L. Malone
#### 23<sup>rd</sup> of March, 2021


### Overview

This repository contains the components of a method for aggregating metabolite
data into a table or set of tables, typically defined as JSON.


### Construct

Initial construction of the table required the use of a JSON containing data
from PathBank (the arrangement and formatting of which is described [here][1])
and the output from the [KEGG REST API][2] operation `/list/compound`.


### Addition

Additional data in the table was gathered from the original PathBank JSON, such
that more identifiers could be attributed to each unique SMILES code.
Currently, in addition to the KEGG ID, each SMILES code now features a CAS
Registry number, ChEBI ID, HMDB ID, and InChI ID (and Key), where present.


[1]: https://github.com/glm729/cheminfo_general/tree/master/convertPathbankCsv
[2]: https://www.kegg.jp/kegg/rest/keggapi.html
